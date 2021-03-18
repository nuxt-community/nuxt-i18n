import './vue'
import { Locale, I18nOptions } from 'vue-i18n'
import { Context as NuxtContext } from '@nuxt/types'

export { NuxtVueI18n } from './nuxt-i18n'

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
  onlyOnNoPrefix?: boolean
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

// Options that are also exposed on the VueI18n instance.
export interface BaseOptions {
  beforeLanguageSwitch?: (oldLocale: string, newLocale: string) => void
  defaultDirection?: Directions
  defaultLocale?: Locale
  defaultLocaleRouteNameSuffix?: string
  differentDomains?: boolean
  locales?: Locale[] | LocaleObject[]
  onLanguageSwitched?: (oldLocale: string, newLocale: string) => void
}

export interface Options extends BaseOptions {
  baseUrl?: string | ((context: NuxtContext) => string)
  detectBrowserLanguage?: DetectBrowserLanguageOptions | false
  langDir?: string | null
  lazy?: boolean
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
