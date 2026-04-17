'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface OrderItem {
  resDate: string;
  customer: string;
  prodName: string;
  qty: number;
  price: number;
  total: number;
  status: string;
  pickupDate: string;
  isCanceled: boolean;
  cancelDate: string;
  inDate: string;
  inDateFull: string;
  canPickup: boolean;
}

type TabKey = 'active' | 'done' | 'cancel' | 'all';

function getStatusInfo(item: OrderItem) {
  if (item.isCanceled) return { text: '취소됨', color: '#e74c3c', bg: '#fff9f9' };
  if (item.status === 'O') return { text: '픽업완료', color: '#e67e22', bg: '' };
  return { text: '준비중', color: '#7f8c8d', bg: '' };
}

function getDayLabel(item: OrderItem) {
  if (!item.inDateFull || item.isCanceled || item.status === 'O') return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inDate = new Date(item.inDateFull);
  inDate.setHours(0, 0, 0, 0);
  const diff = Math.ceil((inDate.getTime() - today.getTime()) / 86400000);
  if (item.canPickup) return { label: '픽업가능', color: '#27ae60' };
  if (diff >= 0) return { label: '진행중', color: '#27ae60' };
  return { label: '입고지연', color: '#e74c3c' };
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString();
}

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [allData, setAllData] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);

  const counts = useMemo(() => ({
    active: allData.filter(function(d) { return !d.isCanceled && d.status !== 'O'; }).length,
    done: allData.filter(function(d) { return !d.isCanceled && d.status === 'O'; }).length,
    cancel: allData.filter(function(d) { return d.isCanceled; }).length,
    all: allData.length,
  }), [allData]);

  const filtered = useMemo(function() {
    if (activeTab === 'active') return allData.filter(function(d) { return !d.isCanceled && d.status !== 'O'; });
    if (activeTab === 'done') return allData.filter(function(d) { return !d.isCanceled && d.status === 'O'; });
    if (activeTab === 'cancel') return allData.filter(function(d) { return d.isCanceled; });
    return allData;
  }, [allData, activeTab]);

  const groups = useMemo(function() {
    const g: Record<string, OrderItem[]> = {};
    filtered.forEach(function(i) {
      if (!g[i.prodName]) g[i.prodName] = [];
      g[i.prodName].push(i);
    });
    return g;
  }, [filtered]);

  const pickupKeys = Object.keys(groups).filter(function(k) {
    return groups[k].some(function(d) { return d.canPickup && !d.isCanceled && d.status !== 'O'; });
  });
  const normalKeys = Object.keys(groups).filter(function(k) {
    return !pickupKeys.includes(k);
  });

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(function() { setToastShow(false); }, 2500);
  }

  async function doSearch() {
    if (!keyword.trim()) { showToast('닉네임 또는 숫자 4자리를 입력해 주세요.'); return; }
    setLoading(true);
    setSearched(true);
    setActiveTab('active');
    try {
      const res = await fetch('/api/customer-orders?keyword=' + encodeURIComponent(keyword.trim()));
      const json = await res.json();
      if (json.success && json.data) { setAllData(json.data); }
      else { showToast(json.error || '조회 실패'); setAllData([]); }
    } catch (e) { showToast('네트워크 오류'); setAllData([]); }
    finally { setLoading(false); }
  }

  const tabList: { key: TabKey; label: string; count: number }[] = [
    { key: 'active', label: '진행중', count: counts.active },
    { key: 'done', label: '픽업완료', count: counts.done },
    { key: 'cancel', label: '취소', count: counts.cancel },
    { key: 'all', label: '전체', count: counts.all },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
      {/* 토스트 */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: toastShow ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)',
        backgroundColor: 'rgba(30,30,30,0.92)', color: 'white',
        borderRadius: '16px', padding: '14px 24px', fontSize: '13px', fontWeight: 'bold',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
        opacity: toastShow ? 1 : 0, transition: 'all 0.2s', zIndex: 9999, pointerEvents: 'none'
      }}>{toastMsg}</div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '10px' }}>
        {/* 헤더 */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '14px 16px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: '8px' }}>
          <img src="/images/logo.png" alt="로고" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <h1 style={{ flex: 1, textAlign: 'center', fontSize: '17px', fontWeight: 900, color: '#2c3e50', margin: 0 }}>
            앤드마켓 <span style={{ color: '#e67e22' }}>공동구매</span> 주문내역 조회
          </h1>
        </header>

        {/* 안내 배너 */}
        <div style={{ background: 'linear-gradient(to right, #fff8f0, #fff3e0)', borderRadius: '12px', padding: '12px', marginBottom: '8px', border: '1px solid #ffe0b2' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, fontStyle: 'italic', fontFamily: '"Segoe Script", "Comic Sans MS", cursive', color: '#c0392b', textAlign: 'center', margin: 0, letterSpacing: '0.5px' }}>
            📢 매주 수요일, 토요일은 주문 상품 매장 입고일
          </p>
        </div>

        {/* 검색창 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', gap: '6px', alignItems: 'center', overflow: 'hidden' }}>
          <input
            type="text"
            value={keyword}
            onChange={function(e) { setKeyword(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') doSearch(); }}
            placeholder="닉네임 또는 숫자 4자리"
            style={{ flex: 1, minWidth: 0, border: '1.5px solid #dee2e6', borderRadius: '10px', padding: '9px 10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={doSearch}
            disabled={loading}
            style={{ flexShrink: 0, background: '#e67e22', color: 'white', border: 'none', borderRadius: '10px', width: '44px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1 }}>
            {loading ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : <Search style={{ width: 18, height: 18 }} />}
          </button>
        </div>

        {/* 탭 */}
        {searched && allData.length > 0 && (
          <div style={{ display: 'flex', background: 'white', borderRadius: '12px', padding: '5px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', gap: '3px' }}>
            {tabList.map(function(t) {
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={function() { setActiveTab(t.key); }}
                  style={{ flex: 1, border: 'none', borderRadius: '9px', padding: '7px 4px', fontSize: '12px', fontWeight: isActive ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer', color: isActive ? 'white' : '#999', backgroundColor: isActive ? '#e67e22' : 'transparent', whiteSpace: 'nowrap' }}>
                  {t.label}
                  <span style={{ display: 'inline-block', borderRadius: '8px', padding: '0 5px', fontSize: '10px', fontWeight: 900, marginLeft: '2px', backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }}>{t.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#e67e22', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#e67e22', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>조회 중...</div>
          </div>
        )}

        {/* 빈 결과 */}
        {!loading && searched && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '13px' }}>해당 내역이 없습니다.</div>
        )}

        {/* 결과 목록 */}
        {!loading && filtered.length > 0 && (
          <div>
            {/* 픽업가능 섹션 */}
            {pickupKeys.length > 0 && (
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#c0392b', padding: '6px 8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid #c0392b', paddingBottom: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#c0392b', flexShrink: 0 }}></span>
                  픽업 가능 상품 ({pickupKeys.length}종)
                </div>
                {pickupKeys.map(function(k) {
                  return <ProductGroup key={k} prodName={k} items={groups[k]} isPickup={true} defaultOpen={false} />;
                })}
              </div>
            )}
            {/* 일반 섹션 */}
            {normalKeys.length > 0 && (
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#c0392b', padding: '6px 8px', marginBottom: '8px', marginTop: pickupKeys.length > 0 ? '14px' : '0', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid #c0392b', paddingBottom: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#c0392b', flexShrink: 0 }}></span>
                  매장 입고 예정 상품 ({normalKeys.length}종)
                </div>
                {normalKeys.map(function(k) {
                  return <ProductGroup key={k} prodName={k} items={groups[k]} isPickup={false} defaultOpen={false} />;
                })}
              </div>
            )}
          </div>
        )}

        {/* 초기 화면 */}
        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <p style={{ color: '#aaa', fontSize: '13px' }}>닉네임 또는 숫자 4자리를 입력하여<br />주문내역을 조회하세요.</p>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 0', marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>© 앤드마켓 andMarket</p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* 상품 그룹 컴포넌트 */
function ProductGroup(props: { prodName: string; items: OrderItem[]; isPickup: boolean; defaultOpen: boolean }) {
  const [open, setOpen] = useState(props.defaultOpen);
  const totalQty = props.items.reduce(function(s, d) { return s + d.qty; }, 0);
  const totalAmt = props.items.reduce(function(s, d) { return s + d.total; }, 0);

  return (
    <div style={{ marginBottom: '6px' }}>
      <div
        onClick={function() { setOpen(!open); }}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: props.isPickup ? '#eafaf1' : 'white', borderRadius: '12px', padding: '9px 12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: props.isPickup ? '4px solid #27ae60' : '4px solid #e67e22', userSelect: 'none' }}
      >
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 900, color: props.isPickup ? '#1a5c38' : '#2c3e50' }}>{props.prodName}</span>
        <span style={{ fontSize: '11px', color: props.isPickup ? '#27ae60' : '#aaa', fontWeight: 700, whiteSpace: 'nowrap' }}>{props.items.length}건 · {totalQty}개 · {totalAmt.toLocaleString()}원</span>
        <span style={{ fontSize: '11px', color: '#e74c3c', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ display: open ? 'block' : 'none', background: props.isPickup ? '#f4fdf7' : 'transparent', borderRadius: '0 0 10px 10px', padding: open ? '4px 4px 2px' : '0' }}>
        {props.items.map(function(item, idx) {
          const si = getStatusInfo(item);
          const dl = getDayLabel(item);
          return (
            <div key={idx} style={{ background: si.bg || 'white', padding: '9px 11px 9px 14px', borderRadius: '10px', marginBottom: '4px', borderLeft: '4px solid ' + (item.isCanceled ? '#e74c3c' : item.status === 'O' ? '#e67e22' : '#dcdde1'), position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ position: 'absolute', top: '9px', right: '10px', textAlign: 'center' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, backgroundColor: si.color, color: 'white' }}>{si.text}</span>
                {item.isCanceled && <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 800, color: '#e74c3c' }}>🗓 {item.cancelDate}</div>}
                {!item.isCanceled && item.status === 'O' && <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 800, color: '#e67e22' }}>📦 {item.pickupDate}</div>}
              </div>
              <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '3px', fontWeight: 700 }}>
                신청일 <b style={{ color: '#2c3e50' }}>{item.resDate}</b>&nbsp;|&nbsp;입고일 <b style={{ color: '#2c3e50' }}>{item.inDate || '-'}</b>
                {dl && <span style={{ fontSize: '10px', fontWeight: 900, color: dl.color, backgroundColor: dl.color + '22', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>{dl.label}</span>}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#aaa', marginBottom: '3px', paddingRight: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.customer}</div>
              <div style={{ fontSize: '11px', color: '#7f8c8d', lineHeight: 1.6, fontWeight: 700 }}>
                수량: <b>{item.qty}개</b> &nbsp;|&nbsp;판매가: <b>{fmt(item.price)}원</b> &nbsp;|&nbsp;합계: <b style={{ color: '#e67e22' }}>{fmt(item.total)}원</b>
              </div>
              {item.isCanceled && <div style={{ marginTop: '4px', fontSize: '11px', color: '#e74c3c', fontWeight: 800 }}>❌ 취소된 주문입니다.</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}