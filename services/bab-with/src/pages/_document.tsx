import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="application-name" content="bab-with" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="apple-mobile-web-app-title" content="bab-with" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
