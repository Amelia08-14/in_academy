import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";
import QuoteCartFab from "./components/QuoteCartFab";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-script-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "IN ACADEMY — L'excellence de la formation professionnelle",
  description:
    "Développez vos compétences et propulsez votre carrière avec nos programmes certifiants, conçus par des experts pour répondre aux exigences du marché.",
  icons: {
    icon: "/images/logo_in_academy.png",
    apple: "/images/logo_in_academy.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${inter.variable} ${plexMono.variable} ${caveat.variable}`}>
      <body>
        {children}
        <QuoteCartFab />
      </body>
    </html>
  );
}
