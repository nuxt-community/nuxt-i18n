import { resolve } from 'path'
import { readFileSync } from 'fs'
import { generate, setup, loadConfig, get, url } from '@nuxtjs/module-test-utils'
import { JSDOM } from 'jsdom'
import { withoutTrailingSlash, withTrailingSlash } from 'ufo'
import { getSeoTags } from './utils'

/**
 * @typedef {any} Nuxt
 * @typedef {import('@nuxt/types').NuxtConfig} NuxtConfig
 */

/** @param {string} html */
const getDom = html => (new JSDOM(html)).window.document

describe('locales as string array', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const overrides = { i18n: { seo: false } }
    const testConfig = loadConfig(__dirname, 'no-lang-switcher', overrides, { merge: true })
    // Override those after merging to overwrite original values.
    testConfig.i18n.locales = ['en', 'fr']

    nuxt = (await setup(testConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('renders default locale', async () => {
    const html = await get('/about')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: About us')
  })

  test('renders non-default locale', async () => {
    const html = await get('/fr/about')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: À propos')
  })

  test('dir attribute will not be added to the html element', async () => {
    const html = await get('/about')
    const dom = getDom(html)
    expect(dom.documentElement.getAttribute('dir')).toBeNull()
  })

  test('nuxtI18nHead does not set SEO Meta', async () => {
    const html = await get('/about')
    const dom = getDom(html)
    const seoTags = getSeoTags(dom)
    expect(seoTags).toEqual([])
  })
})

describe('differentDomains enabled', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        differentDomains: true,
        seo: false,
        defaultDirection: 'auto'
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', override, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        domain: 'en.nuxt-app.localhost',
        dir: 'ltr'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        domain: 'fr.nuxt-app.localhost'
      },
      {
        code: 'ru',
        iso: 'ru-RU',
        name: 'Русский',
        domain: 'https://ru.nuxt-app.localhost'
      },
      {
        code: 'ua',
        iso: 'uk-UA',
        name: 'Українська',
        domain: 'http://ua.nuxt-app.localhost'
      }
    ]

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('host matches locale\'s domain (en)', async () => {
    const requestOptions = {
      headers: {
        Host: 'en.nuxt-app.localhost'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('body')?.textContent).toContain('page: Homepage')
    expect(dom.querySelector('head meta[property="og-locale"]')).toBe(null)
  })

  test('host matches locale\'s domain (fr)', async () => {
    const requestOptions = {
      headers: {
        Host: 'fr.nuxt-app.localhost'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('body')?.textContent).toContain('page: Accueil')
  })

  test('x-forwarded-host does not match locale\'s domain', async () => {
    const requestOptions = {
      headers: {
        'X-Forwarded-Host': 'xx.nuxt-app.localhost'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    // Falls back to english.
    expect(dom.querySelector('body')?.textContent).toContain('page: Homepage')
  })

  test('x-forwarded-host does match locale\'s domain (fr)', async () => {
    const requestOptions = {
      headers: {
        'X-Forwarded-Host': 'fr.nuxt-app.localhost'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('body')?.textContent).toContain('page: Accueil')
  })

  test('dir attribute exists and is set to the default direction', async () => {
    const requestOptions = {
      headers: {
        'X-Forwarded-Host': 'fr.nuxt-app.localhost'
      }
    }
    const html = await get('/locale', requestOptions)
    const dom = getDom(html)
    expect(dom.documentElement.getAttribute('dir')).toEqual('auto')
  })

  test('dir and SEO attributes exists', async () => {
    const requestOptions = {
      headers: {
        Host: 'en.nuxt-app.localhost'
      }
    }
    const html = await get('/locale', requestOptions)
    const dom = getDom(html)
    expect(dom.documentElement.getAttribute('dir')).toEqual('ltr')

    const seoTags = getSeoTags(dom)
    const expectedSeoTags = [
      {
        tagName: 'meta',
        property: 'og:locale',
        content: 'en_US'
      },
      {
        tagName: 'meta',
        property: 'og:locale:alternate',
        content: 'fr_FR'
      },
      {
        tagName: 'meta',
        property: 'og:locale:alternate',
        content: 'ru_RU'
      },
      {
        tagName: 'meta',
        property: 'og:locale:alternate',
        content: 'uk_UA'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'http://en.nuxt-app.localhost/locale',
        hreflang: 'en'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'http://en.nuxt-app.localhost/locale',
        hreflang: 'en-US'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'http://fr.nuxt-app.localhost/locale',
        hreflang: 'fr'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'http://fr.nuxt-app.localhost/locale',
        hreflang: 'fr-FR'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'https://ru.nuxt-app.localhost/locale',
        hreflang: 'ru'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'https://ru.nuxt-app.localhost/locale',
        hreflang: 'ru-RU'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'http://ua.nuxt-app.localhost/locale',
        hreflang: 'uk'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'http://ua.nuxt-app.localhost/locale',
        hreflang: 'uk-UA'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'http://en.nuxt-app.localhost/locale',
        hreflang: 'x-default'
      },
      {
        tagName: 'link',
        rel: 'canonical',
        href: 'http://en.nuxt-app.localhost/locale'
      }
    ]
    expect(seoTags).toEqual(expectedSeoTags)
  })
})

const TRAILING_SLASHES = [undefined, false, true]

for (const trailingSlash of TRAILING_SLASHES) {
  describe(`basic (trailingSlash is "${trailingSlash}")`, () => {
    /** @type {Nuxt} */
    let nuxt

    /** @param {string} path */
    const pathRespectingTrailingSlash = path => {
      return (trailingSlash ? withTrailingSlash(path, true) : withoutTrailingSlash(path, true) || withTrailingSlash(path, true))
    }

    /** @type {get} */
    const getRespectingTrailingSlash = async (path, options) => await get(pathRespectingTrailingSlash(path), options)

    beforeAll(async () => {
      /** @type {import('@nuxt/types').NuxtConfig} */
      const overrides = {
        router: {
          trailingSlash,
          extendRoutes (routes) {
            routes.push({
              path: pathRespectingTrailingSlash('/about'),
              redirect: pathRespectingTrailingSlash('/about-us')
            })
          }
        }
      }
      nuxt = (await setup(loadConfig(__dirname, 'basic', overrides, { merge: true }))).nuxt
    })

    afterAll(async () => {
      await nuxt.close()
    })

    test('sets SEO metadata properly', async () => {
      const html = await getRespectingTrailingSlash('/')
      const dom = getDom(html)
      const seoTags = getSeoTags(dom)

      const expectedSeoTags = [
        {
          tagName: 'meta',
          property: 'og:locale',
          content: 'en'
        },
        {
          tagName: 'meta',
          property: 'og:locale:alternate',
          content: 'fr_FR'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: 'nuxt-app.localhost/',
          hreflang: 'en'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: pathRespectingTrailingSlash('nuxt-app.localhost/fr'),
          hreflang: 'fr'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: pathRespectingTrailingSlash('nuxt-app.localhost/fr'),
          hreflang: 'fr-FR'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: 'nuxt-app.localhost/',
          hreflang: 'x-default'
        },
        {
          tagName: 'link',
          rel: 'canonical',
          href: 'nuxt-app.localhost/'
        }
      ]
      expect(seoTags).toEqual(expectedSeoTags)
    })

    test('/ contains EN text, link to /fr/ & link /about-us', async () => {
      const html = await getRespectingTrailingSlash('/')
      const dom = getDom(html)
      expect(dom.querySelector('#current-page')?.textContent).toBe('page: Homepage')

      const langSwitcher = dom.querySelector('#lang-switcher')
      expect(langSwitcher).not.toBeNull()
      expect(langSwitcher?.children.length).toBe(1)
      expect(langSwitcher?.children[0].getAttribute('href')).toBe(pathRespectingTrailingSlash('/fr'))
      expect(langSwitcher?.children[0].textContent).toBe('Français')

      const aboutLink = dom.querySelector('#link-about')
      expect(aboutLink).not.toBeNull()
      expect(aboutLink?.getAttribute('href')).toBe(pathRespectingTrailingSlash('/about-us'))
      expect(aboutLink?.textContent).toBe('About us')
    })

    test('/fr contains FR text, link to / & link to /fr/a-propos', async () => {
      const html = await getRespectingTrailingSlash('/fr')
      const dom = getDom(html)
      expect(dom.querySelector('#current-page')?.textContent).toBe('page: Accueil')

      const langSwitcher = dom.querySelector('#lang-switcher')
      expect(langSwitcher).not.toBeNull()
      expect(langSwitcher?.children.length).toBe(1)
      expect(langSwitcher?.children[0].getAttribute('href')).toBe('/')
      expect(langSwitcher?.children[0].textContent).toBe('English')

      const aboutLink = dom.querySelector('#link-about')
      expect(aboutLink).not.toBeNull()
      expect(aboutLink?.getAttribute('href')).toBe(pathRespectingTrailingSlash('/fr/a-propos'))
      expect(aboutLink?.textContent).toBe('À propos')
    })

    test('/about-us contains EN text, link to /fr/a-propos & link /', async () => {
      const html = await getRespectingTrailingSlash('/about-us')
      const dom = getDom(html)
      expect(dom.querySelector('#current-page')?.textContent).toBe('page: About us')

      const langSwitcher = dom.querySelector('#lang-switcher')
      expect(langSwitcher).not.toBeNull()
      expect(langSwitcher?.children.length).toBe(1)
      expect(langSwitcher?.children[0].getAttribute('href')).toBe(pathRespectingTrailingSlash('/fr/a-propos'))
      expect(langSwitcher?.children[0].textContent).toBe('Français')

      const homeLink = dom.querySelector('#link-home')
      expect(homeLink).not.toBeNull()
      expect(homeLink?.getAttribute('href')).toBe('/')
      expect(homeLink?.textContent).toBe('Homepage')
    })

    test('/fr/a-propos contains FR text, link to /about-us & link to /fr/', async () => {
      const html = await getRespectingTrailingSlash('/fr/a-propos')
      const dom = getDom(html)
      expect(dom.querySelector('#current-page')?.textContent).toBe('page: À propos')

      const langSwitcher = dom.querySelector('#lang-switcher')
      expect(langSwitcher).not.toBeNull()
      expect(langSwitcher?.children.length).toBe(1)
      expect(langSwitcher?.children[0].getAttribute('href')).toBe(pathRespectingTrailingSlash('/about-us'))
      expect(langSwitcher?.children[0].textContent).toBe('English')

      const homeLink = dom.querySelector('#link-home')
      expect(homeLink).not.toBeNull()
      expect(homeLink?.getAttribute('href')).toBe(pathRespectingTrailingSlash('/fr'))
      expect(homeLink?.textContent).toBe('Accueil')
    })

    test('/fr/notlocalized contains FR text', async () => {
      const html = await getRespectingTrailingSlash('/fr/notlocalized')
      const dom = getDom(html)
      expect(dom.querySelector('main')?.textContent).toBe('FR only')
    })

    test('/notlocalized & /fr/fr/notlocalized return 404', async () => {
      expect.assertions(2)
      await getRespectingTrailingSlash('/notlocalized').catch(error => expect(error.statusCode).toBe(404))
      await getRespectingTrailingSlash('/fr/fr/notlocalized').catch(error => expect(error.statusCode).toBe(404))
    })

    test('route specifies options with non-supported locale', async () => {
      await expect(getRespectingTrailingSlash('/simple')).resolves.toBeDefined()
      await expect(getRespectingTrailingSlash('/fr/simple')).resolves.toBeDefined()
      await expect(getRespectingTrailingSlash('/es/simple')).rejects.toBeDefined()
    })

    describe('posts', () => {
      /** @type {string} */
      let html
      /** @type {HTMLHeadingElement | null} */
      let title
      /** @type {HTMLAnchorElement | null} */
      let langSwitcherLink
      /** @type {HTMLAnchorElement | null} */
      let link

      const getElements = () => {
        const dom = getDom(html)
        title = dom.querySelector('h1')
        langSwitcherLink = dom.querySelector('#lang-switcher a')
        link = dom.querySelector('#post-link')
      }

      // TODO: Broken in Nuxt +2.14.0
      if (trailingSlash !== false) {
        test('/posts contains EN text, link to /fr/articles/ & link to /posts/my-post', async () => {
          html = await getRespectingTrailingSlash('/posts')
          getElements()
          expect(title?.textContent).toBe('Posts')
          expect(langSwitcherLink?.href).toBe('/fr/articles/')
          // if (trailingSlash === false) {
          //   expect(link).toBeNull()
          // } else {
          expect(link?.href).toBe(pathRespectingTrailingSlash('/posts/my-post'))
          // }
        })
      }

      test('/posts/my-post contains EN text, link to /fr/articles/mon-article & link to /posts/', async () => {
        html = await getRespectingTrailingSlash('/posts/my-post')
        getElements()
        expect(title?.textContent).toBe('Posts')
        expect(langSwitcherLink?.href).toBe(pathRespectingTrailingSlash('/fr/articles/mon-article'))
        expect(link?.href).toBe('/posts/')
      })

      // TODO: Broken in Nuxt +2.14.0
      if (trailingSlash !== false) {
        test('/fr/articles contains FR text, link to /posts/ & link to /fr/articles/mon-article', async () => {
          html = await getRespectingTrailingSlash('/fr/articles')
          getElements()
          expect(title?.textContent).toBe('Articles')
          expect(langSwitcherLink?.href).toBe('/posts/')
          // if (trailingSlash === false) {
          //   expect(link).toBeNull()
          // } else {
          expect(link?.href).toBe(pathRespectingTrailingSlash('/fr/articles/mon-article'))
          // }
        })

        test('/fr/articles/mon-article contains FR text, link to /posts/my-post & link to /fr/articles/', async () => {
          html = await getRespectingTrailingSlash('/fr/articles/mon-article')
          getElements()
          expect(title?.textContent).toBe('Articles')
          expect(langSwitcherLink?.href).toBe(pathRespectingTrailingSlash('/posts/my-post'))
          expect(link?.href).toBe('/fr/articles/')
        })
      }
    })

    describe('store', () => {
      test('injects $i18n in store', async () => {
        const window = await nuxt.renderAndGetWindow(url('/'))
        expect(window.$nuxt.$store.$i18n).toBeDefined()
      })

      test('syncs i18n locale and messages', async () => {
        const window = await nuxt.renderAndGetWindow(url('/'))
        expect(window.$nuxt.$store.state.i18n).toBeDefined()
        expect(window.$nuxt.$store.state.i18n.locale).toBe('en')
        expect(window.$nuxt.$store.state.i18n.messages).toEqual(expect.objectContaining({
          about: 'About us',
          home: 'Homepage',
          posts: 'Posts'
        }))
      })
    })

    // TODO: Broken in Nuxt +2.14.0
    if (trailingSlash !== false) {
      test('navigates to child route with nameless parent and checks path to other locale', async () => {
        const window = await nuxt.renderAndGetWindow(url(pathRespectingTrailingSlash('/posts')))

        const langSwitcherLink = window.document.querySelector('#lang-switcher a')
        expect(langSwitcherLink.getAttribute('href')).toBe('/fr/articles/')
        const link = window.document.querySelector('#post-link')
        // if (trailingSlash === false) {
        //   expect(link).toBeNull()
        // } else {
        expect(link.getAttribute('href')).toBe(pathRespectingTrailingSlash('/posts/my-post'))
      // }
      })
    }

    test('localePath with route-less params navigates to same locale route', async () => {
      const window = await nuxt.renderAndGetWindow(url(pathRespectingTrailingSlash('/posts/my-post')))

      const link = window.document.querySelector('#post-link-no-route')
      expect(link.getAttribute('href')).toBe(pathRespectingTrailingSlash('/posts/look-ma-no-route'))
    })

    test('localePath with route-less params navigates to different locale route', async () => {
      const window = await nuxt.renderAndGetWindow(url(pathRespectingTrailingSlash('/posts/my-post')))

      const link = window.document.querySelector('#post-link-no-route-fr')
      expect(link.getAttribute('href')).toBe(pathRespectingTrailingSlash('/fr/articles/look-ma-no-route'))
    })

    test('navigates to dynamic child route and checks path to other locale', async () => {
      const window = await nuxt.renderAndGetWindow(url(pathRespectingTrailingSlash('/dynamicNested/1')))

      const body = window.document.querySelector('body')
      expect(body.textContent).toContain('Category')
      if (trailingSlash === true) {
        expect(body.textContent).toContain('Subcategory')
      } else {
        expect(body.textContent).not.toContain('Subcategory')
      }

      // Will only work if navigated-to route has a name.
      expect(window.$nuxt.switchLocalePath('fr')).toBe(pathRespectingTrailingSlash('/fr/imbrication-dynamique/1'))
    })

    test('/dynamicNested/1/2/3 contains link to /fr/imbrication-dynamique/1/2/3', async () => {
      const html = await getRespectingTrailingSlash('/dynamicNested/1/2/3')
      const dom = getDom(html)
      expect(dom.querySelector('h1')?.textContent).toBe('Category 1')
      expect(dom.querySelector('h2')?.textContent).toBe('Subcategory 2')
      expect(dom.querySelector('h3')?.textContent).toBe('Post 3')

      const langSwitcher = dom.querySelector('#lang-switcher')
      expect(langSwitcher).not.toBeNull()
      expect(langSwitcher?.children.length).toBe(1)
      expect(langSwitcher?.children[0].getAttribute('href')).toBe(pathRespectingTrailingSlash('/fr/imbrication-dynamique/1/2/3'))
      expect(langSwitcher?.children[0].textContent).toBe('Français')
    })

    test('/fr/imbrication-dynamique/1/2/3 contains link to /dynamicNested/1/2/3', async () => {
      const html = await getRespectingTrailingSlash('/fr/imbrication-dynamique/1/2/3')
      const dom = getDom(html)
      expect(dom.querySelector('h1')?.textContent).toBe('Category 1')
      expect(dom.querySelector('h2')?.textContent).toBe('Subcategory 2')
      expect(dom.querySelector('h3')?.textContent).toBe('Post 3')

      const langSwitcher = dom.querySelector('#lang-switcher')
      expect(langSwitcher).not.toBeNull()
      expect(langSwitcher?.children.length).toBe(1)
      expect(langSwitcher?.children[0].getAttribute('href')).toBe(pathRespectingTrailingSlash('/dynamicNested/1/2/3'))
      expect(langSwitcher?.children[0].textContent).toBe('English')
    })

    test('localePath returns correct path', async () => {
      const window = await nuxt.renderAndGetWindow(url('/'))
      expect(window.$nuxt.localePath('about')).toBe(pathRespectingTrailingSlash('/about-us'))
      expect(window.$nuxt.localePath('about', 'fr')).toBe(pathRespectingTrailingSlash('/fr/a-propos'))
      expect(window.$nuxt.localePath('/about-us')).toBe(pathRespectingTrailingSlash('/about-us'))
      expect(window.$nuxt.localePath({ path: '/about' })).toBe(pathRespectingTrailingSlash('/about-us'))
      expect(window.$nuxt.localePath({ path: '/about/' })).toBe(pathRespectingTrailingSlash('/about-us'))
    })

    test('switchLocalePath returns correct path', async () => {
      const window = await nuxt.renderAndGetWindow(url('/'))
      expect(window.$nuxt.switchLocalePath('fr')).toBe(pathRespectingTrailingSlash('/fr'))
    })

    test('getRouteBaseName returns correct name', async () => {
      const window = await nuxt.renderAndGetWindow(url('/'))
      expect(window.$nuxt.getRouteBaseName()).toBe('index')
    })

    test('getRouteBaseName returns name of passed in route', async () => {
      const window = await nuxt.renderAndGetWindow(url('/'))
      /** @type {import('vue-router').RouterOptions} */
      const routerOptions = window.$nuxt.$router.options
      const aboutRoute = routerOptions.routes?.find(route => route.path === pathRespectingTrailingSlash('/about-us'))
      expect(aboutRoute).toBeDefined()
      expect(aboutRoute?.name).toBeDefined()
      expect(window.$nuxt.getRouteBaseName(aboutRoute)).toBe('about')
    })

    test('localeRoute returns localized route', async () => {
      const window = await nuxt.renderAndGetWindow(url('/'))
      expect(window.$nuxt.localeRoute('about', 'en')).toMatchObject({
        name: 'about___en',
        fullPath: pathRespectingTrailingSlash('/about-us')
      })
    })

    test('localeRoute with custom location object retains params', async () => {
      const window = await nuxt.renderAndGetWindow(url('/'))
      expect(window.$nuxt.localeRoute({ name: 'about', params: { foo: '1' } }, 'en')).toMatchObject({
        name: 'about___en',
        fullPath: pathRespectingTrailingSlash('/about-us'),
        params: {
          foo: '1'
        }
      })
    })

    test('localePath, switchLocalePath, getRouteBaseName, localeRoute works from a middleware', async () => {
      const html = await getRespectingTrailingSlash('/middleware')
      const dom = getDom(html)
      expect(dom.querySelector('#paths')?.textContent).toBe(
        [pathRespectingTrailingSlash('/middleware'), pathRespectingTrailingSlash('/fr/middleware-fr')].join(',')
      )
      expect(dom.querySelector('#name')?.textContent).toBe('middleware')
      const routeObject = dom.querySelector('#localizedRoute')?.textContent || '{}'
      expect(JSON.parse(routeObject)).toMatchObject({
        name: 'middleware___fr'
      })
    })

    test('redirects to existing route', async () => {
      const window = await nuxt.renderAndGetWindow(url(pathRespectingTrailingSlash('/about')))
      const newRoute = window.$nuxt.switchLocalePath()
      expect(newRoute).toBe(pathRespectingTrailingSlash('/about-us'))
    })

    test('fallbacks to default locale with invalid locale cookie', async () => {
      const requestOptions = {
        headers: {
          Cookie: 'i18n_redirected=invalid'
        }
      }
      const html = await getRespectingTrailingSlash('/', requestOptions)
      const dom = getDom(html)
      expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: en')
    })

    test('registers message using vueI18nLoader', async () => {
      const html = await getRespectingTrailingSlash('/loader')
      const dom = getDom(html)
      expect(dom.querySelector('#container')?.textContent).toBe('string from loader EN')
    })

    test('registers message using vueI18nLoader from yaml block', async () => {
      let html = await getRespectingTrailingSlash('/loader-yaml')
      let dom = getDom(html)
      let title = dom.querySelector('p')
      expect(title?.textContent).toBe('hello world!')

      html = await getRespectingTrailingSlash('/fr/loader-yaml')
      dom = getDom(html)
      title = dom.querySelector('p')
      expect(title?.textContent).toBe('Bonjour le monde!')
    })

    test('can use nuxt-i18n extensions from component local i18n instance', async () => {
      const html = await getRespectingTrailingSlash('/loader-yaml')
      const dom = getDom(html)
      const title = dom.querySelector('p#title')
      expect(title?.textContent).toBe('hello world!')
      const locales = dom.querySelector('p#locales')
      const localesContent = locales?.textContent || '{}'
      expect(JSON.parse(localesContent)).toMatchObject([
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
      ])
    })

    test('baseUrl is set correctly in component local i18n instance', async () => {
      const html = await getRespectingTrailingSlash('/loader-yaml')
      const dom = getDom(html)
      const seoTags = getSeoTags(dom)

      const expectedSeoTags = [
        {
          tagName: 'meta',
          property: 'og:locale',
          content: 'en'
        },
        {
          tagName: 'meta',
          property: 'og:locale:alternate',
          content: 'fr_FR'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: pathRespectingTrailingSlash('nuxt-app.localhost/loader-yaml'),
          hreflang: 'en'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: pathRespectingTrailingSlash('nuxt-app.localhost/fr/loader-yaml'),
          hreflang: 'fr'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: pathRespectingTrailingSlash('nuxt-app.localhost/fr/loader-yaml'),
          hreflang: 'fr-FR'
        },
        {
          tagName: 'link',
          rel: 'alternate',
          href: pathRespectingTrailingSlash('nuxt-app.localhost/loader-yaml'),
          hreflang: 'x-default'
        },
        {
          tagName: 'link',
          rel: 'canonical',
          href: pathRespectingTrailingSlash('nuxt-app.localhost/loader-yaml')
        }
      ]

      expect(seoTags).toEqual(expectedSeoTags)
    })
  })
}

describe('hreflang', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const testConfig = loadConfig(__dirname, 'basic')

    // Override those after merging to overwrite original values.
    testConfig.i18n.locales = [
      {
        code: 'en',
        iso: 'en',
        name: 'English',
        dir: 'auto'

      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      },
      {
        code: 'es',
        iso: 'es-ES',
        name: 'Spanish (Spain)'
      },
      {
        code: 'esVe',
        iso: 'es-VE',
        name: 'Spanish (Venezuela)',
        isCatchallLocale: true
      }
    ]

    nuxt = (await setup(testConfig)).nuxt
  })

  test('sets SEO metadata and dir attribute properly', async () => {
    const html = await get('/locale')
    const dom = getDom(html)
    const seoTags = getSeoTags(dom)

    const expectedSeoTags = [
      {
        content: 'en',
        property: 'og:locale',
        tagName: 'meta'
      },
      {
        content: 'fr_FR',
        property: 'og:locale:alternate',
        tagName: 'meta'
      },
      {
        content: 'es_ES',
        property: 'og:locale:alternate',
        tagName: 'meta'
      },
      {
        content: 'es_VE',
        property: 'og:locale:alternate',
        tagName: 'meta'
      },
      {
        href: 'nuxt-app.localhost/locale',
        hreflang: 'en',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/fr/locale',
        hreflang: 'fr',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/fr/locale',
        hreflang: 'fr-FR',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/esVe/locale',
        hreflang: 'es',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/es/locale',
        hreflang: 'es-ES',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/esVe/locale',
        hreflang: 'es-VE',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/locale',
        hreflang: 'x-default',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/locale',
        rel: 'canonical',
        tagName: 'link'
      }
    ]
    expect(dom.documentElement.getAttribute('dir')).toEqual('auto')
    expect(seoTags).toEqual(expectedSeoTags)
  })

  test('localeProperties object exists and is set to the correct object', async () => {
    const html = await get('/loader-yaml')
    const dom = getDom(html)
    const localeProperties = dom.querySelector('p#localeProperties')
    const localePropertiesContent = localeProperties?.textContent || '{}'
    expect(JSON.parse(localePropertiesContent)).toMatchObject(
      {
        code: 'en',
        iso: 'en',
        name: 'English'
      })
  })

  test('dir attribute will not be added to the html element', async () => {
    const html = await get('/fr')
    const dom = getDom(html)
    expect(dom.documentElement.getAttribute('dir')).toBeNull()
  })

  afterAll(async () => {
    await nuxt.close()
  })
})

