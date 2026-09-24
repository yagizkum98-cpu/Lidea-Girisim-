import "./globals.css";
import LanguageSwitch from "@/components/LanguageSwitch";
export const metadata = { title: "Lidea Girişim Programı | 3. Dönem", description: "Lidea Girişim Programı 3. Dönem MVP" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem("lidea-theme")==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}`,
          }}
        />
      </head>
      <body>{children}<LanguageSwitch /></body>
    </html>
  );
}
