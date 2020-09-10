---
title: Opciones
description: 'Aquí están todas las opciones disponibles al configurar el módulo y sus valores predeterminados:'
position: 4
category: Guía
---

You can configure **nuxt-i18n** with the `i18n` property in your `nuxt.config.js` or by passing options inline with the module declaration:

```js{}[nuxt.config.js]
export default {
  modules: [
    'nuxt-i18n',
  ],
  i18n: {
    // Options
  },
}

// or

export default {
  modules: [
    ['nuxt-i18n', {
      // Options
    }],
  ],
}
```

The former approach has the benefit of having having type-checking enabled if you have followed the [Typscript setup](./setup#typescript).

## Properties

## `baseUrl`

- type: `string`
- default: `''`

The fallback base URL to use as a prefix for alternate URLs in `hreflang` tags. By default VueRouter's base URL will be used and only if that is not available, fallback URL will be used. Can also be a function (will be passed a Nuxt Context as a parameter) that returns a string. Useful to make base URL dynamic based on request headers.

<alert type="info">

It's especially important to set this option when using SEO features, in which case it's required that generated SEO tags use fully-qualified URLs.

</alert>

## `locales`

- type: `array`
- default: `[]`

List of locales supported by your app. Can either be an array of codes (`['en', 'fr', 'es']`) or an array of objects for more complex configurations:

```js
[
  { code: 'en', iso: 'en-US', file: 'en.js' },
  { code: 'fr', iso: 'fr-FR', file: 'fr.js' },
  { code: 'es', iso: 'es-ES', file: 'es.js' }
]
```

When using an object form, the properties can be:
- `code` (**required**) - unique identifier of the locale
- `iso` (required when using SEO features) - The ISO code used for SEO features. Should be in one of those formats:
  * ISO 639-1 code (e.g. `'en'`)
  * ISO 639-1 and ISO 3166-1 alpha-2 codes, separated by hyphen (e.g. `'en-US'`)
- `file` (required when using `lazy`) - the name of the file. Will be resolved relative to `langDir` path when loading locale messages lazily
- `domain` (required when using `differentDomains`) - the domain name you'd like to use for that locale (including the port if used)
- `...` - any custom property set on the object will be exposed at runtime. This can be used, for example, to define the language name for the purpose of using it in a language selector on the page.

## `defaultLocale`

- type: `string` or `null`
- default: `null`

The app's default locale. Should match code of one of defined `locales`.

When using `prefix_except_default` strategy, URLs for locale specified here won't have a prefix. **It's recommended to set this to some locale** regardless of chosen strategy, as it will be used as a fallback locale when navigating to a non-existent route.

## `strategy`

- type: `string`
- default: `'prefix_except_default'`

Routes generation strategy. Can be set to one of the following:
- `'no_prefix'`: routes won't have a locale prefix
- `'prefix_except_default'`: locale prefix added for every locale except default
- `'prefix'`: locale prefix added for every locale
- `'prefix_and_default'`: locale prefix added for every locale and default

## `lazy`

- type: `boolean`
- default: `false`

Whether the translations should be lazy-loaded. If this is enabled, you MUST configure `langDir` option, and locales must be an array of objects, each containing a `file` key.

Loading locale messages lazily means that only messages for currently used locale (and potentially of the default locale, if different from current locale) will be loaded on page loading.

## `langDir`

- type: `string` or `null`
- default: `null`

Directory that contains translation files when lazy-loading messages. This CAN NOT be empty if lazy-loading is enabled. Use Webpack paths like `~/locales/` (with trailing slash).

## `detectBrowserLanguage`

- type: `object`
- default: `{ alwaysRedirect: false, fallbackLocale: '', onlyOnRoot: false, useCookie: true, cookieCrossOrigin: false, cookieDomain: null, cookieKey: 'i18n_redirected', cookieSecure: false }`

Enables browser language detection to automatically redirect visitors to their preferred locale as they visit your site for the first time.
Set to false to disable.

<alert type="info">

Note that for better SEO it's recommended to set `onlyOnRoot` to true.

</alert>

Supported properties:
- `alwaysRedirect` (default: `false`) - Set to always redirect to the value stored in the cookie, not just on first visit.
- `fallbackLocale` (default: `null`) - If none of the locales match the browser's locale, use this one as a fallback.
- `onlyOnRoot` (default: `false`) - Set to `true` (recommended for improved SEO) to only attempt to detect the browser locale on the root path (`/`) of the site. Only effective when using strategy other than `'no_prefix'`.
- `useCookie` (default: `true`) - If enabled, a cookie is set once the user has been redirected to browser's preferred locale, to prevent subsequent redirections. Set to `false` to redirect every time.
- `cookieKey` (default: `'i18n_redirected'`) - Cookie name.
- `cookieDomain` (default: `null`) - Set to override the default domain of the cookie. Defaults to the **host** of the site.
- `cookieCrossOrigin` (default: `false`) - When `true`, sets the flags `SameSite=None; Secure` on the cookie to allow cross-domain use of the cookie (required when app is embedded in an iframe).
- `cookieSecure` (default: `false`) - Sets the `Secure` flag for the cookie.
},

