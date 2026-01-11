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
    // さらに各列の間にルビ用の細い列を追加
    const scale = 2;
    const cellSize = 40; // 文字マスのサイズ
    const gapWidth = cellSize * 0.25; // ルビ列（列間の小さい列）の幅
    const gyobiWidth = cellSize * 1.1; // 魚尾列の幅
    const padding = 70; // 余白
    
    // 片側の幅 = 10列分のセル + 9列分のギャップ（列間）
    const halfCols = config.cols / 2; // 10
    const sectionWidth = halfCols * cellSize + (halfCols - 1) * gapWidth;
    
    // 全体幅 = 左セクション + 魚尾 + 右セクション + 余白
    const width = sectionWidth * 2 + gyobiWidth + padding * 2;
    const height = config.rows * cellSize + padding * 2;

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(scale, scale);

    // 背景（白）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // グリッド線を描画（あずき色/赤茶色）
    const lineColor = '#c07070';
    
    // 計算用の開始位置
    const leftSectionStart = padding;
    const rightSectionStart = padding + sectionWidth + gyobiWidth;
    
    // 1. 通常のグリッド線（実線・細め）
    ctx.strokeStyle = '#e0a0a0'; 
    ctx.lineWidth = 0.6;
    ctx.setLineDash([]); 

    // ヘルパー関数: 指定セクションの縦線を描画
    const drawSectionVerticalLines = (startX: number) => {
      for (let i = 0; i < halfCols; i++) {
        const colX = startX + i * (cellSize + gapWidth);
        const rightX = colX + cellSize;

        // セルの左端線
        ctx.beginPath();
        ctx.moveTo(colX, padding);
        ctx.lineTo(colX, height - padding);
        ctx.stroke();
        
        // セルの右端線
        ctx.beginPath();
        ctx.moveTo(rightX, padding);
        ctx.lineTo(rightX, height - padding);
        ctx.stroke();
      }
    };

    drawSectionVerticalLines(leftSectionStart);
    drawSectionVerticalLines(rightSectionStart);
    
    // 横線（全体に通すことで、ギャップ部分に小さいマスができる）
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
    ctx.lineWidth = 1.0;

    // 縦の太線（5列区切り）
    // 左セクションの5列目の右側（全体で15列目の左側境界）
    const leftCol5X = leftSectionStart + 4 * (cellSize + gapWidth) + cellSize;
    ctx.beginPath();
    ctx.moveTo(leftCol5X, padding);
    ctx.lineTo(leftCol5X, height - padding);
    ctx.stroke();
    
    // 右セクションの5列目の右側（全体で5列目の左側境界）
    const rightCol5X = rightSectionStart + 4 * (cellSize + gapWidth) + cellSize;
    ctx.beginPath();
    ctx.moveTo(rightCol5X, padding);
    ctx.lineTo(rightCol5X, height - padding);
    ctx.stroke();

    // 横線（5行ごと）
    for (let row = 5; row < config.rows; row += 5) {
      const y = padding + row * cellSize;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // 3. 外枠を極太に
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 4.0;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // 4. 魚尾（ぎょび）
    const topY = padding;
    const bottomY = height - padding;
    const gyobiStartX = leftSectionStart + sectionWidth;
    const gyobiEndX = gyobiStartX + gyobiWidth;
    const gyobiCenterX = gyobiStartX + gyobiWidth / 2;
    
    // 魚尾列の左右の縦線（中太）
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(gyobiStartX, topY);
    ctx.lineTo(gyobiStartX, bottomY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(gyobiEndX, topY);
    ctx.lineTo(gyobiEndX, bottomY);
    ctx.stroke();
    
    // 魚尾マーク（極太）
    ctx.lineWidth = 4.0;
    ctx.lineCap = 'round';
    
    // 上部の魚尾マーク（アーチ型 ⌒）
    const upperY = padding + 4 * cellSize;
    const markWidth = gyobiWidth * 0.8;
    const markLeft = gyobiCenterX - markWidth / 2;
    const markRight = gyobiCenterX + markWidth / 2;
    const archHeight = cellSize * 0.15;
    
    ctx.beginPath();
    ctx.moveTo(markLeft, upperY + archHeight);
    ctx.quadraticCurveTo(gyobiCenterX, upperY - archHeight, markRight, upperY + archHeight);
    ctx.stroke();
    
    // 下部の魚尾マーク（横線 ー）
    const lowerY = padding + 15 * cellSize;
    
    ctx.beginPath();
    ctx.moveTo(markLeft, lowerY);
    ctx.lineTo(markRight, lowerY);
    ctx.stroke();
    
    ctx.lineCap = 'butt';

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
        // colIndex 0 は一番右の列
        // 右セクションの右端から、colIndex番目の列の位置を計算
        // 右セクションの並び: [col 9] gap [col 8] ... gap [col 0]
        const localIndex = (halfCols - 1) - colIndex; // 0 -> 9 (左端), 9 -> 0 (右端)
        // 右セクション開始位置 + (localIndex * (cell + gap)) + cell/2
        return rightSectionStart + localIndex * (cellSize + gapWidth) + cellSize / 2;
      } else {
        // 左側10列（魚尾の左から左端方向へ: 列9, 8, 7, ... 0）
        // colIndex 10 は魚尾のすぐ左
        const localIndex = (halfCols - 1) - (colIndex - halfCols); // 10 -> 9 (右端), 19 -> 0 (左端)
        return leftSectionStart + localIndex * (cellSize + gapWidth) + cellSize / 2;
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