describe('lazy loading', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        lazy: true,
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: 'en'
        }
      }
    }

    const testConfig = loadConfig(__dirname, 'basic', override, { merge: true })

    // Override those after merging to overwrite original values.
    testConfig.i18n.locales = [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        file: 'en-US.js'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        file: 'fr-FR.js'
      }
    ]
    testConfig.i18n.vueI18n.messages = null

    nuxt = (await setup(testConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('shows fallback string', async () => {
    const html = await get('/fr/fallback')
    const dom = getDom(html)
    const title = dom.querySelector('h1')
    expect(title?.textContent).toBe('in english')
  })

  test('loads strings from file exporting a function', async () => {
    const html = await get('/fr/simple')
    const dom = getDom(html)
    const container = dom.querySelector('#container')
    expect(container?.textContent).toBe('Accueil')
  })

  test('exported function gets passed locale to load', async () => {
    const html = await get('/fr/locale')
    const dom = getDom(html)
    const container = dom.querySelector('#t')
    expect(container?.textContent).toBe('fr')
  })
})

describe('with empty configuration', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    nuxt = (await setup(loadConfig(__dirname, 'no-i18n', { i18n: {} }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('does not remove all routes', async () => {
    await nuxt.renderAndGetWindow(url('/about'))
  })

  test('localeProperties object exists and is set to an object with no code', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.$i18n.localeProperties).toEqual({ code: '' })
  })
})

