import { Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ChatBot } from "./components/ChatBot";
import { CookieBanner } from "./components/CookieBanner";

export function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatBot />
      <CookieBanner />
    </div>
  );
}


