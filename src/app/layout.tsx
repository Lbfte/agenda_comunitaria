import type { Metadata, Viewport } from "next";
import "@/styles/index.css";
import { AuthProvider } from "@/app/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Agenda da Turma",
  description: "Organize tarefas, estude com flashcards e colabore com sua turma. Funciona offline.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Agenda",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#7A8F6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