describe('with rootRedirect (string)', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        rootRedirect: 'fr',
        strategy: 'prefix'
      }
    }
    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('root route redirects to /fr', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false // Don't reject on non-2xx response
    }
    const response = await get('/', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/fr')
  })

  test('root route redirects to /fr and preserves query', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false // Don't reject on non-2xx response
    }
    const response = await get('/?q=1', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/fr?q=1')
  })
})

describe('with rootRedirect (object)', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        rootRedirect: { statusCode: 301, path: 'en' },
        strategy: 'prefix'
      }
    }
    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('root route redirects to /en', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false // Don't reject on non-2xx response
    }
    const response = await get('/', requestOptions)
    expect(response.statusCode).toBe(301)
    expect(response.headers.location).toBe('/en')
  })
})

describe('prefix_and_default strategy', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = { i18n: { strategy: 'prefix_and_default' } }
    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('default locale routes / and /en exist', async () => {
    await expect(get('/')).resolves.toContain('page: Homepage')
    await expect(get('/en')).resolves.toContain('page: Homepage')
  })

  test('non-default locale route /fr exists', async () => {
    await expect(get('/fr')).resolves.toContain('page: Accueil')
  })

  test('localeRoute returns localized route (by route name)', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.localeRoute('index', 'en')).toMatchObject({ name: 'index___en___default', fullPath: '/' })
    expect(window.$nuxt.localeRoute('index', 'fr')).toMatchObject({ name: 'index___fr', fullPath: '/fr' })
  })

  test('localeRoute returns localized route (by route object with name)', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    // Prefer unprefixed path for default locale:
    expect(window.$nuxt.localeRoute({ name: 'simple', query: { a: '1' } }, 'en')).toMatchObject({
      name: 'simple___en___default',
      query: { a: '1' },
      fullPath: '/simple?a=1'
    })
    expect(window.$nuxt.localeRoute({ name: 'simple', query: { a: '1' } }, 'fr')).toMatchObject({
      name: 'simple___fr',
      query: { a: '1' },
      fullPath: '/fr/simple?a=1'
    })
  })

  test('localeRoute returns localized route (by route path)', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    // Prefer unprefixed path for default locale:
    expect(window.$nuxt.localeRoute('/simple', 'en')).toMatchObject({ name: 'simple___en___default', fullPath: '/simple' })
    expect(window.$nuxt.localeRoute('/simple', 'fr')).toMatchObject({ name: 'simple___fr', fullPath: '/fr/simple' })
  })

  test('localeRoute returns localized route (by route object with path)', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    // Prefer unprefixed path for default locale:
    expect(window.$nuxt.localeRoute({ path: '/simple', query: { a: '1' } }, 'en')).toMatchObject({
      name: 'simple___en___default',
      query: { a: '1' },
      fullPath: '/simple?a=1'
    })
    expect(window.$nuxt.localeRoute({ path: '/simple', query: { a: '1' } }, 'fr')).toMatchObject({
      name: 'simple___fr',
      query: { a: '1' },
      fullPath: '/fr/simple?a=1'
    })
  })

  test('localeRoute returns customized localized route (by route path)', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    // Prefer unprefixed path for default locale:
    expect(window.$nuxt.localeRoute('/about-us', 'en')).toMatchObject({ name: 'about___en___default', fullPath: '/about-us' })
    expect(window.$nuxt.localeRoute('/en/about-us', 'en')).toMatchObject({ name: 'about___en___default', fullPath: '/about-us' })
    expect(window.$nuxt.localeRoute('/about-us', 'fr')).toMatchObject({ name: 'about___fr', fullPath: '/fr/a-propos' })
    expect(window.$nuxt.localeRoute('/about-us?q=1#hash', 'en')).toMatchObject({
      name: 'about___en___default',
      fullPath: '/about-us?q=1#hash',
      query: { q: '1' },
      hash: '#hash'
    })
  })

  test('localeLocation returns route name for existing route', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.localeLocation('/about-us', 'en')).toMatchObject({ name: 'about___en___default' })
  })

  test('localeLocation returns route path for non-existing route', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.localeLocation('/abc', 'en')).toMatchObject({ path: '/abc' })
  })

  test('canonical SEO link is added to prefixed default locale', async () => {
    const html = await get('/en')
    const dom = getDom(html)
    const links = dom.querySelectorAll('head link[rel="canonical"]')
    expect(links.length).toBe(1)
    expect(links[0].getAttribute('href')).toBe('nuxt-app.localhost/')
  })

  test('canonical SEO link is added to non-prefixed default locale', async () => {
    const html = await get('/')
    const dom = getDom(html)
    const links = dom.querySelectorAll('head link[rel="canonical"]')
    expect(links.length).toBe(1)
    expect(links[0].getAttribute('href')).toBe('nuxt-app.localhost/')
  })
})

