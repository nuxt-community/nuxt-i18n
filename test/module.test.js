import { resolve } from 'path'
import { readFileSync } from 'fs'
import { generate, setup, loadConfig, get, url } from '@nuxtjs/module-test-utils'
import { JSDOM } from 'jsdom'

import { getSeoTags } from './utils'

const getDom = html => (new JSDOM(html)).window.document

describe('basic', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      router: {
        extendRoutes (routes) {
          routes.push({ path: '/about', redirect: '/about-us' })
        }
      }
    }

    nuxt = (await setup(loadConfig(__dirname, 'basic', override, { merge: true }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('sets SEO metadata properly', async () => {
    const html = await get('/')
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
        href: 'nuxt-app.localhost/fr',
        hreflang: 'fr'
      },
      {
        tagName: 'link',
        rel: 'alternate',
        href: 'nuxt-app.localhost/fr',
        hreflang: 'fr-FR'
      }
    ]

    expect(seoTags).toEqual(expectedSeoTags)
  })

  test('/ contains EN text, link to /fr/ & link /about-us', async () => {
    const html = await get('/')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page').textContent).toBe('page: Homepage')

    const langSwitcher = dom.querySelector('#lang-switcher')
    expect(langSwitcher).not.toBeNull()
    expect(langSwitcher.children.length).toBe(1)
    expect(langSwitcher.children[0].getAttribute('href')).toBe('/fr')
    expect(langSwitcher.children[0].textContent).toBe('Français')

    const aboutLink = dom.querySelector('#link-about')
    expect(aboutLink).not.toBeNull()
    expect(aboutLink.getAttribute('href')).toBe('/about-us')
    expect(aboutLink.textContent).toBe('About us')
  })

  test('/fr contains FR text, link to / & link to /fr/a-propos', async () => {
    const html = await get('/fr')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page').textContent).toBe('page: Accueil')

    const langSwitcher = dom.querySelector('#lang-switcher')
    expect(langSwitcher).not.toBeNull()
    expect(langSwitcher.children.length).toBe(1)
    expect(langSwitcher.children[0].getAttribute('href')).toBe('/')
    expect(langSwitcher.children[0].textContent).toBe('English')

    const aboutLink = dom.querySelector('#link-about')
    expect(aboutLink).not.toBeNull()
    expect(aboutLink.getAttribute('href')).toBe('/fr/a-propos')
    expect(aboutLink.textContent).toBe('À propos')
  })

  test('/about-us contains EN text, link to /fr/a-propos & link /', async () => {
    const html = await get('/about-us')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page').textContent).toBe('page: About us')

    const langSwitcher = dom.querySelector('#lang-switcher')
    expect(langSwitcher).not.toBeNull()
    expect(langSwitcher.children.length).toBe(1)
    expect(langSwitcher.children[0].getAttribute('href')).toBe('/fr/a-propos')
    expect(langSwitcher.children[0].textContent).toBe('Français')

    const homeLink = dom.querySelector('#link-home')
    expect(homeLink).not.toBeNull()
    expect(homeLink.getAttribute('href')).toBe('/')
    expect(homeLink.textContent).toBe('Homepage')
  })

  test('/fr/a-propos contains FR text, link to /about-us & link to /fr/', async () => {
    const html = await get('/fr/a-propos')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page').textContent).toBe('page: À propos')

    const langSwitcher = dom.querySelector('#lang-switcher')
    expect(langSwitcher).not.toBeNull()
    expect(langSwitcher.children.length).toBe(1)
    expect(langSwitcher.children[0].getAttribute('href')).toBe('/about-us')
    expect(langSwitcher.children[0].textContent).toBe('English')

    const homeLink = dom.querySelector('#link-home')
    expect(homeLink).not.toBeNull()
    expect(homeLink.getAttribute('href')).toBe('/fr')
    expect(homeLink.textContent).toBe('Accueil')
  })

  test('/fr/notlocalized contains FR text', async () => {
    const html = await get('/fr/notlocalized')
    const dom = getDom(html)
    expect(dom.querySelector('main').textContent).toBe('FR only')
  })

  test('/notlocalized & /fr/fr/notlocalized return 404', async () => {
    expect.assertions(2)
    await get('/notlocalized').catch(error => expect(error.statusCode).toBe(404))
    await get('/fr/fr/notlocalized').catch(error => expect(error.statusCode).toBe(404))
  })

  test('route specifies options with non-supported locale', async () => {
    await expect(get('/simple')).resolves.toBeDefined()
    await expect(get('/fr/simple')).resolves.toBeDefined()
    await expect(get('/es/simple')).rejects.toBeDefined()
  })

  describe('posts', () => {
    let html
    let title
    let langSwitcherLink
    let link
    const getElements = () => {
      const dom = getDom(html)
      title = dom.querySelector('h1')
      langSwitcherLink = dom.querySelector('#lang-switcher a')
      link = dom.querySelector('#post-link')
    }

    test('/posts contains EN text, link to /fr/articles/ & link to /posts/my-post', async () => {
      html = await get('/posts')
      getElements()
      expect(title.textContent).toBe('Posts')
      expect(langSwitcherLink.href).toBe('/fr/articles/')
      expect(link.href).toBe('/posts/my-post')
    })

    test('/posts/my-post contains EN text, link to /fr/articles/mon-article & link to /posts/', async () => {
      html = await get('/posts/my-post')
      getElements()
      expect(title.textContent).toBe('Posts')
      expect(langSwitcherLink.href).toBe('/fr/articles/mon-article')
      expect(link.href).toBe('/posts/')
    })

    test('/fr/articles contains FR text, link to /posts/ & link to /fr/articles/mon-article', async () => {
      html = await get('/fr/articles')
      getElements()
      expect(title.textContent).toBe('Articles')
      expect(langSwitcherLink.href).toBe('/posts/')
      expect(link.href).toBe('/fr/articles/mon-article')
    })

    test('/fr/articles/mon-article contains FR text, link to /posts/my-post & link to /fr/articles/', async () => {
      html = await get('/fr/articles/mon-article')
      getElements()
      expect(title.textContent).toBe('Articles')
      expect(langSwitcherLink.href).toBe('/posts/my-post')
      expect(link.href).toBe('/fr/articles/')
    })
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

  test('navigates to child route with nameless parent and checks path to other locale', async () => {
    const window = await nuxt.renderAndGetWindow(url('/posts'))

    const langSwitcherLink = window.document.querySelector('#lang-switcher a')
    const link = window.document.querySelector('#post-link')
    expect(langSwitcherLink.getAttribute('href')).toEqual('/fr/articles/')
    expect(link.getAttribute('href')).toEqual('/posts/my-post')
  })

  test('navigates to dynamic child route and checks path to other locale', async () => {
    const window = await nuxt.renderAndGetWindow(url('/dynamicNested/1'))

    const body = window.document.querySelector('body')
    expect(body.textContent).toContain('Category')
    expect(body.textContent).not.toContain('Subcategory')

    // Will only work if navigated-to route has a name.
    expect(window.$nuxt.switchLocalePath('fr')).toBe('/fr/imbrication-dynamique/1')
  })

  test('/dynamicNested/1/2/3 contains link to /fr/imbrication-dynamique/1/2/3', async () => {
    const html = await get('/dynamicNested/1/2/3')
    const dom = getDom(html)
    expect(dom.querySelector('h1').textContent).toBe('Category 1')
    expect(dom.querySelector('h2').textContent).toBe('Subcategory 2')
    expect(dom.querySelector('h3').textContent).toBe('Post 3')

    const langSwitcher = dom.querySelector('#lang-switcher')
    expect(langSwitcher).not.toBeNull()
    expect(langSwitcher.children.length).toBe(1)
    expect(langSwitcher.children[0].getAttribute('href')).toBe('/fr/imbrication-dynamique/1/2/3')
    expect(langSwitcher.children[0].textContent).toBe('Français')
  })

  test('/fr/imbrication-dynamique/1/2/3 contains link to /dynamicNested/1/2/3', async () => {
    const html = await get('/fr/imbrication-dynamique/1/2/3')
    const dom = getDom(html)
    expect(dom.querySelector('h1').textContent).toBe('Category 1')
    expect(dom.querySelector('h2').textContent).toBe('Subcategory 2')
    expect(dom.querySelector('h3').textContent).toBe('Post 3')

    const langSwitcher = dom.querySelector('#lang-switcher')
    expect(langSwitcher).not.toBeNull()
    expect(langSwitcher.children.length).toBe(1)
    expect(langSwitcher.children[0].getAttribute('href')).toBe('/dynamicNested/1/2/3')
    expect(langSwitcher.children[0].textContent).toBe('English')
  })

  test('localePath returns correct path', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.localePath('about')).toBe('/about-us')
    expect(window.$nuxt.localePath('about', 'fr')).toBe('/fr/a-propos')
    expect(window.$nuxt.localePath('/about-us')).toBe('/about-us')
    expect(window.$nuxt.localePath({ path: '/about' })).toBe('/about-us')
    expect(window.$nuxt.localePath({ path: '/about/' })).toBe('/about-us')
  })

  test('switchLocalePath returns correct path', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.switchLocalePath('fr')).toBe('/fr')
  })

  test('getRouteBaseName returns correct name', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    expect(window.$nuxt.getRouteBaseName()).toBe('index')
  })

  test('getRouteBaseName returns name of passed in route', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const aboutRoute = window.$nuxt.$router.options.routes.find(route => route.path === '/about-us')
    expect(aboutRoute).toBeDefined()
    expect(aboutRoute.name).toBeDefined()
    expect(window.$nuxt.getRouteBaseName(aboutRoute)).toBe('about')
  })

  test('localePath, switchLocalePath, getRouteBaseName works from a middleware', async () => {
    const html = await get('/middleware')
    const dom = getDom(html)
    expect(dom.querySelector('#paths').textContent).toBe('/middleware,/fr/middleware-fr')
    expect(dom.querySelector('#name').textContent).toBe('middleware')
  })

  test('redirects to existing route', async () => {
    const window = await nuxt.renderAndGetWindow(url('/about'))
    const newRoute = window.$nuxt.switchLocalePath()
    expect(newRoute).toBe('/about-us')
  })

  test('fallbacks to default locale with invalid locale cookie', async () => {
    const requestOptions = {
      headers: {
        Cookie: 'i18n_redirected=invalid'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale').textContent).toBe('locale: en')
  })

  test('registers message using vueI18nLoader', async () => {
    const html = await get('/loader')
    const dom = getDom(html)
    expect(dom.querySelector('#container').textContent).toBe('string from loader EN')
  })

  test('registers message using vueI18nLoader from yaml block', async () => {
    let html = await get('/loader-yaml')
    let dom = getDom(html)
    let title = dom.querySelector('p')
    expect(title.textContent).toBe('hello world!')

    html = await get('/fr/loader-yaml')
    dom = getDom(html)
    title = dom.querySelector('p')
    expect(title.textContent).toBe('Bonjour le monde!')
  })
})

