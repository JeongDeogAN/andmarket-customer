import { NextRequest, NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_BASE_URL;

export async function POST(request: NextRequest) {
  if (!GAS_URL) {
    return NextResponse.json({ success: false, error: 'GAS_BASE_URL이 설정되지 않았습니다.' });
  }

  try {
    const { rowIdxList } = await request.json();

    if (!Array.isArray(rowIdxList) || rowIdxList.length === 0) {
      return NextResponse.json({ success: false, error: '처리할 항목이 없습니다.' });
    }

    const url = `${GAS_URL}?api=customer-pickup-done`;
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowIdxList }),
    });

    const text = await res.text();
    const match = text.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
    const data = match ? JSON.parse(match[1]) : JSON.parse(text);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: '처리 실패: ' + error.message });
  }
}