describe('no_prefix strategy', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        strategy: 'no_prefix'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'no-lang-switcher', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('sets SEO metadata properly', async () => {
    const html = await get('/')
    const dom = getDom(html)
    const seoTags = getSeoTags(dom)
    expect(seoTags).toEqual(expect.arrayContaining([
      {
        tagName: 'meta',
        property: 'og:locale',
        content: 'en'
      },
      {
        tagName: 'meta',
        property: 'og:locale:alternate',
        content: 'fr_FR'
      },
      {
        tagName: 'link',
        rel: 'canonical',
        href: 'nuxt-app.localhost/'
      }
    ]))
    expect(seoTags.filter(tag => tag.tagName === 'link')).toHaveLength(1)
  })

  test('/ contains EN text & link /about', async () => {
    const html = await get('/')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: Homepage')

    const currentLocale = dom.querySelector('#current-locale')
    expect(currentLocale).not.toBeNull()
    expect(currentLocale?.textContent).toBe('locale: en')

    const aboutLink = dom.querySelector('#link-about')
    expect(aboutLink).not.toBeNull()
    expect(aboutLink?.getAttribute('href')).toBe('/about')
    expect(aboutLink?.textContent).toBe('About us')
  })

  test('/about contains EN text & link /', async () => {
    const html = await get('/about')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: About us')

    const homeLink = dom.querySelector('#link-home')
    expect(homeLink).not.toBeNull()
    expect(homeLink?.getAttribute('href')).toBe('/')
    expect(homeLink?.textContent).toBe('Homepage')
  })

  test('/fr/ returns 404', async () => {
    let response
    try {
      response = await get('/fr/')
    } catch (error) {
      response = error
    }
    expect(response.statusCode).toBe(404)
  })

  test('localePath returns correct path', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.localePath('about')).toBe('/about')
    expect(window.$nuxt.localePath({ path: '/about' })).toBe('/about')
  })

  test('fallbacks to default locale with invalid locale cookie', async () => {
    const requestOptions = {
      headers: {
        Cookie: 'i18n_redirected=invalid'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: en')
  })

  test('does detect browser locale', async () => {
    const requestOptions = {
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: fr')
  })
})

describe('no_prefix strategy + differentDomains', () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {jest.SpyInstance} */
  let spy

  beforeAll(() => {
    spy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterAll(async () => {
    spy.mockRestore()
    await nuxt.close()
  })

  test('triggers warning', async () => {
    const override = {
      i18n: {
        strategy: 'no_prefix',
        differentDomains: true
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'no-lang-switcher', override, { merge: true }))).nuxt

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('The `differentDomains` option and `no_prefix` strategy are not compatible')
  })
})

describe('invalid strategy', () => {
  /** @type {Nuxt} */
  let nuxt
  /** @type {jest.SpyInstance} */
  let spy

  beforeAll(() => {
    spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(async () => {
    spy.mockRestore()
    await nuxt.close()
  })

  test('triggers error on building', async () => {
    const override = {
      i18n: {
        strategy: 'nopenope'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'no-lang-switcher', override, { merge: true }))).nuxt

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('Invalid "strategy" option "nopenope"')
  })
})

describe('dynamic route', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    nuxt = (await setup(loadConfig(__dirname, 'dynamic'))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('can access catch-all route for every locale', async () => {
    let html = await get('/aaa')
    let dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: en')

    html = await get('/fr/aaa')
    dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: fr')
  })
})

describe('hash mode', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      router: {
        mode: 'hash'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('localePath returns correct path (without hash)', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const newRoute = window.$nuxt.localePath('about')
    expect(newRoute).toBe('/about-us')
  })
})

describe('with router base', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      router: {
        base: '/app/'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('localePath returns correct path', async () => {
    const window = await nuxt.renderAndGetWindow(url('/app/'))
    const newRoute = window.$nuxt.localePath('about')
    expect(newRoute).toBe('/about-us')
  })

  test('detectBrowserLanguage redirects on base path', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/app/', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/app/fr')
  })

  test('detectBrowserLanguage redirects on non-base path', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/app/simple', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/app/fr/simple')
  })
})