describe('hreflang', () => {
  let nuxt

  beforeAll(async () => {
    const testConfig = loadConfig(__dirname, 'basic')

    // Override those after merging to overwrite original values.
    testConfig.i18n.locales = [
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

  test('sets SEO metadata properly', async () => {
    const html = await get('/')
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
        href: 'nuxt-app.localhost/',
        hreflang: 'en',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/fr',
        hreflang: 'fr',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/fr',
        hreflang: 'fr-FR',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/esVe',
        hreflang: 'es',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/es',
        hreflang: 'es-ES',
        rel: 'alternate',
        tagName: 'link'
      },
      {
        href: 'nuxt-app.localhost/esVe',
        hreflang: 'es-VE',
        rel: 'alternate',
        tagName: 'link'
      }
    ]

    expect(seoTags).toEqual(expectedSeoTags)
  })

  afterAll(async () => {
    await nuxt.close()
  })
})

describe('lazy loading', () => {
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
    expect(title.textContent).toBe('in english')
  })
})

describe('with empty configuration', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = (await setup(loadConfig(__dirname, 'basic', { i18n: {} }))).nuxt
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('does not remove all routes', async () => {
    await nuxt.renderAndGetWindow(url('/fallback'))
  })
})

describe('with rootRedirect (string)', () => {
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
})

