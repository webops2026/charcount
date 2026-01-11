"use client";

import { useTranslations } from 'next-intl';
import { Moon, Sun, Languages, Type } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const languageNames: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  es: 'Español',
  zh: '中文',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
};

export function Header() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Type className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none">{t('title')}</span>
            <span className="text-xs text-muted-foreground">{t('subtitle')}</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button variant="outline" size="icon" className="relative group">
                    <Languages className="h-4 w-4" />
                    <span className="sr-only">{t('language')}</span>
                  </Button>
                  <div className="absolute right-0 mt-2 w-40 rounded-md bg-popover border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-1">
                      {routing.locales.map((locale) => (
                        <Link
                          key={locale}
                          href={pathname}
                          locale={locale}
                          className="block w-full px-3 py-2 text-sm rounded-sm hover:bg-accent text-left"
                        >
                          {languageNames[locale]}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('language')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">
                    {theme === 'dark' ? t('lightMode') : t('darkMode')}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === 'dark' ? t('lightMode') : t('darkMode')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
