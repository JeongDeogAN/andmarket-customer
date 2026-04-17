import { NextRequest, NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_BASE_URL;

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword') || '';

  if (!keyword) {
    return NextResponse.json({ success: false, error: '검색어를 입력해주세요.' });
  }

  if (!GAS_URL) {
    return NextResponse.json({ success: false, error: 'GAS_BASE_URL이 설정되지 않았습니다.' });
  }

  try {
    const url = `${GAS_URL}?api=customer-orders&keyword=${encodeURIComponent(keyword)}`;
    
    const res = await fetch(url, {
      redirect: 'follow',
    });

    const text = await res.text();
    
    // GAS는 HTML 안에 <textarea>로 JSON을 감싸서 반환함
    const match = text.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
    let data;
    if (match) {
      data = JSON.parse(match[1]);
    } else {
      data = JSON.parse(text);
    }

    // 배열이면 success 객체로 감싸서 반환
    if (Array.isArray(data)) {
      return NextResponse.json({ success: true, data: data });
    }

    // 이미 객체 형태면 그대로 반환
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: '조회 실패: ' + error.message 
    });
  }
}