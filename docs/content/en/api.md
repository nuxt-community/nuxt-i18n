---
title: API Reference
description: 'API Reference'
position: 20
category: Api
---

## Extension of Vue

<alert type="info">

All [Vue I18n properties and methods](http://kazupon.github.io/vue-i18n/api/#vue-injected-methods) (like `$t`, `$i18n`, `v-t` directive and others) are also available even though they are not listed here. Below are only the ones that are added by `nuxt-i18n`.

</alert>

### Methods

#### localePath

  - **Arguments**:
    - route (type: `string` | [`Location`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125))
    - locale (type: `string`, default: current locale)
  - **Returns**: `string`

  Returns localized path for passed in `route`. If `locale` is not specified, uses current locale.

  See also [Basic usage - nuxt-link](../basic-usage#nuxt-link).

#### switchLocalePath

  - **Arguments**:
    - locale: (type: `string`)
  - **Returns**: `string`

  Returns path of the current route for specified `locale`.

  See also [Basic usage - nuxt-link](../basic-usage#nuxt-link).

  See type definition for [Location](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125).

#### getRouteBaseName

  - **Arguments**:
    - route (type: [`Route`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L135), default: current route)
  - **Returns**: `string`

  Returns base name of current (if argument not provided) or passed in `route`. Base name is name of the route without locale suffix and other metadata added by `nuxt-i18n`.

#### localeRoute <Badge text="v6.12.0+" />

  - **Arguments**:
    - route (type: `string` | [`Location`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125))
    - locale (type: `string`, default: current locale)
  - **Returns**: [`Location`](https://github.com/vuejs/vue-router/blob/f40139c27a9736efcbda69ec136cb00d8e00fa97/types/router.d.ts#L125) | `undefined`

  Returns localized location for passed in `route`. If `locale` is not specified, uses current locale.

  See also [Basic usage - nuxt-link](../basic-usage#nuxt-link).

#### $nuxtI18nSeo

  - **Arguments**:
    - no arguments
  - **Returns**: `NuxtI18nSeo`

  SEO object provided mostly for use with [SEO - Improving Performance](../seo#improving-performance).

## Extension of VueI18n

<alert type="info">

Instance of [VueI18n class](http://kazupon.github.io/vue-i18n/api/#vuei18n-class) (see its [properties and methods](http://kazupon.github.io/vue-i18n/api/#properties)) is exposed as `$i18n` on Vue instance and Vuex Store but as `i18n` on Nuxt `context.app`.

</alert>

### Methods

#### getLocaleCookie

  - **Arguments**:
    - no arguments
  - **Returns**: `string | undefined`

  Returns locale code from stored locale cookie.

#### setLocaleCookie

  - **Arguments**:
    - locale (type: `string`)
  - **Returns**: `undefined`

  Updates stored locale cookie with specified locale code. Consider using `setLocale` instead if you want to switch locale.

#### setLocale <Badge text="v6.1.0+" />

  - **Arguments**:
    - locale (type: `string`)
  - **Returns**: `Promise<undefined>`

  Switches locale of the app to specified locale code. If `useCookie` option is enabled, locale cookie will be updated with new value. If prefixes are enabled (`strategy` other than `no_prefix`), will navigate to new locale's route.

### Properties

#### defaultLocale

  - **Type**: `string`

  Default locale as specified in options.

#### locales

  - **Type**: `Array<string | LocaleObject>`

  List of locales as defined in options.

#### differentDomains

  - **Type**: `boolean`

  Whether `differentDomains` option is enabled.

#### beforeLanguageSwitch

  - **Type**: `Function`

  See [callbacks](../callbacks)

#### onLanguageSwitched

  - **Type**: `Function`

  See [callbacks](../callbacks)

## Extension of Nuxt Context

### context.app.i18n

  - **Type**: [`VueI18n`](#extension-of-vuei18n)

See also [Nuxt context](https://nuxtjs.org/guides/concepts/context-helpers).

Can be accessed from `asyncData` and wherever `context` is available.

Example use:

```js
export default Vue.extend({
  asyncData({ app }) {
    const locale = app.i18n.locale

    return {
      locale
    }
  }
})
````

## Extension of Vuex

### $i18n

  - **Type**: [`VueI18n`](#extension-of-vuei18n)

Can be accessed in store's actions and mutations as `this.$i18n`.

Example use:

```js
export const actions = {
  nuxtServerInit({ commit }) {
    commit('LOCALE', this.$i18n.locale)
  }
}
````
