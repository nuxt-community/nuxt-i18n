import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { nuxtI18nHead, nuxtI18nSeo } from './head-meta'
import { Constants, nuxtOptions, options } from './options'
import {
  createLocaleFromRouteGetter,
  getLocaleCookie,
  getLocaleDomain,
  getLocalesRegex,
  matchBrowserLocale,
  parseAcceptLanguage,
  setLocaleCookie
} from './utils-common'
import { loadLanguageAsync, resolveBaseUrl, registerStore, syncVuex } from './plugin.utils'
// @ts-ignore
import { joinURL } from '~i18n-ufo'
// @ts-ignore
import { klona } from '~i18n-klona'

Vue.use(VueI18n)

/** @type {import('@nuxt/types').Plugin} */
export default async (context) => {
  const { app, route, store, req, res, redirect } = context

  if (options.vuex && store) {
    registerStore(store, options.vuex, options.localeCodes)
  }

  const { lazy } = options
  const injectInNuxtState = lazy && (lazy === true || lazy.skipNuxtState !== true)

  if (process.server && injectInNuxtState) {
    const devalue = (await import('devalue')).default
    context.beforeNuxtRender(({ nuxtState }) => {
      /** @type {Record<string, import('vue-i18n').LocaleMessageObject>} */
      const langs = {}
      const { fallbackLocale, locale } = app.i18n
      if (locale && locale !== fallbackLocale) {
        // @ts-ignore Using internal API to avoid unnecessary cloning.
        const messages = app.i18n._getMessages()[locale]
        if (messages) {
          try {
            devalue(messages)
            langs[locale] = messages
          } catch {
            // Ignore - client-side will load the chunk asynchronously.
          }
        }
      }
      nuxtState.__i18n = { langs }
    })
  }

  const {
    alwaysRedirect,
    fallbackLocale,
    onlyOnNoPrefix,
    onlyOnRoot,
    useCookie,
    cookieKey,
    cookieDomain,
    cookieSecure,
    cookieCrossOrigin
  } = /** @type {Required<import('../../types').DetectBrowserLanguageOptions>} */(options.detectBrowserLanguage)

  /**
   * @param {string | undefined} newLocale
   * @param {{ initialSetup?: boolean }} [options=false]
   */
  const loadAndSetLocale = async (newLocale, { initialSetup = false } = {}) => {
    if (!newLocale) {
      return
    }

    // Abort if different domains option enabled
    if (!initialSetup && app.i18n.differentDomains) {
      return
    }

    const oldLocale = app.i18n.locale

    if (newLocale === oldLocale) {
      return
    }

    const localeOverride = app.i18n.onBeforeLanguageSwitch(oldLocale, newLocale, initialSetup, context)
    if (localeOverride && app.i18n.localeCodes.includes(localeOverride)) {
      if (localeOverride === oldLocale) {
        return
      }
      newLocale = localeOverride
    }

    if (!initialSetup) {
      app.i18n.beforeLanguageSwitch(oldLocale, newLocale)
    }

    if (useCookie) {
      app.i18n.setLocaleCookie(newLocale)
    }

    if (options.langDir) {
      const i18nFallbackLocale = app.i18n.fallbackLocale

      if (options.lazy) {
        // Load fallback locale(s).
        if (i18nFallbackLocale) {
        /** @type {Promise<void>[]} */
          let localesToLoadPromises = []
          if (Array.isArray(i18nFallbackLocale)) {
            localesToLoadPromises = i18nFallbackLocale.map(fbLocale => loadLanguageAsync(context, fbLocale))
          } else if (typeof i18nFallbackLocale === 'object') {
            if (i18nFallbackLocale[newLocale]) {
              localesToLoadPromises = localesToLoadPromises.concat(i18nFallbackLocale[newLocale].map(fbLocale => loadLanguageAsync(context, fbLocale)))
            }
            if (i18nFallbackLocale.default) {
              localesToLoadPromises = localesToLoadPromises.concat(i18nFallbackLocale.default.map(fbLocale => loadLanguageAsync(context, fbLocale)))
            }
          } else if (newLocale !== i18nFallbackLocale) {
            localesToLoadPromises.push(loadLanguageAsync(context, i18nFallbackLocale))
          }
          await Promise.all(localesToLoadPromises)
        }
        await loadLanguageAsync(context, newLocale)
      } else {
        // Load all locales.
        await Promise.all(options.localeCodes.map(locale => loadLanguageAsync(context, locale)))
      }
    }

    app.i18n.locale = newLocale
    /** @type {import('../../types').LocaleObject} */
    const newLocaleProperties = options.normalizedLocales.find(l => l.code === newLocale) || { code: newLocale }
    // In case certain locale has more properties than another, reset all the properties.
    for (const key of Object.keys(app.i18n.localeProperties)) {
      app.i18n.localeProperties[key] = undefined
    }
    // Copy properties of the new locale
    for (const [key, value] of Object.entries(newLocaleProperties)) {
      Vue.set(app.i18n.localeProperties, key, klona(value))
    }

    if (options.vuex) {
      await syncVuex(store, newLocale, app.i18n.getLocaleMessage(newLocale), options.vuex)
    }

    // Must retrieve from context as it might have changed since plugin initialization.
    const { route } = context
    const redirectPath = getRedirectPathForLocale(route, newLocale)

    if (initialSetup) {
      // Redirect will be delayed until middleware runs as redirecting from plugin does not
      // work in SPA (https://github.com/nuxt/nuxt.js/issues/4491).
      app.i18n.__redirect = redirectPath
    } else {
      app.i18n.onLanguageSwitched(oldLocale, newLocale)

      if (redirectPath) {
        redirect(redirectPath)
      }
    }
  }

  const getLocaleFromRoute = createLocaleFromRouteGetter(options.localeCodes, {
    routesNameSeparator: options.routesNameSeparator,
    defaultLocaleRouteNameSuffix: options.defaultLocaleRouteNameSuffix
  })

  /**
   * Gets the redirect path for locale.
   *
   * @param {import("vue-router").Route} route
   * @param {string | undefined} locale
   * @return {string} The redirect path for locale.
   */
  const getRedirectPathForLocale = (route, locale) => {
    // Redirects are ignored if it is a nuxt generate.
    if (process.static && process.server) {
      return ''
    }

    if (!locale || app.i18n.differentDomains || options.strategy === Constants.STRATEGIES.NO_PREFIX) {
      return ''
    }

    if (getLocaleFromRoute(route) === locale) {
      // If "onlyOnRoot" or "onlyOnNoPrefix" is set and strategy is "prefix_and_default", prefer unprefixed route for
      // default locale.
      if (!(onlyOnRoot || onlyOnNoPrefix) || locale !== options.defaultLocale || options.strategy !== Constants.STRATEGIES.PREFIX_AND_DEFAULT) {
        return ''
      }
    }

    // At this point we are left with route that either has no or different locale.
    let redirectPath = app.switchLocalePath(locale)

    if (!redirectPath) {
      // Current route could be 404 in which case attempt to find matching route for given locale.
      redirectPath = app.localePath(route.fullPath, locale)
    }

    if (!redirectPath || redirectPath === route.fullPath || redirectPath.startsWith('//')) {
      return ''
    }

    return redirectPath
  }

  /**
   * Called by middleware on navigation (also on the initial one).
   *
   * @type {import('../../types/internal').onNavigateInternal}
   */
  const onNavigate = async route => {
    // Handle root path redirect
    if (route.path === '/' && options.rootRedirect) {
      let statusCode = 302
      let path = options.rootRedirect

      if (typeof options.rootRedirect !== 'string') {
        statusCode = options.rootRedirect.statusCode
        path = options.rootRedirect.path
      }

      return [statusCode, `/${path}`, /* preserve query */true]
    }

    const storedRedirect = app.i18n.__redirect
    if (storedRedirect) {
      app.i18n.__redirect = null
      return [302, storedRedirect]
    }

    const resolveBaseUrlOptions = {
      differentDomains: options.differentDomains,
      normalizedLocales: options.normalizedLocales
    }
    app.i18n.__baseUrl = resolveBaseUrl(options.baseUrl, context, app.i18n.locale, resolveBaseUrlOptions)

    const finalLocale =
      (options.detectBrowserLanguage && doDetectBrowserLanguage(route)) ||
      getLocaleFromRoute(route) || app.i18n.locale || app.i18n.defaultLocale || ''

    if (options.skipSettingLocaleOnNavigate) {
      app.i18n.__pendingLocale = finalLocale
      app.i18n.__pendingLocalePromise = new Promise(resolve => {
        app.i18n.__resolvePendingLocalePromise = resolve
      })
    } else {
      await app.i18n.setLocale(finalLocale)
    }

    return [null, null]
  }

  const finalizePendingLocaleChange = async () => {
    if (!app.i18n.__pendingLocale) {
      return
    }
    await app.i18n.setLocale(app.i18n.__pendingLocale)
    app.i18n.__resolvePendingLocalePromise('')
    app.i18n.__pendingLocale = null
  }

  const waitForPendingLocaleChange = async () => {
    if (app.i18n.__pendingLocale) {
      await app.i18n.__pendingLocalePromise
    }
  }

  const getBrowserLocale = () => {
    if (process.client && typeof navigator !== 'undefined' && navigator.languages) {
      // Get browser language either from navigator if running on client side, or from the headers
      return matchBrowserLocale(options.normalizedLocales, navigator.languages)
    } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
      return matchBrowserLocale(options.normalizedLocales, parseAcceptLanguage(req.headers['accept-language']))
    } else {
      return undefined
    }
  }

  /**
   * @param {import('vue-router').Route} route
   * @return {string} Returns the browser locale that was detected or an empty string otherwise.
   */
  const doDetectBrowserLanguage = route => {
    // Browser detection is ignored if it is a nuxt generate.
    if (process.static && process.server) {
      return ''
    }

    if (options.strategy !== Constants.STRATEGIES.NO_PREFIX) {
      if (onlyOnRoot) {
        if (route.path !== '/') {
          return ''
        }
      } else if (onlyOnNoPrefix) {
        if (!alwaysRedirect && route.path.match(getLocalesRegex(options.localeCodes))) {
          return ''
        }
      }
    }

    let matchedLocale

    if (useCookie && (matchedLocale = app.i18n.getLocaleCookie())) {
      // Get preferred language from cookie if present and enabled
    } else {
      // Try to get locale from either navigator or header detection
      matchedLocale = getBrowserLocale()
    }

    const finalLocale = matchedLocale || fallbackLocale

    // Handle cookie option to prevent multiple redirections
    if (finalLocale && (!useCookie || alwaysRedirect || !app.i18n.getLocaleCookie())) {
      if (finalLocale !== app.i18n.locale) {
        return finalLocale
      }
    }

    return ''
  }

  /**
   * Extends the newly created vue-i18n instance with nuxt-i18n properties.
   *
   * @param {import('vue-i18n').IVueI18n} i18n
   */
  const extendVueI18nInstance = i18n => {
    i18n.locales = klona(options.locales)
    i18n.localeCodes = klona(options.localeCodes)
    i18n.localeProperties = Vue.observable(klona(options.normalizedLocales.find(l => l.code === i18n.locale) || { code: i18n.locale }))
    i18n.defaultLocale = options.defaultLocale
    i18n.differentDomains = options.differentDomains
    i18n.beforeLanguageSwitch = options.beforeLanguageSwitch
    i18n.onBeforeLanguageSwitch = options.onBeforeLanguageSwitch
    i18n.onLanguageSwitched = options.onLanguageSwitched
    i18n.setLocaleCookie = locale => setLocaleCookie(locale, res, { useCookie, cookieDomain, cookieKey, cookieSecure, cookieCrossOrigin })
    i18n.getLocaleCookie = () => getLocaleCookie(req, { useCookie, cookieKey, localeCodes: options.localeCodes })
    i18n.setLocale = (locale) => loadAndSetLocale(locale)
    i18n.getBrowserLocale = () => getBrowserLocale()
    i18n.finalizePendingLocaleChange = finalizePendingLocaleChange
    i18n.waitForPendingLocaleChange = waitForPendingLocaleChange
    i18n.__baseUrl = app.i18n.__baseUrl
    i18n.__pendingLocale = app.i18n.__pendingLocale
    i18n.__pendingLocalePromise = app.i18n.__pendingLocalePromise
    i18n.__resolvePendingLocalePromise = app.i18n.__resolvePendingLocalePromise
  }

  // Set instance options
  const vueI18nOptions = typeof options.vueI18n === 'function' ? await options.vueI18n(context) : klona(options.vueI18n)
  vueI18nOptions.componentInstanceCreatedListener = extendVueI18nInstance
  // @ts-ignore
  app.i18n = context.i18n = new VueI18n(vueI18nOptions)
  // Initialize locale and fallbackLocale as vue-i18n defaults those to 'en-US' if falsey
  app.i18n.locale = ''
  app.i18n.fallbackLocale = vueI18nOptions.fallbackLocale || ''
  extendVueI18nInstance(app.i18n)
  const resolveBaseUrlOptions = {
    differentDomains: options.differentDomains,
    normalizedLocales: options.normalizedLocales
  }
  app.i18n.__baseUrl = resolveBaseUrl(options.baseUrl, context, '', resolveBaseUrlOptions)
  app.i18n.__onNavigate = onNavigate

  Vue.prototype.$nuxtI18nSeo = nuxtI18nSeo
  Vue.prototype.$nuxtI18nHead = nuxtI18nHead

  if (store) {
    // Inject in store.
    store.$i18n = app.i18n

    if (store.state.localeDomains) {
      for (const locale of app.i18n.locales) {
        if (typeof (locale) === 'string') {
          continue
        }
        locale.domain = store.state.localeDomains[locale.code]
      }
    }
  }

  /** @type {string | undefined} */
  let finalLocale = options.detectBrowserLanguage ? doDetectBrowserLanguage(route) : ''

  if (!finalLocale) {
    const { vuex } = options
    if (vuex && vuex.syncLocale && store && store.state[vuex.moduleName].locale !== '') {
      finalLocale = store.state[vuex.moduleName].locale
    } else if (app.i18n.differentDomains) {
      const domainLocale = getLocaleDomain(options.normalizedLocales, req)
      finalLocale = domainLocale
    } else if (options.strategy !== Constants.STRATEGIES.NO_PREFIX) {
      const routeLocale = getLocaleFromRoute(route)
      finalLocale = routeLocale
    }
  }

  if (!finalLocale && useCookie) {
    finalLocale = app.i18n.getLocaleCookie()
  }

  if (!finalLocale) {
    finalLocale = app.i18n.defaultLocale || ''
  }

  await loadAndSetLocale(finalLocale, { initialSetup: true })

  if (process.client && process.static && nuxtOptions.isUniversalMode) {
    const [_, redirectTo] = await onNavigate(context.route)
    if (redirectTo) {
      location.assign(joinURL(context.base, redirectTo))
    }
  }
}
