import cookie from 'cookie'
import has from 'lodash.has'
import middleware from './middleware'

middleware['i18n'] = function ({ app, req, res, route, params, redirect, error, hotReload }) {
  const locales = <%= JSON.stringify(options.locales) %>
  const localeCodes = locales.map(l => l.code)
  const defaultLocale = '<%= options.defaultLocale %>'
  // Check if middleware called from hot-reloading, ignore
  if (hotReload) return
  // Handle / redirection
  if (
    route.path === '/' &&
    '<%= options.redirectRootToLocale %>' &&
    !('<%= options.redirectRootToLocale %>' === '<%= options.defaultLocale %>' && <%= options.noPrefixDefaultLocale %> === true) &&
    localeCodes.includes('<%= options.redirectRootToLocale %>')) {
    redirect('/<%= options.redirectRootToLocale %>/')
  }

  // Handle browser language detection
  if (<%= options.detectBrowserLanguage %> && req && route.name) {
    const cookieKey = '<%= options.redirectCookieKey %>';
    const cookies = has(req, 'headers.cookie') ? cookie.parse(req.headers.cookie) : {};
    // Redirect only if cookie not set yet
    if (!cookies[cookieKey]) {
      const browserLocale = req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2)
      // Set cookie
      if (res) {
        const date = new Date();
        const redirectCookie = cookie.serialize(cookieKey, 1, {
          expires: new Date(date.setDate(date.getDate() + 365))
        })
        res.setHeader('Set-Cookie', redirectCookie);
      }
      // Redirect
      if (browserLocale !== app.i18n.locale && localeCodes.indexOf(browserLocale) !== -1) {
        app.i18n.locale = browserLocale
        redirect(app.localePath(Object.assign({}, route , {
          name: app.getRouteBaseName()
        })));
      }
    }
  }

  // Get locale from params
  let locale = defaultLocale
  locales.forEach(l => {
    const regexp = new RegExp('^/' + l.code + '(/.+)?')
    if (route.path.match(regexp)) {
      locale = l.code
    }
  })
  if (locales.findIndex(l => l.code === locale) === -1) {
    return error({ message: 'Page not found.', statusCode: 404 })
  }
  if (locale === app.i18n.locale) return
  if (<%= options.loadLanguagesAsync %>) {
    const { loadLanguageAsync } = require('./i18n.utils')
    loadLanguageAsync(app.i18n, locale)
      .then(() => {
        app.i18n.locale = locale
      })
  } else {
    app.i18n.locale = locale
  }
}
