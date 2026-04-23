'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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

interface InboundItem {
  name: string;
  inDate: string;
}

type TabKey = 'active' | 'done' | 'cancel' | 'pickup-time';

function getStatusInfo(item: OrderItem) {
  if (item.isCanceled) return { text: '취소됨', color: '#e74c3c', bg: '#fff9f9' };
  if (item.status === 'O') return { text: '픽업완료', color: '#fa7703', bg: '' };
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
  const [inboundItems, setInboundItems] = useState<InboundItem[]>([]);
  const [inboundLoaded, setInboundLoaded] = useState(false);

  useEffect(function () {
    fetch('/api/today-inbound')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setInboundItems(json.data);
        }
      })
      .finally(() => setInboundLoaded(true));
  }, []);

  const counts = useMemo(() => ({
    active: allData.filter(d => !d.isCanceled && d.status !== 'O').length,
    done: allData.filter(d => !d.isCanceled && d.status === 'O').length,
    cancel: allData.filter(d => d.isCanceled).length,
  }), [allData]);

  const filtered = useMemo(function () {
    if (activeTab === 'active' || activeTab === 'pickup-time') return allData.filter(d => !d.isCanceled && d.status !== 'O');
    if (activeTab === 'done') return allData.filter(d => !d.isCanceled && d.status === 'O');
    if (activeTab === 'cancel') return allData.filter(d => d.isCanceled);
    return allData;
  }, [allData, activeTab]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(function () { setToastShow(false); }, 2500);
  }

  async function doSearch() {
    if (!keyword.trim()) { showToast('⚠️ 닉네임 또는 숫자 4자리를 입력해 주세요.'); return; }
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

      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '16px' }}>

        {/* 최상단 배너 */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <img src="/images/Top-banner.png" alt="앤드마켓 배너" style={{ display: 'block', width: '100%', height: 'auto' }} />
        </div>

        {/* 검색창 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '10px 12px', marginBottom: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <input
            type="text"
            value={keyword}
            placeholder="주문조회, 닉네임 또는 숫자4자리"
            onChange={function (e) { setKeyword(e.target.value); }}
            onKeyDown={function (e) { if (e.key === 'Enter') doSearch(); }}
            onFocus={function (e) { e.target.style.borderColor = '#e67e22'; }}
            onBlur={function (e) { e.target.style.borderColor = '#dee2e6'; }}
            style={{ flex: 1, border: '1.5px solid #dee2e6', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', minWidth: 0, color: '#2c3e50', transition: 'border-color 0.2s' }}
          />
          <button
            onClick={doSearch}
            disabled={loading}
            style={{ flexShrink: 0, background: '#e67e22', color: 'white', border: 'none', borderRadius: '10px', padding: '0 18px', fontSize: '14px', fontWeight: 800, fontFamily: 'inherit', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1 }}>
            {loading ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : '조회'}
          </button>
        </div>

        {/* 입고 상품 카드 (조회 전) */}
        {!searched && inboundLoaded && (
          <InboundCard items={inboundItems} />
        )}

        {/* 탭 */}
        {searched && allData.length > 0 && (
          <div style={{ display: 'flex', background: 'white', borderRadius: '12px', padding: '5px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', gap: '3px' }}>
            {([
              { key: 'active' as TabKey, label: '전체상품', count: counts.active, showBadge: true },
              { key: 'done' as TabKey, label: '픽업완료', count: counts.done, showBadge: true },
              { key: 'cancel' as TabKey, label: '취소', count: counts.cancel, showBadge: true },
              { key: 'pickup-time' as TabKey, label: '픽업안내', count: 0, showBadge: false },
            ]).map(function (t) {
              const isActive = activeTab === t.key;
              return (
                <button key={t.key} onClick={function () { setActiveTab(t.key); }}
                  style={{ flex: 1, border: 'none', borderRadius: '9px', padding: '8px 4px', fontSize: '14px', fontWeight: isActive ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer', color: isActive ? 'white' : '#999', backgroundColor: isActive ? '#fa7703' : 'transparent', whiteSpace: 'nowrap' }}>
                  {t.label}
                  {t.showBadge && (
                    <span style={{ display: 'inline-block', borderRadius: '8px', padding: '0 5px', fontSize: '10px', fontWeight: 900, marginLeft: '2px', backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }}>{t.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#fa7703', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#fa7703', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>조회 중...</div>
          </div>
        )}

        {/* 픽업시간 탭 */}
        {!loading && searched && activeTab === 'pickup-time' && (
          <PickupTimeView items={filtered} />
        )}

        {/* 빈 결과 */}
        {!loading && searched && activeTab !== 'pickup-time' && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '13px' }}>해당 내역이 없습니다.</div>
        )}

        {/* 결과 목록 */}
        {!loading && searched && activeTab !== 'pickup-time' && filtered.length > 0 && (
          <ResultList filtered={filtered} activeTab={activeTab} />
        )}

        {/* 조회 후 입고 상품 카드 */}
        {searched && inboundLoaded && inboundItems.length > 0 && (
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <InboundCard items={inboundItems} />
          </div>
        )}

        {/* 초기 화면 */}
        {!searched && !loading && !inboundLoaded && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <p style={{ color: '#aaa', fontSize: '13px' }}>닉네임 또는 숫자 4자리를 입력하여<br />주문내역을 조회하세요.</p>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 0', marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>© 앤드마켓 andMarket</p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #bbb; font-size: 13px; }
      `}</style>
    </div>
  );
}

/* 입고 상품 카드 컴포넌트 */
function InboundCard({ items }: { items: InboundItem[] }) {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', background: '#fff4e6', border: '1.5px solid #fa7703', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
      <div style={{ background: '#d96800', padding: '7px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>입고 상품 알림</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>입고일</span>
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px 14px', fontSize: '12px', color: '#c07020', fontWeight: 700 }}>최근 1주일 입고 상품이 없습니다.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {items.map(function (p, i) {
              const inDateDisp = p.inDate
                ? p.inDate.substring(5).replace('-', '/').replace(/^0/, '')
                : '';
              return (
                <tr key={i}>
                  <td style={{ width: '28px', padding: '6px 4px 6px 14px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#fdd9aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#7a3800' }}>{i + 1}</div>
                  </td>
                  <td style={{ fontSize: '12px', fontWeight: 700, color: '#7a3800', padding: '6px 4px 6px 4px', borderBottom: i < items.length - 1 ? '1px solid #fdd9aa' : 'none', lineHeight: 1.35 }}>{p.name}</td>
                  <td style={{ textAlign: 'right', color: '#d96800', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', padding: '6px 14px 6px 4px', borderBottom: i < items.length - 1 ? '1px solid #fdd9aa' : 'none' }}>{inDateDisp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* 픽업안내 탭 컴포넌트 */
function PickupTimeView({ items: _ }: { items: OrderItem[] }) {
  const pickupInfo = [
    { label: '동탄여울점', time: '08:30 ~ 19:30', icon: '🕑' },
    { label: '영통망포점', time: '08:30 ~ 18:30', icon: '🕐' },
    { label: '경기광주점', time: '08:30 ~ 18:30', icon: '🕐' },
  ];
  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '16px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '8px' }}>
      <div style={{ fontSize: '14px', fontWeight: 900, color: '#444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fa7703', display: 'inline-block', flexShrink: 0 }}></span>
        매장별 픽업 가능 시간
      </div>
      {pickupInfo.map(function (s, i) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '20px' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#2c3e50' }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: '#2c3e50', marginTop: '2px' }}>{s.time}</div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: '12px', fontSize: '11px', color: '#2c3e50', lineHeight: 1.6 }}>
        ※ 픽업 마감 후 상품은 다음 픽업일까지 보관됩니다.<br />
        ※ 입고일로부터 3일 이내 픽업 부탁드립니다.
      </div>
    </div>
  );
}

/* 결과 목록 컴포넌트 */
function ResultList({ filtered, activeTab }: { filtered: OrderItem[]; activeTab: string }) {
  const sections = buildSections(filtered, activeTab);
  const groups: { sec: ReturnType<typeof buildSections>[0]; keys: string[]; groupMap: Record<string, OrderItem[]> }[] = [];

  sections.forEach(sec => {
    if (sec.items.length === 0) return;
    const groupMap: Record<string, OrderItem[]> = {};
    sec.items.forEach(item => {
      if (!groupMap[item.prodName]) groupMap[item.prodName] = [];
      groupMap[item.prodName].push(item);
    });
    const keys = Object.keys(groupMap)
      .sort((a, b) => (groupMap[b][0].resDate || '').localeCompare(groupMap[a][0].resDate || ''));
    groups.push({ sec, keys, groupMap });
  });

  return (
    <div>
      {groups.map(function ({ sec, keys, groupMap }, si) {
        return (
          <div key={si}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: sec.titleColor, padding: '4px 6px', marginBottom: '6px', marginTop: si > 0 ? '10px' : '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: sec.dotColor, flexShrink: 0, display: 'inline-block' }}></span>
              {sec.title} ({keys.length}종)
            </div>
            {keys.map(function (prodName) {
              return (
                <ProductGroup key={prodName} prodName={prodName} items={groupMap[prodName]} isPickup={sec.isPickup || false} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function buildSections(filtered: OrderItem[], activeTab: string) {
  if (activeTab === 'done') {
    return [{ title: '픽업 완료 상품', dotColor: '#e67e22', titleColor: '#444', isPickup: false, items: filtered }];
  }
  if (activeTab === 'cancel') {
    return [{ title: '취소 상품', dotColor: '#e74c3c', titleColor: '#444', isPickup: false, items: filtered }];
  }
  const pickupItems = filtered.filter(d => d.canPickup && !d.isCanceled && d.status !== 'O');
  const normalItems = filtered.filter(d => !d.canPickup && !d.isCanceled && d.status !== 'O');
  const doneItems   = filtered.filter(d => !d.isCanceled && d.status === 'O');
  const cancelItems = filtered.filter(d => d.isCanceled);
  return [
    { title: '픽업 가능 상품',   dotColor: '#27ae60', titleColor: '#1a5c38', isPickup: true,  items: pickupItems },
    { title: '픽업 준비중 상품', dotColor: '#fa7703', titleColor: '#d96800', isPickup: false, items: normalItems },
    { title: '픽업 완료 상품',   dotColor: '#fa7703', titleColor: '#444',    isPickup: false, items: doneItems   },
    { title: '취소 상품',        dotColor: '#e74c3c', titleColor: '#444',    isPickup: false, items: cancelItems },
  ];
}

/* 상품 그룹 컴포넌트 */
function ProductGroup({ prodName, items, isPickup }: { prodName: string; items: OrderItem[]; isPickup: boolean }) {
  const [open, setOpen] = useState(false);
  const totalQty = items.reduce(function (s, d) { return s + d.qty; }, 0);
  const totalAmt = items.reduce(function (s, d) { return s + d.total; }, 0);

  return (
    <div style={{ marginBottom: '6px' }}>
      <div
        onClick={function () { setOpen(!open); }}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isPickup ? '#eafaf1' : 'white', borderRadius: '12px', padding: '9px 12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: isPickup ? '4px solid #27ae60' : '4px solid #fa7703', userSelect: 'none' }}
      >
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 900, color: isPickup ? '#1a5c38' : '#2c3e50' }}>{prodName}</span>
        <span style={{ fontSize: '11px', color: isPickup ? '#27ae60' : '#aaa', fontWeight: 700, whiteSpace: 'nowrap' }}>{items.length}건 · {totalQty}개 · {totalAmt.toLocaleString()}원</span>
        <span style={{ fontSize: '11px', color: isPickup ? '#27ae60' : '#e74c3c', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ display: open ? 'block' : 'none', background: isPickup ? '#f4fdf7' : 'transparent', borderRadius: '0 0 10px 10px', padding: open ? '4px 4px 2px' : '0' }}>
        {items.map(function (item, idx) {
          const si = getStatusInfo(item);
          const dl = getDayLabel(item);
          const badgeBg = si.color === '#7f8c8d' ? '#f1f2f6' : si.color;
          const badgeFg = si.color === '#7f8c8d' ? '#636e72' : 'white';
          return (
            <div key={idx} style={{ background: si.bg || 'white', padding: '9px 11px 9px 14px', borderRadius: '10px', marginBottom: '4px', borderLeft: '4px solid ' + (item.isCanceled ? '#e74c3c' : item.status === 'O' ? '#fa7703' : '#dcdde1'), position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ position: 'absolute', top: '9px', right: '10px', textAlign: 'center' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, backgroundColor: badgeBg, color: badgeFg }}>{si.text}</span>
                {item.isCanceled && <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 800, color: '#e74c3c' }}>🗓 {item.cancelDate}</div>}
                {!item.isCanceled && item.status === 'O' && <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 800, color: '#fa7703' }}>📦 {item.pickupDate}</div>}
              </div>
              <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '3px', fontWeight: 400 }}>
                신청일 <b style={{ color: '#2c3e50' }}>{item.resDate}</b>&nbsp;|&nbsp;입고일 <b style={{ color: '#2c3e50' }}>{item.inDate || '-'}</b>
                {dl && <span style={{ fontSize: '10px', fontWeight: 900, color: dl.color, backgroundColor: dl.color + '22', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>{dl.label}</span>}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#aaa', marginBottom: '3px', paddingRight: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.customer}</div>
              <div style={{ fontSize: '11px', color: '#7f8c8d', lineHeight: 1.6, fontWeight: 400 }}>
                수량: <b>{item.qty}개</b>&nbsp;|&nbsp;판매가: <b>{fmt(item.price)}원</b>&nbsp;|&nbsp;합계: <b style={{ color: '#fa7703' }}>{fmt(item.total)}원</b>
              </div>
              {item.isCanceled && <div style={{ marginTop: '4px', fontSize: '11px', color: '#e74c3c', fontWeight: 800 }}>❌ 취소된 주문입니다.</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