describe('baseUrl', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    /** @type {import('@nuxt/types').NuxtConfig} */
    const override = {
      i18n: {
        strategy: 'prefix_and_default',
        baseUrl: (context) => {
          if (process.server) {
            const xOverrideBaseUrl = context.req.headers['x-override-base-url']
            if (Array.isArray(xOverrideBaseUrl)) {
              return xOverrideBaseUrl[0]
            }
            return xOverrideBaseUrl || ''
          }
          return ''
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('evaluates baseUrl function correctly', async () => {
    const requestOptions = {
      headers: {
        'X-Override-Base-Url': 'CUSTOM'
      }
    }
    const html = await get('/?noncanonical', requestOptions)
    const dom = getDom(html)
    const seoTags = getSeoTags(dom)

    const expectedSeoTags = [
      {
        tagName: 'meta',
        property: 'og:locale',
        content: 'en'
      },
      {
        tagName: 'meta',
        property: 'og:locale:alternate',
        content: 'fr_FR'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'CUSTOM/?noncanonical',
        hreflang: 'en'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'CUSTOM/fr?noncanonical',
        hreflang: 'fr'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'CUSTOM/fr?noncanonical',
        hreflang: 'fr-FR'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'CUSTOM/?noncanonical',
        hreflang: 'x-default'
      },
      {
        tagName: 'link',
        rel: 'canonical',
        href: 'CUSTOM/'
      }
    ]

    expect(seoTags).toEqual(expectedSeoTags)
  })
})

// This is a special case due to vue-i18n defaulting to en-US for `defaultLocale`
// and `fallbackLocale` which can prevent us from applying locale initially.
describe('en-US locale with no explicit default locale (issue #628)', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        lazy: true,
        langDir: 'lang/',
        defaultLocale: null,
        vueI18n: {
          fallbackLocale: null,
          messages: null
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', override, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      {
        code: 'en-US',
        iso: 'en-US',
        name: 'English',
        file: 'en-US.js'
      }
    ]

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('prefix is present and locale is applied', async () => {
    const html = await get('/en-US')
    const dom = getDom(html)
    expect(dom.querySelector('body')?.textContent).toContain('page: Homepage')
  })
})

