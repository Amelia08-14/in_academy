import type { Metadata } from "next";
import Script from "next/script";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono, Caveat, Cairo } from "next/font/google";
import "./globals.css";
import QuoteCartFab from "./components/QuoteCartFab";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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

// Police arabe (descriptions de formation en arabe, affichées en RTL).
const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
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
    <html lang="fr" className={`${bricolage.variable} ${inter.variable} ${plexMono.variable} ${caveat.variable} ${cairo.variable}`}>
      <body>
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        {children}
        <QuoteCartFab />
      </body>
    </html>
  );
}