describe('with rootRedirect (object)', () => {
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

  test('canonical SEO link is added to prefixed default locale', async () => {
    const html = await get('/en')
    const dom = getDom(html)
    const links = dom.querySelectorAll('head link[rel="canonical"]')
    expect(links.length).toBe(1)
    expect(links[0].getAttribute('href')).toBe('nuxt-app.localhost/')
  })

  test('canonical SEO link is not added to non-prefixed default locale', async () => {
    const html = await get('/')
    const dom = getDom(html)
    const links = dom.querySelectorAll('head link[rel="canonical"]')
    expect(links.length).toBe(0)
  })
})

describe('no_prefix strategy', () => {
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
      }
    ]))
    expect(seoTags.filter(tag => tag.tagName === 'link')).toHaveLength(0)
  })

  test('/ contains EN text & link /about', async () => {
    const html = await get('/')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page').textContent).toBe('page: Homepage')

    const currentLocale = dom.querySelector('#current-locale')
    expect(currentLocale).not.toBeNull()
    expect(currentLocale.textContent).toBe('locale: en')

    const aboutLink = dom.querySelector('#link-about')
    expect(aboutLink).not.toBeNull()
    expect(aboutLink.getAttribute('href')).toBe('/about')
    expect(aboutLink.textContent).toBe('About us')
  })

  test('/about contains EN text & link /', async () => {
    const html = await get('/about')
    const dom = getDom(html)
    expect(dom.querySelector('#current-page').textContent).toBe('page: About us')

    const homeLink = dom.querySelector('#link-home')
    expect(homeLink).not.toBeNull()
    expect(homeLink.getAttribute('href')).toBe('/')
    expect(homeLink.textContent).toBe('Homepage')
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

  test('localePath with non-current locale triggers warning', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const spy = jest.spyOn(window.console, 'warn').mockImplementation(() => {})

    const newRoute = window.$nuxt.localePath('about', 'fr')
    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toContain('unsupported when using no_prefix')
    expect(newRoute).toBe('/about')

    spy.mockRestore()
  })

  test('fallbacks to default locale with invalid locale cookie', async () => {
    const requestOptions = {
      headers: {
        Cookie: 'i18n_redirected=invalid'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('#current-locale').textContent).toBe('locale: en')
  })
})

