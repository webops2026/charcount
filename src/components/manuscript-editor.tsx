"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Printer, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ManuscriptEditorProps {
  text: string;
  onTextChange: (text: string) => void;
}

type PaperSize = '200' | '400' | '800';

const paperConfigs = {
  '200': { rows: 10, cols: 20, name: '200字詰め' },
  '400': { rows: 20, cols: 20, name: '400字詰め' },
  '800': { rows: 40, cols: 20, name: '800字詰め' },
};

export function ManuscriptEditor({ text, onTextChange }: ManuscriptEditorProps) {
  const t = useTranslations('counter');
  const [paperSize, setPaperSize] = useState<PaperSize>('400');
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const config = paperConfigs[paperSize];
  const totalCells = config.rows * config.cols;
  const filledCells = text.replace(/\n/g, '').length;
  const pages = Math.ceil(filledCells / totalCells) || 1;

  // 原稿用紙を描画
  const drawManuscript = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズ設定
    const cellSize = 28 * zoom;
    const padding = 40 * zoom;
    const width = config.cols * cellSize + padding * 2;
    const height = config.rows * cellSize + padding * 2;

    canvas.width = width;
    canvas.height = height;

    // 背景
    ctx.fillStyle = '#fffef5';
    ctx.fillRect(0, 0, width, height);

    // グリッド線を描画
    ctx.strokeStyle = '#e8847c';
    ctx.lineWidth = 1;

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

    // 外枠を太く
    ctx.strokeStyle = '#c56f68';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, config.cols * cellSize, config.rows * cellSize);

    // 文字を配置（縦書き：右から左、上から下）
    ctx.fillStyle = '#333';
    ctx.font = `${cellSize * 0.7}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = text.replace(/\n/g, '').split('');
    let charIndex = 0;

    // 右から左へ列を進む
    for (let col = config.cols - 1; col >= 0 && charIndex < chars.length; col--) {
      // 上から下へ行を進む
      for (let row = 0; row < config.rows && charIndex < chars.length; row++) {
        const char = chars[charIndex];
        const x = padding + col * cellSize + cellSize / 2;
        const y = padding + row * cellSize + cellSize / 2;

        // 句読点の位置調整
        if (['、', '。', '，', '．'].includes(char)) {
          ctx.fillText(char, x + cellSize * 0.2, y - cellSize * 0.2);
        } else if (['「', '『'].includes(char)) {
          ctx.fillText(char, x, y - cellSize * 0.1);
        } else if (['」', '』'].includes(char)) {
          ctx.fillText(char, x, y + cellSize * 0.1);
        } else {
          ctx.fillText(char, x, y);
        }

        charIndex++;
      }
    }

    // ページ情報
    ctx.fillStyle = '#666';
    ctx.font = `${14 * zoom}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${filledCells} / ${totalCells}字`, width - padding, height - 10 * zoom);
  }, [text, config, zoom, filledCells, totalCells]);

  useEffect(() => {
    drawManuscript();
  }, [drawManuscript]);

  // PDFとしてダウンロード（画像として）
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `manuscript_${paperSize}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [paperSize]);

  // 印刷
  const handlePrint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>原稿用紙 - ${config.name}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; height: auto; }
            @media print { body { margin: 0; } img { max-width: 100%; } }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [config.name]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            📝 原稿用紙エディタ
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filledCells} / {totalCells}字
            </Badge>
            <Badge variant="outline">
              {pages}ページ
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* サイズ選択 */}
        <Tabs value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="200">200字詰め</TabsTrigger>
            <TabsTrigger value="400">400字詰め</TabsTrigger>
            <TabsTrigger value="800">800字詰め</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 入力エリア */}
          <div className="space-y-2">
            <label className="text-sm font-medium">テキスト入力</label>
            <Textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="ここに文章を入力すると、右の原稿用紙にリアルタイムで反映されます..."
              className="min-h-[300px] font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTextChange('')}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                クリア
              </Button>
            </div>
          </div>

          {/* 原稿用紙プレビュー */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">プレビュー</label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border rounded-lg bg-muted/30 overflow-auto max-h-[500px]">
              <canvas
                ref={canvasRef}
                className="mx-auto"
                style={{ display: 'block' }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                ダウンロード
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-1" />
                印刷
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
