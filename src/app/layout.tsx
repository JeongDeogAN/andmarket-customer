import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "앤드마켓 공동구매 주문내역 조회",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}