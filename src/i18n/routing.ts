import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ja', 'en', 'es', 'zh', 'ko', 'fr', 'de', 'pt'],
  defaultLocale: 'ja',
  localePrefix: 'always'
});

export type Locale = (typeof routing.locales)[number];
