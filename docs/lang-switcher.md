# Lang Switcher

When **nuxt-i18n** loads in your app, it adds your `locales` configuration to `app.$i18n`, which makes it really easy to display a lang switcher anywhere in your app.

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
