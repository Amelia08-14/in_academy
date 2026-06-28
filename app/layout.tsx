import type { Metadata } from "next";
import { Roboto_Slab, Inter } from "next/font/google";
import "./globals.css";

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="fr" className={`${robotoSlab.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
