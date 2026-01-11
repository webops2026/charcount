// 文字種別のパターン
const patterns = {
  hiragana: /[\u3040-\u309F]/g,
  katakana: /[\u30A0-\u30FF]/g,
  kanji: /[\u4E00-\u9FAF]/g,
  alphabet: /[a-zA-Z]/g,
  numbers: /[0-9０-９]/g,
  symbols: /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~！"＃＄％＆'（）＊＋，－．／：；＜＝＞？＠「」『』【】｛｝]/g,
  spaces: /[\s\u3000]/g,
};

export interface TextStats {
  // 基本指標
  characters: number;
  charactersNoSpace: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  
  // バイト数
  bytes: number;
  bytesUTF8: number;
  
  // 平均値
  averageWordLength: number;
  averageSentenceLength: number;
  
  // 時間推定
  readingTimeSeconds: number;
  speakingTimeSeconds: number;
  typingTimeSeconds: number;
  
  // 文字種別（日本語向け）
  hiragana: number;
  katakana: number;
  kanji: number;
  alphabet: number;
  numbers: number;
  symbols: number;
  spaces: number;
  
  // 品質スコア（0-100）
  readabilityScore: number;
  complexityScore: number;
  diversityScore: number;
  
  // キーワード頻度
  topKeywords: Array<{ word: string; count: number; percentage: number }>;
}

export interface SNSCheck {
  platform: string;
  limit: number;
  current: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'over';
}

// SNS文字数制限
export const snsLimits = {
  twitter: { name: 'Twitter / X', limit: 280 },
  instagram: { name: 'Instagram', limit: 2200 },
  facebook: { name: 'Facebook', limit: 63206 },
  linkedin: { name: 'LinkedIn', limit: 3000 },
  tiktok: { name: 'TikTok', limit: 2200 },
  youtube: { name: 'YouTube Title', limit: 100 },
  threads: { name: 'Threads', limit: 500 },
  bluesky: { name: 'Bluesky', limit: 300 },
};

export function analyzeText(text: string): TextStats {
  if (!text) {
    return getEmptyStats();
  }
  
  // 基本指標
  const characters = text.length;
  const charactersNoSpace = text.replace(/\s/g, '').length;
  
  // 単語数（英語は空白区切り、日本語は文字数ベース）
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
  const words = englishWords.length + Math.ceil(japaneseChars.length / 2);
  
  // 文数（句点、ピリオド、感嘆符、疑問符で区切る）
  const sentenceEnders = text.match(/[。．.!?！？]/g) || [];
  const sentences = Math.max(sentenceEnders.length, text.trim() ? 1 : 0);
  
  // 段落数
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length || (text.trim() ? 1 : 0);
  
  // 行数
  const lines = text.split('\n').length;
  
  // バイト数
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text).length;
  const bytesUTF8 = bytes;
  
  // 平均値
  const averageWordLength = words > 0 ? charactersNoSpace / words : 0;
  const averageSentenceLength = sentences > 0 ? words / sentences : 0;
  
  // 時間推定（日本語: 400字/分、英語: 200語/分）
  const isMainlyJapanese = japaneseChars.length > englishWords.length * 3;
  const readingTimeSeconds = isMainlyJapanese 
    ? (charactersNoSpace / 400) * 60 
    : (words / 200) * 60;
  const speakingTimeSeconds = isMainlyJapanese 
    ? (charactersNoSpace / 300) * 60 
    : (words / 150) * 60;
  const typingTimeSeconds = isMainlyJapanese 
    ? (charactersNoSpace / 100) * 60 
    : (words / 40) * 60;
  
  // 文字種別
  const hiragana = (text.match(patterns.hiragana) || []).length;
  const katakana = (text.match(patterns.katakana) || []).length;
  const kanji = (text.match(patterns.kanji) || []).length;
  const alphabet = (text.match(patterns.alphabet) || []).length;
  const numbers = (text.match(patterns.numbers) || []).length;
  const symbols = (text.match(patterns.symbols) || []).length;
  const spaces = (text.match(patterns.spaces) || []).length;
  
  // 品質スコア
  const readabilityScore = calculateReadabilityScore(text, sentences, words);
  const complexityScore = calculateComplexityScore(text, kanji, hiragana + katakana);
  const diversityScore = calculateDiversityScore(text);
  
  // キーワード頻度
  const topKeywords = getTopKeywords(text);
  
  return {
    characters,
    charactersNoSpace,
    words,
    sentences,
    paragraphs,
    lines,
    bytes,
    bytesUTF8,
    averageWordLength,
    averageSentenceLength,
    readingTimeSeconds,
    speakingTimeSeconds,
    typingTimeSeconds,
    hiragana,
    katakana,
    kanji,
    alphabet,
    numbers,
    symbols,
    spaces,
    readabilityScore,
    complexityScore,
    diversityScore,
    topKeywords,
  };
}

