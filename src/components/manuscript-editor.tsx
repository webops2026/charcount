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
    // 魚尾付き原稿用紙: 横21列（左10列 + 魚尾1列 + 右10列）× 縦20行
    const scale = 2;
    const cellSize = 40; // サイズ感を調整（少し大きく）
    const gyobiWidth = cellSize * 0.8; // 魚尾列の幅（画像を参考に少し太めに）
    const padding = 70; // 余白を調整
    
    // 幅 = 左10列 + 魚尾列 + 右10列
    const textCols = config.cols; // 文字用の列数（20列）
    const halfCols = textCols / 2; // 片側の列数（10列）
    const width = textCols * cellSize + gyobiWidth + padding * 2;
    const height = config.rows * cellSize + padding * 2;

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(scale, scale);

    // 背景（白）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // グリッド線を描画（あずき色/赤茶色 - 画像の色に合わせる）
    const lineColor = '#c07070'; // 基本の色
    
    // 計算用の位置
    const leftSectionEnd = padding + halfCols * cellSize; // 左側10列の終わり
    const gyobiStart = leftSectionEnd; // 魚尾列の開始
    const gyobiEnd = leftSectionEnd + gyobiWidth; // 魚尾列の終了
    const rightSectionStart = gyobiEnd; // 右側10列の開始
    
    // 1. 通常のグリッド線（実線・細め）
    ctx.strokeStyle = '#e0a0a0'; // 少し薄く
    ctx.lineWidth = 0.6; // 細く
    ctx.setLineDash([]); // 実線
    
    // 左側の縦線
    for (let col = 1; col < halfCols; col++) {
      if (col === 5) continue;
      const x = padding + col * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    // 右側の縦線
    for (let col = 1; col < halfCols; col++) {
      if (col === 5) continue;
      const x = rightSectionStart + col * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    // 横線
    for (let row = 1; row < config.rows; row++) {
      if (row % 5 === 0) continue;
      const y = padding + row * cellSize;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // 2. 5行・5列ごとの中太線
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.0; // 少し太く

    // 左側5列目の縦線
    const leftCol5 = padding + 5 * cellSize;
    ctx.beginPath();
    ctx.moveTo(leftCol5, padding);
    ctx.lineTo(leftCol5, height - padding);
    ctx.stroke();
    
    // 右側5列目の縦線
    const rightCol5 = rightSectionStart + 5 * cellSize;
    ctx.beginPath();
    ctx.moveTo(rightCol5, padding);
    ctx.lineTo(rightCol5, height - padding);
    ctx.stroke();

    // 横線（5行ごと）
    for (let row = 5; row < config.rows; row += 5) {
      const y = padding + row * cellSize;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // 3. 外枠を極太に（画像の特徴）
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 4.0; // かなり太く
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // 4. 魚尾（ぎょび）- 中央の列
    const topY = padding;
    const bottomY = height - padding;
    const gyobiCenterX = gyobiStart + gyobiWidth / 2;
    
    // 魚尾列の左右の縦線（中太）
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5; // 外枠よりは細く、グリッドより太く
    
    ctx.beginPath();
    ctx.moveTo(gyobiStart, topY);
    ctx.lineTo(gyobiStart, bottomY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(gyobiEnd, topY);
    ctx.lineTo(gyobiEnd, bottomY);
    ctx.stroke();
    
    // 魚尾マーク（極太）
    ctx.lineWidth = 4.0; // 外枠と同じくらい太く
    ctx.lineCap = 'round'; // 端を丸くして柔らかさを出す
    
    // 上部の魚尾マーク（アーチ型 ⌒）
    const upperY = padding + 4 * cellSize; // 4行目の下
    const markWidth = gyobiWidth * 0.8; // 列幅の80%
    const markLeft = gyobiCenterX - markWidth / 2;
    const markRight = gyobiCenterX + markWidth / 2;
    const archHeight = cellSize * 0.15; // アーチの高さ
    
    ctx.beginPath();
    ctx.moveTo(markLeft, upperY + archHeight);
    ctx.quadraticCurveTo(gyobiCenterX, upperY - archHeight, markRight, upperY + archHeight);
    ctx.stroke();
    
    // 下部の魚尾マーク（横線 ー）
    const lowerY = padding + 15 * cellSize; // 15行目の下
    
    ctx.beginPath();
    ctx.moveTo(markLeft, lowerY);
    ctx.lineTo(markRight, lowerY);
    ctx.stroke();
    
    ctx.lineCap = 'butt'; // 設定を戻す

    // このページの文字を取得
    const startIndex = pageIndex * config.charsPerPage;
    const endIndex = Math.min(startIndex + config.charsPerPage, chars.length);
    const pageChars = chars.slice(startIndex, endIndex).split('');

    // 文字を配置（縦書き：右から左、上から下）
    // 魚尾付き原稿用紙：右側10列 → 左側10列の順
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `${cellSize * 0.70}px "Noto Serif JP", "游明朝", "YuMincho", "Hiragino Mincho ProN", "HG明朝E", "serif"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let charIndex = 0;

    // X座標を計算する関数（右側10列: colIndex 0-9、左側10列: colIndex 10-19）
    const getXPosition = (colIndex: number): number => {
      if (colIndex < halfCols) {
        // 右側10列（右端から中央方向へ: 列9, 8, 7, ... 0）
        const rightColIndex = halfCols - 1 - colIndex;
        return rightSectionStart + rightColIndex * cellSize + cellSize / 2;
      } else {
        // 左側10列（魚尾の左から左端方向へ: 列9, 8, 7, ... 0）
        const leftColIndex = halfCols - 1 - (colIndex - halfCols);
        return padding + leftColIndex * cellSize + cellSize / 2;
      }
    };

    // 全20列を順番に処理（右側10列 → 左側10列）
    for (let colIndex = 0; colIndex < textCols && charIndex < pageChars.length; colIndex++) {
      // 上から下へ行を進む
      for (let row = 0; row < config.rows && charIndex < pageChars.length; row++) {
        const char = pageChars[charIndex];
        const x = getXPosition(colIndex);
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
          ctx.font = `${cellSize * 0.55}px "Noto Serif JP", "游明朝", "YuMincho", "Hiragino Mincho ProN", "serif"`;
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

    // ページ番号（右下外側）
    if (totalPages > 1) {
      ctx.fillStyle = '#666';
      ctx.font = `${16}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${pageIndex + 1} / ${totalPages}`, width / 2, height - 25);
    }
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

        {/* 原稿用紙プレビュー（レスポンシブグリッド・右から左） */}
        {chars.length > 0 ? (
          <div
            ref={containerRef}
            className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 rounded-lg overflow-x-auto"
          >
            <div 
              className="flex gap-12 flex-row-reverse justify-center flex-wrap"
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <div key={i}>
                  <canvas
                    ref={el => {
                      canvasRefs.current[i] = el;
                    }}
                    className="shadow-lg rounded-sm"
                    style={{ 
                      imageRendering: 'crisp-edges',
                      backgroundColor: '#ffffff',
                      display: 'block'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-lg font-medium">原稿用紙プレビュー</p>
            <p className="text-sm mt-2">上のテキストエリアに文章を入力すると、ここに原稿用紙形式で表示されます</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
