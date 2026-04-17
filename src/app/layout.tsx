import React from 'react';

export const metadata = {
  title: '앤드마켓 공동구매 주문내역 조회',
  description: '앤드마켓 공동구매 주문내역을 조회하세요. 닉네임 또는 숫자 4자리를 입력하여 조회합니다.',
  openGraph: {
    title: '앤드마켓 공동구매 주문내역 조회',
    description: '매주 수요일, 토요일은 주문 상품 매장 입고일',
    url: 'https://andmarket-customer.vercel.app',
    siteName: '앤드마켓 andMarket',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 400,
        alt: '앤드마켓 로고',
      }
    ],
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="400" />
        <meta property="og:title" content="앤드마켓 공동구매 주문내역 조회" />
        <meta property="og:description" content="매주 수요일, 토요일은 주문 상품 매장 입고일" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/images/logo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}