function getEmptyStats(): TextStats {
  return {
    characters: 0,
    charactersNoSpace: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    bytes: 0,
    bytesUTF8: 0,
    averageWordLength: 0,
    averageSentenceLength: 0,
    readingTimeSeconds: 0,
    speakingTimeSeconds: 0,
    typingTimeSeconds: 0,
    hiragana: 0,
    katakana: 0,
    kanji: 0,
    alphabet: 0,
    numbers: 0,
    symbols: 0,
    spaces: 0,
    readabilityScore: 0,
    complexityScore: 0,
    diversityScore: 0,
    topKeywords: [],
  };
}

function calculateReadabilityScore(text: string, sentences: number, words: number): number {
  if (sentences === 0 || words === 0) return 0;
  
  // 平均文長が適切か（15-25単語が理想）
  const avgSentenceLength = words / sentences;
  let score = 100;
  
  if (avgSentenceLength < 10) score -= 20;
  else if (avgSentenceLength > 30) score -= 30;
  else if (avgSentenceLength > 25) score -= 15;
  
  // 段落の長さが適切か
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  const avgParagraphLength = words / Math.max(paragraphs.length, 1);
  if (avgParagraphLength > 100) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

function calculateComplexityScore(text: string, kanji: number, kana: number): number {
  if (text.length === 0) return 0;
  
  // 漢字比率が高いほど複雑度が高い
  const totalJapanese = kanji + kana;
  if (totalJapanese === 0) {
    // 英語テキストの場合
    const longWords = (text.match(/\b\w{8,}\b/g) || []).length;
    const totalWords = (text.match(/\b\w+\b/g) || []).length;
    return totalWords > 0 ? Math.min(100, (longWords / totalWords) * 200) : 0;
  }
  
  const kanjiRatio = kanji / totalJapanese;
  return Math.min(100, kanjiRatio * 150);
}

function calculateDiversityScore(text: string): number {
  if (text.length === 0) return 0;
  
  // ユニークな単語/文字の割合
  const words = text.toLowerCase().match(/[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g) || [];
  if (words.length === 0) return 0;
  
  const uniqueWords = new Set(words);
  const diversityRatio = uniqueWords.size / words.length;
  
  return Math.min(100, diversityRatio * 120);
}

function getTopKeywords(text: string): Array<{ word: string; count: number; percentage: number }> {
  // 日本語と英語の単語を抽出
  const words = text.match(/[\u4E00-\u9FAF\u3040-\u309F\u30A0-\u30FF]{2,}|[a-zA-Z]{3,}/g) || [];
  
  // 頻度をカウント
  const wordCount = new Map<string, number>();
  for (const word of words) {
    const normalized = word.toLowerCase();
    wordCount.set(normalized, (wordCount.get(normalized) || 0) + 1);
  }
  
  // ソートしてトップ5を取得
  const sorted = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const totalWords = words.length;
  return sorted.map(([word, count]) => ({
    word,
    count,
    percentage: totalWords > 0 ? Math.round((count / totalWords) * 1000) / 10 : 0,
  }));
}

export function checkSNS(text: string): SNSCheck[] {
  const current = text.length;
  
  return Object.entries(snsLimits).map(([, config]) => {
    const remaining = config.limit - current;
    const percentage = (current / config.limit) * 100;
    
    let status: 'ok' | 'warning' | 'over' = 'ok';
    if (remaining < 0) status = 'over';
    else if (percentage > 80) status = 'warning';
    
    return {
      platform: config.name,
      limit: config.limit,
      current,
      remaining,
      percentage,
      status,
    };
  });
}

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
  }
}

export function formatTimeEn(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${minutes} min ${secs} sec` : `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }
}
