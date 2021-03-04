const { STRATEGIES } = require('./constants')
const { extractComponentOptions } = require('./components')
const { getPageOptions, getLocaleCodes } = require('./utils')

exports.makeRoutes = (baseRoutes, {
  defaultLocale,
  defaultLocaleRouteNameSuffix,
  differentDomains,
  includeUprefixedFallback,
  locales,
  pages,
  pagesDir,
  parsePages,
  routesNameSeparator,
  strategy,
  trailingSlash
}) => {
  locales = getLocaleCodes(locales)
  let localizedRoutes = []

  const buildLocalizedRoutes = (route, routeOptions = {}, isChild = false, isExtraRouteTree = false) => {
    const routes = []
    let pageOptions

    // Skip route if it is only a redirect without a component.
    if (route.redirect && !route.component) {
      return route
    }

    // Extract i18n options from page
    if (parsePages) {
      pageOptions = extractComponentOptions(route.component)
    } else {
      pageOptions = getPageOptions(route, pages, locales, pagesDir, defaultLocale)
    }

    // Skip route if i18n is disabled on page
    if (pageOptions === false) {
      return route
    }

    // Component's specific options
    const componentOptions = {
      locales,
      ...pageOptions,
      ...routeOptions
    }
    // Double check locales to remove any locales not found in pageOptions
    // This is there to prevent children routes being localized even though
    // they are disabled in the configuration
    if (typeof componentOptions.locales !== 'undefined' && componentOptions.locales.length > 0 &&
        typeof pageOptions.locales !== 'undefined' && pageOptions.locales.length > 0) {
      componentOptions.locales = componentOptions.locales.filter((locale) => pageOptions.locales.includes(locale))
    }

    // Generate routes for component's supported locales
    for (let i = 0, length1 = componentOptions.locales.length; i < length1; i++) {
      const locale = componentOptions.locales[i]
      const { name } = route
      let { path } = route
      const localizedRoute = { ...route }

      // Make localized route name. Name might not exist on parent route if child has same path.
      if (name) {
        localizedRoute.name = name + routesNameSeparator + locale
      }

      // Generate localized children routes if any
      if (route.children) {
        localizedRoute.children = []
        for (let i = 0, length1 = route.children.length; i < length1; i++) {
          localizedRoute.children = localizedRoute.children.concat(buildLocalizedRoutes(route.children[i], { locales: [locale] }, true, isExtraRouteTree))
        }
      }

      // Get custom path if any
      if (componentOptions.paths && componentOptions.paths[locale]) {
        path = componentOptions.paths[locale]
      }

      const isDefaultLocale = locale === defaultLocale

      // For PREFIX_AND_DEFAULT strategy and default locale:
      // - if it's a parent route, add it with default locale suffix added (no suffix if route has children)
      // - if it's a child route of that extra parent route, append default suffix to it
      if (isDefaultLocale && strategy === STRATEGIES.PREFIX_AND_DEFAULT) {
        if (!isChild) {
          const defaultRoute = { ...localizedRoute, path }

          if (name) {
            defaultRoute.name = localizedRoute.name + routesNameSeparator + defaultLocaleRouteNameSuffix
          }

          if (defaultRoute.children) {
            // Recreate child routes with default suffix added
            defaultRoute.children = []
            for (const childRoute of route.children) {
              // isExtraRouteTree argument is true to indicate that this is extra route added for PREFIX_AND_DEFAULT strategy
              defaultRoute.children = defaultRoute.children.concat(buildLocalizedRoutes(childRoute, { locales: [locale] }, true, true))
            }
          }

          routes.push(defaultRoute)
        } else if (isChild && isExtraRouteTree && name) {
          localizedRoute.name += routesNameSeparator + defaultLocaleRouteNameSuffix
        }
      }

      const isChildWithRelativePath = isChild && !path.startsWith('/')

      // Add route prefix if needed
      const shouldAddPrefix = (
        // No prefix if app uses different locale domains
        !differentDomains &&
        // No need to add prefix if child's path is relative
        !isChildWithRelativePath &&
        // Skip default locale if strategy is PREFIX_EXCEPT_DEFAULT
        !(isDefaultLocale && strategy === STRATEGIES.PREFIX_EXCEPT_DEFAULT)
      )

      if (shouldAddPrefix) {
        path = `/${locale}${path}`
      }

      // - Follow Nuxt and add or remove trailing slashes depending on "router.trailingSlash`
      // - If "router.trailingSlash" is not specified then default to no trailing slash (like Nuxt)
      // - Children with relative paths must not start with slash so don't append if path is empty.
      if (path.length) { // Don't replace empty (child) path with a slash!
        path = path.replace(/\/+$/, '') + (trailingSlash ? '/' : '') || (isChildWithRelativePath ? '' : '/')
      }

      if (shouldAddPrefix && isDefaultLocale && strategy === STRATEGIES.PREFIX && includeUprefixedFallback) {
        routes.push({
          ...route
        })
      }

      localizedRoute.path = path

      routes.push(localizedRoute)
    }

    return routes
  }

  for (let i = 0, length1 = baseRoutes.length; i < length1; i++) {
    const route = baseRoutes[i]
    localizedRoutes = localizedRoutes.concat(buildLocalizedRoutes(route, { locales }))
  }

  try {
    const { sortRoutes } = require('@nuxt/utils-edge')
    localizedRoutes = sortRoutes(localizedRoutes)
  } catch (error) {
    // Ignore
  }

  return localizedRoutes
}
