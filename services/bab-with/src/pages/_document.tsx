import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="application-name" content="냠냠딸깍" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="냠냠딸깍" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