describe('no_prefix strategy + differentDomains', () => {
  let nuxt
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
  let nuxt
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
    expect(dom.querySelector('#current-locale').textContent).toBe('locale: en')

    html = await get('/fr/aaa')
    dom = getDom(html)
    expect(dom.querySelector('#current-locale').textContent).toBe('locale: fr')
  })
})

describe('hash mode', () => {
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
})

describe('baseUrl', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        strategy: 'prefix_and_default',
        baseUrl: (context) => {
          if (process.server) {
            return context.req.headers['x-override-base-url']
          }
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
        rel: 'canonical',
        href: 'CUSTOM/?noncanonical' // TODO: This seems broken. Should not include query.
      }
    ]

    expect(seoTags).toEqual(expectedSeoTags)
  })
})

describe('differentDomains enabled', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        differentDomains: true,
        seo: false
      }
    }

    const localConfig = loadConfig(__dirname, 'basic', override, { merge: true })

    // Override after merging options to avoid arrays being merged.
    localConfig.i18n.locales = [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        domain: 'en.nuxt-app.localhost'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        domain: 'fr.nuxt-app.localhost'
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
    expect(dom.querySelector('body').textContent).toContain('page: Homepage')
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
    expect(dom.querySelector('body').textContent).toContain('page: Accueil')
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
    expect(dom.querySelector('body').textContent).toContain('page: Homepage')
  })

  test('x-forwarded-host does match locale\'s domain (fr)', async () => {
    const requestOptions = {
      headers: {
        'X-Forwarded-Host': 'fr.nuxt-app.localhost'
      }
    }
    const html = await get('/', requestOptions)
    const dom = getDom(html)
    expect(dom.querySelector('body').textContent).toContain('page: Accueil')
  })
})

// This is a special case due to vue-i18n defaulting to en-US for `defaultLocale`
// and `fallbackLocale` which can prevent us from applying locale initially.
describe('en-US locale with no explicit default locale (issue #628)', () => {
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
    await expect(dom.querySelector('body').textContent).toContain('page: Homepage')
  })
})

describe('external vue-i18n configuration', () => {
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
    expect(dom.querySelector('#current-page').textContent).toBe('page: HOMEPAGE')
  })
})

describe('parsePages disabled', () => {
  let nuxt

  beforeAll(async () => {
    const override = {
      i18n: {
        parsePages: false,
        pages: {
          about: false,
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
    await expect(get('/about')).resolves.toBeDefined()
    await expect(get('/fr/about')).rejects.toBeDefined()
  })
})

describe('vuex disabled', () => {
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
    expect(getDom(await get('/')).querySelector('#current-locale').textContent).toBe('locale: en')
    expect(getDom(await get('/fr')).querySelector('#current-locale').textContent).toBe('locale: fr')
  })
})

describe('no_prefix + detectBrowserLanguage + alwaysRedirect', () => {
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
    expect(dom.querySelector('#current-locale').textContent).toBe('locale: en')
  })
})

describe('prefix + detectBrowserLanguage + alwaysRedirect', () => {
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
    expect(dom.querySelector('#current-locale').textContent).toBe('locale: fr')
  })
})

describe('generate with detectBrowserLanguage.fallbackLocale', () => {
  const distDir = resolve(__dirname, 'fixture', 'basic', '.nuxt-generate')

  beforeAll(async () => {
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
    expect(dom.querySelector('#current-page').textContent).toBe('page: Homepage')

    contents = readFileSync(resolve(distDir, 'fr/index.html'), 'utf-8')
    dom = getDom(contents)
    expect(dom.querySelector('#current-page')).toBeDefined()
    expect(dom.querySelector('#current-page').textContent).toBe('page: Accueil')
  })
})