describe('lazy with single (default) locale', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        lazy: true,
        langDir: 'lang/',
        defaultLocale: 'en-US',
        vueI18n: {
          messages: null
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', override, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      {
        code: 'en-US',
        iso: 'en-US',
        name: 'English',
        file: 'en-US.js'
      }
    ]

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  // Issue https://github.com/nuxt-community/i18n-module/issues/824
  test('page loads without errors (issue #824)', async () => {
    const html = await get('/')
    const dom = getDom(html)
    expect(dom.querySelector('body')?.textContent).toContain('page: Homepage')
  })
})

describe('external vue-i18n configuration', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        vueI18n: '~/plugins/vue-i18n.js'
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('uses custom message formatter', async () => {
    const html = await get('/')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: HOMEPAGE')
  })
})

describe('parsePages disabled', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        parsePages: false,
        pages: {
          'about-no-locale': false,
          simple: {
            en: '/simple-en',
            fr: '/simple-fr'
          }
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('navigates to route with paths defined in pages option', async () => {
    const window = await nuxt.renderAndGetWindow(url('/simple-en'))
    expect(window.document.querySelector('#container').textContent).toBe('Homepage')

    const newRoute = window.$nuxt.localePath('simple', 'fr')
    expect(newRoute).toBe('/fr/simple-fr')
  })

  test('navigates to route with paths disabled in pages option', async () => {
    await expect(get('/about-no-locale')).resolves.toBeDefined()
    await expect(get('/fr/about-no-locale')).rejects.toBeDefined()
  })

  test('does not trigger redirect loop on route with disabled locale', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false // Don't reject on non-2xx response
    }
    const response = await get('/about-no-locale', requestOptions)
    expect(response.statusCode).toBe(200)
  })
})