## `rootRedirect`

- type: `string` or `object` or `null`
- default: `null`

Set to a path to which you want to redirect users accessing the root URL (`/`). Accepts either a string or an object with `statusCode` and `path` properties. E.g

```js
{
  statusCode: 301,
  path: 'about-us'
}
```

## `seo`

- type: `boolean`
- default: `false`

If `true`, a SEO metadata will be generated for the routes. Note that performance can suffer with this option enabled and there might be compatibility issues with some plugins. The recommended way is to set up SEO as described in [Improving performance](./seo#improving-performance).

## `differentDomains`

- type: `boolean`
- default: `false`

Set this to `true` when using different domains for each locale. If enabled, no prefix is added to your routes and you MUST configure locales as an array of objects, each containing a `domain` key. Refer to the [Different domains](./different-domains) for more information.

## `parsePages`

- type: `boolean`
- default: `true`

Whether [custom paths](./routing#custom-paths) are extracted from page files using babel parser.

## `pages`

- type: `object`
- default: `{}`

If `parsePages` option is disabled, the module will look for custom routes in the `pages` option. Refer to the [Routing](./routing)  for usage.

## `vuex`

- type: `object`
- default: `{ moduleName: 'i18n', syncLocale: false, syncMessages: false, syncRouteParams: true }`

Registers a store module used for syncing app's i18n state. Set to `false` to disable.

Properties:
- `moduleName` (default: `'i18n'`) - The module's namespace.
- `syncLocale` (default: `false`) - If enabled, current app's locale is synced with **nuxt-i18n** store module.
- `syncMessages` (default: `false`) - If enabled, current translation messages are synced with **nuxt-i18n** store module. **This will make the page response bigger so don't use unless necessary.**
- `syncRouteParams` (default: `true`) - Enables a `setRouteParams` mutation for using custom route names with dynamic routes. See more information in [Dynamic route parameters](./lang-switcher#dynamic-route-parameters)

## `vueI18n`

- type: `object`
- default: `{}`

Configuration for the `vue-i18n` library that is used internally but this module. See full documentation at http://kazupon.github.io/vue-i18n/api/#constructor-options

<alert type="info">

It's also supported to set this property to a path to a local configuration file. The file needs to export a function or plain object. If a function, it will be passed a Nuxt Context as a parameter. It's necessary to use that approach when overriding more complex types (like functions) that can't be stringified correctly.

```js{}[~/plugins/vue-i18n.js]
export default context => {
  return {
    modifiers: {
      snakeCase: (str) => str.split(' ').join('-')
    }
  }
}
```

</alert>

## `vueI18nLoader`

- type: `boolean`
- default: `false`

If true, [vue-i18n-loader](https://github.com/intlify/vue-i18n-loader) is added to Nuxt's Webpack config, allowing to define locale messages per-page using a custom `i18n` block.

## `beforeLanguageSwitch`

- type: `function`
- default: `(oldLocale, newLocale) => {}`

A listener called right before app's locale changes.

## `onLanguageSwitched`

- type: `function`
- default: `(oldLocale, newLocale) => {}`

A listener called after app's locale has changed.

## `defaultLocaleRouteNameSuffix`

- type: `string`
- default: `'default'`

Internal suffix added to generated route names for default locale, if strategy is `prefix_and_default`. You shouldn't need to change this.

## `routesNameSeparator`

- type: `string`
- default: `'___'`

Internal separator used for generated route names for each locale. You shouldn't need to change this.
