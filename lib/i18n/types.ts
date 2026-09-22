export const locales = ['en', 'hi', 'mr'] as const
export type Locale = (typeof locales)[number]

export type TranslationKey =
  | 'brand.tagline'
  | 'nav.platform'
  | 'nav.solutions'
  | 'nav.workflow'
  | 'nav.security'
  | 'nav.about'
  | 'nav.resources'
  | 'hero.eyebrow'
  | 'hero.title'
  | 'hero.description'
  | 'hero.primary'
  | 'hero.secondary'
  | 'assistant.title'
  | 'assistant.summary'
  | 'assistant.human'
  | 'workflow.eyebrow'
  | 'workflow.title'
  | 'capabilities.eyebrow'
  | 'security.eyebrow'
  | 'cta.title'
  | 'cta.description'
  | 'footer.tagline'

export type Dictionary = Record<TranslationKey, string> | Record<string, string> 

export type LocaleOption = { code: Locale; label: string; nativeLabel: string }
