import { ManuscriptEditor } from "@/components/manuscript-editor";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function ManuscriptPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ManuscriptEditor />
      </main>
      <Footer />
    </div>
  );
}