describe('vuex disabled', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        vuex: false
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('navigates to route with correct locale', async () => {
    expect(getDom(await get('/')).querySelector('#current-locale')?.textContent).toBe('locale: en')
    expect(getDom(await get('/fr')).querySelector('#current-locale')?.textContent).toBe('locale: fr')
  })
})

describe('no_prefix + detectBrowserLanguage + alwaysRedirect', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        strategy: 'no_prefix',
        detectBrowserLanguage: {
          alwaysRedirect: true
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('fallbacks to default locale with invalid locale cookie', async () => {
    const requestOptions = {
      headers: {
        Cookie: 'i18n_redirected=invalid'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: en')
  })

  test('applies detected locale on non-root path', async () => {
    const requestOptions = {
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const html = await get('/about', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: À propos')
  })
})

describe('prefix + detectBrowserLanguage', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        defaultLocale: 'fr',
        strategy: 'prefix',
        detectBrowserLanguage: {
          useCookie: true
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('redirects root even if the route already has a locale', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/en', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/fr')
  })

  test('redirects subroute even if the route already has a locale', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/en/simple', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/fr/simple')
  })
})

describe('prefix + detectBrowserLanguage + onlyOnRoot', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        defaultLocale: 'fr',
        strategy: 'prefix',
        detectBrowserLanguage: {
          useCookie: true,
          onlyOnRoot: true
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('does not redirect root if the route already has a locale', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/en', requestOptions)
    expect(response.statusCode).toBe(200)
  })

  test('does not redirect subroute if the route already has a locale', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/en/simple', requestOptions)
    expect(response.statusCode).toBe(200)
  })
})

describe('prefix + detectBrowserLanguage + alwaysRedirect', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        defaultLocale: 'fr',
        strategy: 'prefix',
        detectBrowserLanguage: {
          useCookie: true,
          alwaysRedirect: true
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('redirects to defaultLocale on navigating to root (non-existant) route', async () => {
    const html = await get('/')
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: fr')
  })

  test('redirects although the route already has a locale', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/en', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/fr')
  })
})

describe('locale change hooks', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    /** @type {NuxtConfig} */
    const override = {
      i18n: {
        onBeforeLanguageSwitch: (oldLocale, newLocale) => {
          if (newLocale === 'fr') {
            return 'en'
          }
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', override, { merge: true })

    // Set manually to avoid merging array items.
    localConfig.i18n.locales = [
      {
        code: 'en',
        iso: 'en',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      },
      {
        code: 'pl',
        iso: 'pl-PL',
        name: 'Polish'
      }
    ]

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('does not override the default locale', async () => {
    const html = await get('/')
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: en')
  })

  test('does not override polish locale', async () => {
    const html = await get('/pl')
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: pl')
  })

  test('overrides french locale', async () => {
    const html = await get('/fr')
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: en')
  })

  test('redirects to correct URL when overridden', async () => {
    const requestOptions = {
      followRedirect: false,
      resolveWithFullResponse: true,
      simple: false, // Don't reject on non-2xx response
      headers: {
        'Accept-Language': 'fr'
      }
    }
    const response = await get('/fr', requestOptions)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/')
  })
})

describe('generate with detectBrowserLanguage.fallbackLocale', () => {
  const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')

  beforeAll(async () => {
    /** @type {import('@nuxt/types').NuxtConfig} */
    const overrides = {
      generate: { dir: distDir },
      i18n: {
        detectBrowserLanguage: {
          fallbackLocale: 'en'
        }
      }
    }

    await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))
  })

  test('pre-renders all locales', () => {
    let dom
    let contents

    contents = readFileSync(resolve(distDir, 'index.html'), 'utf-8')
    dom = getDom(contents)
    expect(dom.querySelector('#current-page')).toBeDefined()
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: Homepage')

    contents = readFileSync(resolve(distDir, 'fr/index.html'), 'utf-8')
    dom = getDom(contents)
    expect(dom.querySelector('#current-page')).toBeDefined()
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: Accueil')
  })
})

describe('generate with differentDomains enabled', () => {
  const distDir = resolve(__dirname, 'fixture', 'no-lang-switcher', '.nuxt-generate')

  beforeAll(async () => {
    /** @type {import('@nuxt/types').NuxtConfig} */
    const overrides = {
      generate: { dir: distDir },
      i18n: {
        differentDomains: true
      }
    }

    const testConfig = loadConfig(__dirname, 'no-lang-switcher', overrides, { merge: true })
    // Override those after merging to overwrite original values.
    testConfig.i18n.locales = [
      {
        code: 'en',
        domain: 'en-domain',
        iso: 'en',
        name: 'English'
      },
      {
        code: 'fr',
        domain: 'fr-domain',
        iso: 'fr-FR',
        name: 'Français'
      }
    ]
    await generate(testConfig)
  })

  test('does not crash on generating', () => {
    const contents = readFileSync(resolve(distDir, 'about', 'index.html'), 'utf-8')
    const dom = getDom(contents)
    expect(dom.querySelector('#current-page')).toBeDefined()
    expect(dom.querySelector('#current-page')?.textContent).toBe('page: About us')
  })
})

