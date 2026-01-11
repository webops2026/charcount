import { CharacterCounter } from "@/components/character-counter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FeatureLinks } from "@/components/feature-links";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        <CharacterCounter />
        <FeatureLinks />
      </main>
      <Footer />
    </div>
  );
}
