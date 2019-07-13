# Lang Switcher

When **nuxt-i18n** loads in your app, it adds your `locales` configuration to `this.$i18n` (or `app.i18n`), which makes it really easy to display a lang switcher anywhere in your app.

Here's an example lang switcher where a `name` key has been added to each locale object in order to display friendlier titles for each link:

```vue
<nuxt-link
  v-for="locale in availableLocales"
  :key="locale.code"
  :to="switchLocalePath(locale.code)">{{ locale.name }}</nuxt-link>
```

```js
computed: {
  availableLocales () {
    return this.$i18n.locales.filter(i => i.code !== this.$i18n.locale)
  }
}
```

```js
// nuxt.config.js

['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      name: 'English'
    },
    {
      code: 'es',
      name: 'Español'
    },
    {
      code: 'fr',
      name: 'Français'
    }
  ]
}]
```

If `detectBrowserLanguage.useCookie` and `detectBrowserLanguage.alwaysRedirect` options are enabled, you might want to persist change to locale by calling `this.$i18n.setLocaleCookie(locale)` (or `app.i18n.setLocaleCookie(locale)`) method. Otherwise locale will switch back to saved one during navigation.

## Dynamic route parameters

Dealing with dynamic route parameters requires a bit more work because you need to provide parameters translations to **nuxt-i18n**. For this purpose, **nuxt-i18n**'s store module exposes a `routeParams` state property that will be merged with route params when generating lang switch routes with `switchLocalePath()`.

> NOTE: Make sure that Vuex [is enabled](https://nuxtjs.org/guide/vuex-store) in your app and that you did not set `vuex` option to `false` in **nuxt-i18n**'s options.

To provide dynamic parameters translations, dispatch the `i18n/setRouteParams` as early as possible when loading a page, eg:

```vue
<template>
  <!-- pages/_slug.vue -->
</template>

<script>
export default {
  async asyncData ({ app, store }) {
    const params = await new Promise(resolve => {
      resolve({
        en: { slug: 'my-post' },
        fr: { slug: 'mon-article' },
      })
    })
    store.dispatch('i18n/setRouteParams', params)
    return {
      // your data
    }
  }
}
</script>
```

> NOTE: **nuxt-i18n** won't reset parameters translations for you, this means that if you use identical parameters for different routes, navigating between those routes might result in conflicting parameters. Make sure you always set params translations in such cases.
