import "./globals.css";
import LanguageSwitch from "@/components/LanguageSwitch";
export const metadata = { title: "Lidea Girişim Programı | 3. Dönem", description: "Lidea Girişim Programı 3. Dönem MVP" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="tr"><body>{children}<LanguageSwitch /></body></html>;
}
