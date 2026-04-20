import { NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_BASE_URL;

export async function GET() {
  if (!GAS_URL) {
    return NextResponse.json({ success: false, error: 'GAS_BASE_URL이 설정되지 않았습니다.' });
  }

  try {
    const url = `${GAS_URL}?api=today-inbound`;
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();

    const match = text.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
    const data = match ? JSON.parse(match[1]) : JSON.parse(text);

    return NextResponse.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: '조회 실패: ' + error.message });
  }
}
