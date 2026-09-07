import type { Metadata } from "next";
import Script from "next/script";
export const metadata: Metadata = {
  title: "Aarnav Scientific API",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3201288336354006"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <!-- Google tag (gtag.js) -->
       <script async src="https://www.googletagmanager.com/gtag/js?id=G-E94Q0RJFHG"></script>
       <script>
        window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-E94Q0RJFHG');
       </script>  
      </head>
      <body>{children}</body>
    </html>
  );
}
