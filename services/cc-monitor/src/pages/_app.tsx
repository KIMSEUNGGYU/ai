import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
          background: #0d1117;
          color: #c9d1d9;
          line-height: 1.5;
        }
        a {
          color: #58a6ff;
          text-decoration: none;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
