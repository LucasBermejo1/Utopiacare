import { Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { ChatBot } from "./components/ChatBot";

export function RootLayout() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <ChatBot />
    </>
  );
}


