"use client";

import { useState, useEffect } from "react";
import { CharacterCounter } from "@/components/character-counter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ManuscriptEditor } from "@/components/manuscript-editor";
import { useLocale } from "next-intl";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const locale = useLocale();
  const [text, setText] = useState("");

  // ローカルストレージから復元
  useEffect(() => {
    const saved = localStorage.getItem("charcount-text");
    if (saved) {
      setText(saved);
    }
  }, []);

  // テキスト変更時にローカルストレージに保存
  useEffect(() => {
    localStorage.setItem("charcount-text", text);
  }, [text]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* 文字数カウンター */}
        <CharacterCounter text={text} onTextChange={setText} />
        
        {/* 原稿用紙エディタ（日本語のみ表示） */}
        {locale === "ja" && (
          <>
            <Separator className="my-8" />
            <ManuscriptEditor text={text} onTextChange={setText} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
