---
title: Migration guide
description: Follow this guide to upgrade from one major version to the other.
position: 14
category: Guide
---

Follow this guide to upgrade from one major version to the other.

## Upgrading from 6.x to 7.x

### `beforeLanguageSwitch` has been replaced by `onBeforeLanguageSwitch`

### `NuxtVueI18n` has been removed. Use individually exported types instead.

### `$nuxtI18nSeo` has been removed. Use `$nuxtI18nHead({ addDirAttribute: true, addSeoAttributes: true })` instead.

### `onlyOnNoPrefix` has been removed. It's features are combined into `onlyOnRoot` instead.

## Upgrading from 5.x to 6.x

### Global SEO features are now disabled by default

In some cases, having SEO enabled globally caused performance issues and/or conflicted with other plugins. To mitigate these issues, SEO features are now disabled by default.

If you were affected by one of the issues above, we recommend that you read the [Improve performances](/seo#improving-performance) section to enable SEO only where you need it.

If you'd like to restore the old behaviour, you can reenable SEO features globally by setting the `seo` option to `true`:

```js
{
  seo: true
}
```

### preserveState can't be set anymore

It was previously possible to manually set `preserveState` on **nuxt-i18n**'s store module, which would actually result in unexpected behaviours when using server-side rendering. This option has been removed altogether and the module's `preserveState` option is now [set automatically](https://github.com/nuxt-community/i18n-module/blob/05e9d1f80715cc23a545adf4303e49af3ee40ac3/src/plugins/main.js#L77).

If you were using the `preserveState` configuration option before, it can be safely removed:

```diff
 {
   vuex: {
-    preserveState: true,
     // other configuration options
   }
 }
```

### Store module options have been flattened and renamed

The `vuex` configuration option used to expose a `mutations` property where each mutation could be disabled or renamed. For the sake of simplicity, it isn't possible to rename these mutations anymore, the `mutations` property has been dropped to flatten the configuration and each option has been renamed to better reflect what it does.

```diff
 {
   vuex: {
-    mutations: {
-      setLocale: 'SET_LOCALE_MUTATION',
-      setMessages: 'SET_MESSAGE_MUTATION',
-      setRouteParams: 'SET_ROUTE_PARAMS_MUTATION'
-    }
+    syncLocale: true,
+    syncMessages: true,
+    syncRouteParams: true
   },
 }
 ```

## Upgrading from 4.x to 5.x

Please refer to [**vue-i18n**'s changelog](https://github.com/kazupon/vue-i18n/blob/dev/CHANGELOG.md#800-2018-06-23) for more information on breaking changes in **nuxt-i18n 5.x**.

## Upgrading from 3.x to 4.x

### In-component options key

v4.x introduces a single change that requires you to rename the `i18n` key to `nuxtI18n` in your pages that use in-component configuration, this should prevent conflicts with vue-i18n.

**3.x:**

```js {}[pages/about.vue]
export default {
  i18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

**4.x:**

```js {}[pages/about.vue]
export default {
  nuxtI18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

## Upgrading from 2.x to 3.x

### Custom routes

The `routes` option has been dropped in favor of in-component configuration, any custom path configuration should be placed in their corresponding page file.

**2.x:**

```js {}[nuxt.config.js]
{
  modules: [
    ['nuxt-i18n', {
      routes: {
        about: {
          fr: '/a-propos',
          en: '/about-us'
        }
      }
    }]
  ]
}
```

**3.x:**

```js {}[pages/about.vue]
export default {
  i18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

### Ignored paths


The `ignorePaths` option has been dropped as well, its behaviour can be reproduces by setting `i18n` to `false` right in your pages.

**2.x:**

```js {}[nuxt.config.js]
{
  modules: [
    ['nuxt-i18n', {
      ignorePaths: [
        '/fr/notlocalized'
      ]
    }]
  ]
}
```

**3.x:**

```js {}[pages/fr/notlocalized.vue]
export default {
  i18n: false
}
```

### noPrefixDefaultLocale

The `noPrefixDefaultLocale` has been dropped in favor of `strategy` option.


**2.x:**

```js {}[nuxt.config.js]
{
  modules: [
    ['nuxt-i18n', {
      noPrefixDefaultLocale: false
    }]
  ]
}
```

**3.x:**

```js {}[nuxt.config.js]

{
  modules: [
    ['nuxt-i18n', {
      strategy: 'prefix'
    }]
  ]
}
```

### loadLanguagesAsync

`loadLanguagesAsync` option has been renamed to `lazy`. `langFile` option in `locales` has been renamed to `file`.

### redirectCookieKey & useRedirectCookie

`redirectCookieKey` and `useRedirectCookie` have been merged into `detectBrowserLanguage` option and renamed to `cookieKey` and `useCookie` respectively.

**2.x:**

```js {}[nuxt.config.js]
{
  modules: [
    ['nuxt-i18n', {
      detectBrowserLanguage: true,
      redirectCookieKey: 'redirected',
      useRedirectCookie: true
    }]
  ]
}
```

**3.x:**

```js {}[nuxt.config.js]
{
  modules: [
    ['nuxt-i18n', {
      detectBrowserLanguage: {
        cookieKey: 'redirected',
        useCookie: true
      }
    }]
  ]
}
```
