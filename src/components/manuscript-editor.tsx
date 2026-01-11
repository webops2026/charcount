"use client";

import { useRef, useEffect, useCallback } from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface ManuscriptEditorProps {
  text: string;
  onTextChange: (text: string) => void;
}

type PaperSize = '200' | '400' | '800';

const paperConfigs = {
  '200': { rows: 10, cols: 20, charsPerPage: 200, name: '200字詰め' },
  '400': { rows: 20, cols: 20, charsPerPage: 400, name: '400字詰め' },
  '800': { rows: 40, cols: 20, charsPerPage: 800, name: '800字詰め' },
};

export function ManuscriptEditor({ text }: ManuscriptEditorProps) {
  const [paperSize, setPaperSize] = useState<PaperSize>('400');
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const config = paperConfigs[paperSize];
  const chars = text.replace(/\n/g, '');
  const totalPages = Math.max(1, Math.ceil(chars.length / config.charsPerPage));

  // 原稿用紙を描画
  const drawManuscript = useCallback((pageIndex: number) => {
    const canvas = canvasRefs.current[pageIndex];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズ設定（高解像度対応）
    const scale = 2;
    const cellSize = 32;
    const padding = 60;
    const width = config.cols * cellSize + padding * 2;
    const height = config.rows * cellSize + padding * 2;

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(scale, scale);

    // 背景（薄いクリーム色）
    ctx.fillStyle = '#fffef8';
    ctx.fillRect(0, 0, width, height);

    // グリッド線を描画（淡いピンク色）
    ctx.strokeStyle = '#f0b8b1';
    ctx.lineWidth = 0.8;

    // 縦線（列）
    for (let col = 0; col <= config.cols; col++) {
      const x = padding + col * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // 横線（行）
    for (let row = 0; row <= config.rows; row++) {
      const y = padding + row * cellSize;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // 5行ごとに太線
    ctx.strokeStyle = '#e08a81';
    ctx.lineWidth = 1.5;
    for (let row = 0; row <= config.rows; row += 5) {
      const y = padding + row * cellSize;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // 外枠を太く
    ctx.strokeStyle = '#c56f68';
    ctx.lineWidth = 3;
    ctx.strokeRect(padding, padding, config.cols * cellSize, config.rows * cellSize);

    // このページの文字を取得
    const startIndex = pageIndex * config.charsPerPage;
    const endIndex = Math.min(startIndex + config.charsPerPage, chars.length);
    const pageChars = chars.slice(startIndex, endIndex).split('');

    // 文字を配置（縦書き：右から左、上から下）
    ctx.fillStyle = '#222';
    ctx.font = `${cellSize * 0.65}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let charIndex = 0;

    // 右から左へ列を進む
    for (let col = config.cols - 1; col >= 0 && charIndex < pageChars.length; col--) {
      // 上から下へ行を進む
      for (let row = 0; row < config.rows && charIndex < pageChars.length; row++) {
        const char = pageChars[charIndex];
        const x = padding + col * cellSize + cellSize / 2;
        const y = padding + row * cellSize + cellSize / 2;

        // 句読点の位置調整（右上に配置）
        if (['、', '。', '，', '．'].includes(char)) {
          ctx.save();
          ctx.translate(x, y);
          ctx.fillText(char, cellSize * 0.25, -cellSize * 0.25);
          ctx.restore();
        }
        // 開き括弧（上寄りに）
        else if (['「', '『', '（', '(', '【', '《'].includes(char)) {
          ctx.save();
          ctx.translate(x, y);
          ctx.fillText(char, 0, -cellSize * 0.12);
          ctx.restore();
        }
        // 閉じ括弧（下寄りに）
        else if (['」', '』', '）', ')', '】', '》'].includes(char)) {
          ctx.save();
          ctx.translate(x, y);
          ctx.fillText(char, 0, cellSize * 0.12);
          ctx.restore();
        }
        // 小文字（ゃゅょなど）を中央やや右に
        else if (['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'っ', 'ゎ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ッ', 'ヮ'].includes(char)) {
          ctx.save();
          ctx.translate(x, y);
          ctx.font = `${cellSize * 0.5}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`;
          ctx.fillText(char, cellSize * 0.08, cellSize * 0.08);
          ctx.restore();
        }
        // 長音記号（縦書き用に回転）
        else if (char === 'ー') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 2);
          ctx.fillText('｜', 0, 0);
          ctx.restore();
        }
        // 通常の文字
        else {
          ctx.fillText(char, x, y);
        }

        charIndex++;
      }
    }

    // ページ番号（右下）
    ctx.fillStyle = '#999';
    ctx.font = `${14}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${pageIndex + 1} / ${totalPages}`, width - padding + 50, height - 20);
  }, [config, chars, totalPages]);

  useEffect(() => {
    // 各ページを描画
    for (let i = 0; i < totalPages; i++) {
      drawManuscript(i);
    }
  }, [drawManuscript, totalPages]);

  // PDFとしてダウンロード（全ページ）
  const handleDownload = useCallback(() => {
    if (totalPages === 0) return;

    // 最初のページのみダウンロード（複数ページ対応は後で実装可能）
    const canvas = canvasRefs.current[0];
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `manuscript_${paperSize}_${totalPages}pages.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [paperSize, totalPages]);

  // 印刷（全ページ）
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const canvasElements = canvasRefs.current.filter(c => c !== null);
    const imagesHTML = canvasElements.map(canvas => 
      `<img src="${canvas.toDataURL('image/png')}" style="page-break-after: always; max-width: 100%;" />`
    ).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>原稿用紙 - ${config.name} (${totalPages}ページ)</title>
          <style>
            body { margin: 0; padding: 20px; }
            img { display: block; margin: 0 auto 20px; max-width: 100%; height: auto; }
            @media print { 
              body { margin: 0; padding: 0; } 
              img { page-break-after: always; max-width: 100%; }
            }
          </style>
        </head>
        <body>${imagesHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, [config.name, totalPages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span className="flex items-center gap-2">
            📝 原稿用紙エディタ
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {chars.length} 文字
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                {totalPages} ページ
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={chars.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                ダウンロード
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={chars.length === 0}
              >
                <Printer className="h-4 w-4 mr-1" />
                印刷
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* サイズ選択 */}
        <Tabs value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="200">200字詰め</TabsTrigger>
            <TabsTrigger value="400">400字詰め</TabsTrigger>
            <TabsTrigger value="800">800字詰め</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 原稿用紙プレビュー（横スクロール） */}
        {chars.length > 0 ? (
          <div
            ref={containerRef}
            className="overflow-x-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 rounded-lg"
          >
            <div className="flex gap-8 w-max">
              {Array.from({ length: totalPages }, (_, i) => (
                <div key={i} className="flex-shrink-0">
                  <canvas
                    ref={el => canvasRefs.current[i] = el}
                    className="shadow-2xl rounded-sm"
                    style={{ 
                      imageRendering: 'crisp-edges',
                      backgroundColor: '#fffef8'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-lg">
            <p className="text-lg">テキストを入力すると、原稿用紙が表示されます</p>
            <p className="text-sm mt-2">上のテキストエリアに文章を入力してください</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
