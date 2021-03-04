import { resolve } from 'path'

/** @type {import('@nuxt/types').NuxtConfig} */
const config = {
  rootDir: resolve(__dirname, '../..'),
  dev: false,
  telemetry: false,
  build: {
    babel: {
      presets ({ isServer }) {
        return [
          [
            require.resolve('@nuxt/babel-preset-app-edge'),
            {
              buildTarget: isServer ? 'server' : 'client',
              corejs: { version: 3 }
            }
          ]
        ]
      }
    },
    quiet: true
  },
  render: {
    resourceHints: false
  },
  modules: [
    resolve(__dirname, '../..')
  ],
  i18n: {
    seo: true,
    baseUrl: 'nuxt-app.localhost',
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    lazy: false,
    vueI18nLoader: true,
    vueI18n: {
      messages: {
        fr: {
          home: 'Accueil',
          about: 'À propos',
          posts: 'Articles',
          dynamic: 'Dynamique'
        },
        en: {
          home: 'Homepage',
          about: 'About us',
          posts: 'Posts',
          dynamic: 'Dynamic'
        }
      },
      fallbackLocale: 'en'
    },
    vuex: {
      syncLocale: true,
      syncMessages: true
    }
  }
}

export default config
