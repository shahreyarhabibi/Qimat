// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { initializeDatabase } from "@/lib/db/init";
import VisitTracker from "@/components/VisitTracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Qimat - Real-time Prices",
  description: "Track prices of goods, phones, currencies, and fuels.",
};

initializeDatabase();

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Simple script to set dark mode based on localStorage or system preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