describe('generate with prefix strategy', () => {
  const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')

  beforeAll(async () => {
    /** @type {import('@nuxt/types').NuxtConfig} */
    const overrides = {
      generate: { dir: distDir },
      i18n: {
        strategy: 'prefix',
        seo: true
      }
    }

    await generate(loadConfig(__dirname, 'basic', overrides, { merge: true }))
  })

  test('fallback route contains canonical link to actual route', () => {
    const contents = readFileSync(resolve(distDir, 'index.html'), 'utf-8')
    const dom = getDom(contents)
    const canonicalLink = dom.querySelector('head link[rel="canonical"]')
    expect(canonicalLink?.getAttribute('href')).toBe('nuxt-app.localhost/en')
  })
})

describe('Locale fallback decision map', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const locales = [
      {
        code: 'es',
        iso: 'es',
        name: 'Spanish',
        file: 'es.js'
      },
      {
        code: 'en-GB',
        iso: 'en-GB',
        name: 'Britain english',
        file: 'en-GB.js'
      },
      {
        code: 'fr-FR',
        iso: 'fr-FR',
        name: 'Français',
        file: 'fr-FR.js'
      },
      {
        code: 'de',
        iso: 'de',
        name: 'Deutsch',
        file: 'de.js'
      }
    ]

    const override = {
      i18n: {
        lazy: true,
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: {
            'fr-FR': ['en-GB', 'es'],
            default: ['de']
          }
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'fallback-locale', override, { merge: true })

    // Set manually to avoid merging array items.
    localConfig.i18n.locales = locales

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('should fallback translation by respecting the decision map', async () => {
    const html = await get('/fr-FR/fallback')
    const dom = getDom(html)

    expect(dom.querySelector('[data-test="fr-key"]')?.textContent).toEqual('fr-FR translation')
    expect(dom.querySelector('[data-test="en-gb-key"]')?.textContent).toEqual('en-GB translation')
    expect(dom.querySelector('[data-test="es-key"]')?.textContent).toEqual('es translation')
    expect(dom.querySelector('[data-test="de-key"]')?.textContent).toEqual('de translation')
  })

  test('should be able to skip if there is no fallback specified for the wanted locale', async () => {
    const html = await get('/en-GB/fallback')
    const dom = getDom(html)

    expect(dom.querySelector('[data-test="fr-key"]')?.textContent).toEqual('frFRKey')
    expect(dom.querySelector('[data-test="en-gb-key"]')?.textContent).toEqual('en-GB translation')
    expect(dom.querySelector('[data-test="es-key"]')?.textContent).toEqual('esKey')
    expect(dom.querySelector('[data-test="de-key"]')?.textContent).toEqual('de translation')
  })
})

describe('Locale fallback decision map with no fallback', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const locales = [
      {
        code: 'es',
        iso: 'es',
        name: 'Spanish',
        file: 'es.js'
      },
      {
        code: 'en-GB',
        iso: 'en-GB',
        name: 'Britain english',
        file: 'en-GB.js'
      },
      {
        code: 'fr-FR',
        iso: 'fr-FR',
        name: 'Français',
        file: 'fr-FR.js'
      }
    ]

    const override = {
      i18n: {
        lazy: true,
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: {
            'fr-FR': ['en-GB', 'es']
          }
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'fallback-locale', override, { merge: true })

    // Set manually to avoid merging array items.
    localConfig.i18n.locales = locales

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('should fallback translation by respecting the decision map and without using default fallback', async () => {
    const html = await get('/fr-FR/fallback')
    const dom = getDom(html)

    expect(dom.querySelector('[data-test="fr-key"]')?.textContent).toEqual('fr-FR translation')
    expect(dom.querySelector('[data-test="en-gb-key"]')?.textContent).toEqual('en-GB translation')
    expect(dom.querySelector('[data-test="es-key"]')?.textContent).toEqual('es translation')
    expect(dom.querySelector('[data-test="de-key"]')?.textContent).toEqual('deKey')
  })
})

describe('Locale fallback array', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    const locales = [
      {
        code: 'es',
        iso: 'es',
        name: 'Spanish',
        file: 'es.js'
      },
      {
        code: 'en-GB',
        iso: 'en-GB',
        name: 'Britain english',
        file: 'en-GB.js'
      },
      {
        code: 'fr-FR',
        iso: 'fr-FR',
        name: 'Français',
        file: 'fr-FR.js'
      }
    ]

    const override = {
      i18n: {
        lazy: true,
        langDir: 'lang/',
        vueI18n: {
          fallbackLocale: ['en-GB', 'es']
        }
      }
    }

    const localConfig = loadConfig(__dirname, 'fallback-locale', override, { merge: true })

    // Set manually to avoid merging array items.
    localConfig.i18n.locales = locales

    nuxt = (await setup(localConfig)).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('should fallback translation by respecting the decision array', async () => {
    const html = await get('/fr-FR/fallback')
    const dom = getDom(html)

    expect(dom.querySelector('[data-test="fr-key"]')?.textContent).toEqual('fr-FR translation')
    expect(dom.querySelector('[data-test="en-gb-key"]')?.textContent).toEqual('en-GB translation')
    expect(dom.querySelector('[data-test="es-key"]')?.textContent).toEqual('es translation')
    expect(dom.querySelector('[data-test="de-key"]')?.textContent).toEqual('deKey')
  })
})

describe('Composition API', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    nuxt = (await setup(loadConfig(__dirname, 'composition-api'))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('should work with the composition API module', async () => {
    const html = await get('/')
    const dom = getDom(html)

    expect(dom.querySelector('#current-locale')?.textContent).toBe('locale: en')
    expect(dom.querySelector('#unprocessed-url')?.textContent).toBe('Homepage')
    expect(dom.querySelector('#processed-url')?.textContent).toBe('Homepage')

    expect(dom.querySelector('#unprocessed-url')?.getAttribute('href')).toBe('/')
    expect(dom.querySelector('#processed-url')?.getAttribute('href')).toBe('/')
  })
})

describe('Store', () => {
  /** @type {Nuxt} */
  let nuxt

  beforeAll(async () => {
    nuxt = (await setup(loadConfig(__dirname, 'basic'))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('API is available in store instance', async () => {
    const html = await get('/about-us')
    const dom = getDom(html)

    expect(dom.querySelector('#store-path-fr')?.textContent).toBe('/fr/a-propos')
  })
})
