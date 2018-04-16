const { resolve } = require('path')
const merge = require('lodash/merge')
const i18nExtensions = require('vue-i18n-extensions')
const { generateRoutes } = require('./routes')

module.exports = function (moduleOptions) {
  const defaults = {
    noPrefixDefaultLocale: true,
    differentDomains: false,
    seo: true,
    loadLanguagesAsync: false,
    langDir: 'lang/',
    langFiles: {},
    ignorePaths: [],
    detectBrowserLanguage: false,
    redirectCookieKey: 'redirected',
    useRedirectCookie: true,
    beforeLanguageSwitch: (oldLocale, newLocale) => {},
    onLanguageSwitched: (oldLocale, newLocale) => {}
  }
  const options = merge(defaults, moduleOptions, this.options.i18n)

  this.extendRoutes((routes) => {
    const newRoutes = generateRoutes({
      baseRoutes: routes,
      locales: options.locales,
      defaultLocale: options.defaultLocale,
      routesOptions: options.routes,
      noPrefixDefaultLocale: options.noPrefixDefaultLocale,
      differentDomains: options.differentDomains,
      redirectRootToLocale: options.redirectRootToLocale,
      ignorePaths: options.ignorePaths
    })
    routes.splice(0, routes.length)
    routes.unshift(...newRoutes)
  })

  // i18n utils
  this.addTemplate({
    src: resolve(__dirname, './templates/i18n.utils.js'),
    fileName: 'i18n.utils.js',
    options
  })

  // i18n plugin
  this.addPlugin({
    src: resolve(__dirname, './templates/i18n.plugin.js'),
    fileName: 'i18n.plugin.js',
    options
  })

  // Routing utils
  this.addPlugin({
    src: resolve(__dirname, './templates/i18n.routes.utils.js'),
    fileName: 'i18n.routes.utils.js',
    options
  })

  // Routing plugin
  this.addPlugin({
    src: resolve(__dirname, './templates/i18n.routing.plugin.js'),
    fileName: 'i18n.routing.plugin.js',
    options
  })

  // SEO plugin
  if (options.seo) {
    this.addPlugin({
      src: resolve(__dirname, './templates/i18n.seo.plugin.js'),
      fileName: 'i18n.seo.plugin.js',
      options
    })
  }

  // Middleware
  this.addTemplate({
    src: resolve(__dirname, './templates/i18n.routing.middleware.js'),
    fileName: 'i18n.routing.middleware.js',
    options
  })
  this.options.router.middleware.push('i18n')

	// vendor is deprecated in nuxt-edge
  if (this.options.build.vendor) this.options.build.vendor.push('vue-i18n')

  this.options.render.bundleRenderer.directives = this.options.render.bundleRenderer.directives || {}
  this.options.render.bundleRenderer.directives.t = i18nExtensions.directive
}
