import VueI18n, { Locale, I18nOptions, IVueI18n } from 'vue-i18n'
import { Context as NuxtContext } from '@nuxt/types'
import './vue'

export { Locale }
export type Strategies = 'no_prefix' | 'prefix_except_default' | 'prefix' | 'prefix_and_default'
export type Directions = 'ltr' | 'rtl' | 'auto'

export interface LocaleObject extends Record<string, any> {
  code: Locale
  dir?: Directions
  file?: string
  isCatchallLocale?: boolean
  iso?: string
}

export interface DetectBrowserLanguageOptions {
  alwaysRedirect?: boolean
  cookieCrossOrigin?: boolean
  cookieDomain?: string | null
  cookieKey?: string
  cookieSecure?: boolean
  fallbackLocale?: Locale | null
  onlyOnRoot?: boolean
  useCookie?: boolean
}

export interface RootRedirectOptions {
  path: string
  statusCode: number
}

export interface VuexOptions {
  moduleName?: string
  syncLocale?: boolean
  syncMessages?: boolean
  syncRouteParams?: boolean
}

export interface LazyOptions {
  skipNuxtState?: boolean
}

// Options that are also exposed on the VueI18n instance.
export interface BaseOptions {
  defaultDirection?: Directions
  defaultLocale?: Locale
  defaultLocaleRouteNameSuffix?: string
  differentDomains?: boolean
  locales?: Locale[] | LocaleObject[]
  onBeforeLanguageSwitch?: (oldLocale: string, newLocale: string, initialSetup: boolean, context: NuxtContext) => string | void
  onLanguageSwitched?: (oldLocale: string, newLocale: string) => void
}

export interface Options extends BaseOptions {
  baseUrl?: string | ((context: NuxtContext) => string)
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean | LazyOptions
  pages?: {
    [key: string]: false | {
      [key: string]: false | string
    }
  }
  parsePages?: boolean
  rootRedirect?: string | null | RootRedirectOptions
  routesNameSeparator?: string
  seo?: boolean
  skipSettingLocaleOnNavigate?: boolean,
  strategy?: Strategies
  vueI18n?: I18nOptions | string
  vueI18nLoader?: boolean
  vuex?: VuexOptions | false
}

export interface IVueI18nNuxt extends Required<BaseOptions> {
  finalizePendingLocaleChange(): Promise<void>
  getBrowserLocale(): string | undefined
  getLocaleCookie(): string | undefined
  loadedLanguages: string[] | undefined
  localeCodes: readonly Locale[]
  localeProperties: LocaleObject
  setLocale(locale: string): Promise<void>
  setLocaleCookie(locale: string): void
  waitForPendingLocaleChange(): Promise<void>
}

export type NuxtI18nInstance = VueI18n & IVueI18n
