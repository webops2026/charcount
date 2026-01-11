"use client";

import { useLocale } from 'next-intl';
import { FileText, Target, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

const features = {
  ja: [
    {
      href: '/manuscript',
      icon: FileText,
      title: '原稿用紙エディタ',
      description: '200字/400字/800字詰め原稿用紙で文章を確認',
    },
  ],
  en: [
    {
      href: '/manuscript',
      icon: FileText,
      title: 'Manuscript Paper',
      description: 'View your text in traditional Japanese manuscript format',
    },
  ],
};

export function FeatureLinks() {
  const locale = useLocale();
  const items = features[locale as keyof typeof features] || features.en;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
