"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Copy, Check, Trash2, FileText, Clock, BarChart2, Hash, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { analyzeText, checkSNS, formatTime, formatTimeEn, type TextStats, type SNSCheck } from '@/lib/text-analysis';

export function CharacterCounter() {
  const t = useTranslations('counter');
  const locale = useLocale();
  const [text, setText] = useState('');
  const [stats, setStats] = useState<TextStats | null>(null);
  const [snsChecks, setSnsChecks] = useState<SNSCheck[]>([]);
  const [copied, setCopied] = useState(false);

  // ローカルストレージから復元
  useEffect(() => {
    const saved = localStorage.getItem('charcount-text');
    if (saved) {
      setText(saved);
    }
  }, []);

  // テキスト変更時に分析を実行
  useEffect(() => {
    const analyzed = analyzeText(text);
    setStats(analyzed);
    setSnsChecks(checkSNS(text));
    
    // ローカルストレージに保存
    localStorage.setItem('charcount-text', text);
  }, [text]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleClear = useCallback(() => {
    setText('');
    localStorage.removeItem('charcount-text');
  }, []);

  const formatTimeLocale = locale === 'ja' ? formatTime : formatTimeEn;

  return (
    <div className="space-y-6">
      {/* メインタイトル */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === 'ja' ? '文字数カウント' : 'Character Counter'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ja' 
            ? 'リアルタイムで文字数、単語数、読了時間を計測' 
            : 'Real-time character count, word count, and reading time'}
        </p>
      </div>

      {/* テキストエリア */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="relative">
            <Textarea
              placeholder={t('placeholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] md:min-h-[300px] text-base resize-y font-mono"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!text}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('clear')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!text}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    {t('copy')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 基本統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Hash className="h-4 w-4" />}
          label={t('stats.characters')}
          value={stats?.characters ?? 0}
          highlight
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label={t('stats.words')}
          value={stats?.words ?? 0}
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4" />}
          label={t('stats.sentences')}
          value={stats?.sentences ?? 0}
        />
        <StatCard
          icon={<BarChart2 className="h-4 w-4" />}
          label={t('stats.paragraphs')}
          value={stats?.paragraphs ?? 0}
        />
      </div>

      {/* タブで詳細情報を表示 */}
      <Tabs defaultValue="time" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="time">
            <Clock className="h-4 w-4 mr-2 hidden sm:inline" />
            {t('time.title')}
          </TabsTrigger>
          <TabsTrigger value="chars">
            {locale === 'ja' ? t('charTypes.title') : 'Details'}
          </TabsTrigger>
          <TabsTrigger value="sns">{t('sns.title')}</TabsTrigger>
          <TabsTrigger value="quality">{t('quality.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TimeCard
                  label={t('time.reading')}
                  seconds={stats?.readingTimeSeconds ?? 0}
                  formatFn={formatTimeLocale}
                />
                <TimeCard
                  label={t('time.speaking')}
                  seconds={stats?.speakingTimeSeconds ?? 0}
                  formatFn={formatTimeLocale}
                />
                <TimeCard
                  label={t('time.typing')}
                  seconds={stats?.typingTimeSeconds ?? 0}
                  formatFn={formatTimeLocale}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chars" className="mt-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              {locale === 'ja' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CharTypeCard label={t('charTypes.hiragana')} count={stats?.hiragana ?? 0} total={stats?.characters ?? 0} />
                  <CharTypeCard label={t('charTypes.katakana')} count={stats?.katakana ?? 0} total={stats?.characters ?? 0} />
                  <CharTypeCard label={t('charTypes.kanji')} count={stats?.kanji ?? 0} total={stats?.characters ?? 0} />
                  <CharTypeCard label={t('charTypes.alphabet')} count={stats?.alphabet ?? 0} total={stats?.characters ?? 0} />
                  <CharTypeCard label={t('charTypes.numbers')} count={stats?.numbers ?? 0} total={stats?.characters ?? 0} />
                  <CharTypeCard label={t('charTypes.symbols')} count={stats?.symbols ?? 0} total={stats?.characters ?? 0} />
                  <CharTypeCard label={t('charTypes.spaces')} count={stats?.spaces ?? 0} total={stats?.characters ?? 0} />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <DetailCard label={t('stats.charactersNoSpace')} value={stats?.charactersNoSpace ?? 0} />
                  <DetailCard label={t('stats.lines')} value={stats?.lines ?? 0} />
                  <DetailCard label={t('stats.bytes')} value={stats?.bytesUTF8 ?? 0} suffix=" bytes" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sns" className="mt-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {snsChecks.slice(0, 4).map((check) => (
                  <SNSCheckRow key={check.platform} check={check} t={t} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="mt-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-6">
                <QualityScore
                  label={t('quality.readability')}
                  score={stats?.readabilityScore ?? 0}
                />
                <QualityScore
                  label={t('quality.complexity')}
                  score={stats?.complexityScore ?? 0}
                  inverse
                />
                <QualityScore
                  label={t('quality.diversity')}
                  score={stats?.diversityScore ?? 0}
                />
              </div>

              {stats && stats.topKeywords.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="font-medium mb-3">{t('keywords.title')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.topKeywords.map((kw, i) => (
                        <Badge key={i} variant="secondary">
                          {kw.word} ({kw.count}{t('keywords.count')}, {kw.percentage}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 原稿用紙換算（日本語のみ） */}
      {locale === 'ja' && stats && stats.characters > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('manuscript.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <ManuscriptCard
                label={t('manuscript.size200')}
                pages={Math.ceil(stats.characters / 200)}
                unit={t('manuscript.pages')}
              />
              <ManuscriptCard
                label={t('manuscript.size400')}
                pages={Math.ceil(stats.characters / 400)}
                unit={t('manuscript.pages')}
              />
              <ManuscriptCard
                label={t('manuscript.size800')}
                pages={Math.ceil(stats.characters / 800)}
                unit={t('manuscript.pages')}
              />
              <ManuscriptCard
                label={t('manuscript.bunko')}
                pages={Math.ceil(stats.characters / 600)}
                unit={t('manuscript.pages')}
              />
              <ManuscriptCard
                label={t('manuscript.shinsho')}
                pages={Math.ceil(stats.characters / 500)}
                unit={t('manuscript.pages')}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// サブコンポーネント
function StatCard({ 
  icon, 
  label, 
  value, 
  highlight = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeCard({ 
  label, 
  seconds, 
  formatFn 
}: { 
  label: string; 
  seconds: number;
  formatFn: (s: number) => string;
}) {
  return (
    <div className="text-center p-4 rounded-lg bg-muted">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-semibold">{formatFn(seconds)}</div>
    </div>
  );
}

function CharTypeCard({ 
  label, 
  count, 
  total 
}: { 
  label: string; 
  count: number; 
  total: number;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="p-3 rounded-lg bg-muted">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">{count.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground">({percentage}%)</span>
      </div>
    </div>
  );
}

function DetailCard({ 
  label, 
  value, 
  suffix = '' 
}: { 
  label: string; 
  value: number;
  suffix?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value.toLocaleString()}{suffix}</div>
    </div>
  );
}

function SNSCheckRow({ 
  check, 
  t 
}: { 
  check: SNSCheck; 
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const statusColor = {
    ok: 'bg-green-500',
    warning: 'bg-yellow-500',
    over: 'bg-red-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">{check.platform}</span>
        <span className={`text-sm ${check.status === 'over' ? 'text-red-500' : 'text-muted-foreground'}`}>
          {check.current.toLocaleString()} / {check.limit.toLocaleString()}
        </span>
      </div>
      <Progress 
        value={Math.min(check.percentage, 100)} 
        className="h-2"
      />
      <div className="flex justify-between text-sm">
        <Badge 
          variant={check.status === 'over' ? 'destructive' : check.status === 'warning' ? 'secondary' : 'outline'}
        >
          {check.status === 'over' 
            ? t('sns.over', { count: Math.abs(check.remaining) })
            : t('sns.remaining', { count: check.remaining })}
        </Badge>
        <div className={`w-2 h-2 rounded-full ${statusColor[check.status]}`} />
      </div>
    </div>
  );
}

function QualityScore({ 
  label, 
  score, 
  inverse = false 
}: { 
  label: string; 
  score: number;
  inverse?: boolean;
}) {
  const displayScore = inverse ? 100 - score : score;
  const color = displayScore >= 70 ? 'text-green-500' : displayScore >= 40 ? 'text-yellow-500' : 'text-red-500';
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span>{label}</span>
        <span className={`font-semibold ${color}`}>{Math.round(score)}/100</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

function ManuscriptCard({ 
  label, 
  pages, 
  unit 
}: { 
  label: string; 
  pages: number;
  unit: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{pages} <span className="text-sm font-normal">{unit}</span></div>
    </div>
  );
}
