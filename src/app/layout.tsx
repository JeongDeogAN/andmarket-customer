import React from 'react';

export const metadata = {
  title: '내 주문내역 조회하기',
  description: '앤드마켓 공동구매 주문내역을 조회하세요. 닉네임 또는 숫자 4자리를 입력하여 조회합니다.',
  openGraph: {
    title: '내 주문내역 조회하기',
    description: '매주 수요일, 토요일은 주문 상품 매장 입고일',
    url: 'https://andmarket-customer.vercel.app',
    siteName: '앤드마켓 andMarket',
    images: [
      {
        url: 'https://andmarket-customer.vercel.app/images/og-banner.png',
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
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}