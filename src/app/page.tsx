'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface OrderItem {
  rowIdx: number;
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

type TabKey = 'ready' | 'pickup' | 'done';

function fmt(n: number) {
  return Number(n || 0).toLocaleString();
}

// ── 인디케이트 체크박스 (indeterminate 지원) ─────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, style }: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <input type="checkbox" ref={ref} checked={checked}
      onChange={e => onChange(e.target.checked)} style={style} />
  );
}

// ── 헤더 배너 ─────────────────────────────────────────────────
function HeaderBanner() {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <img src="/images/Top-banner.png" alt="앤드마켓 배너" style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
  );
}

// ── 스텝바 ────────────────────────────────────────────────────
function StepBar({ activeTab, counts, onSwitch }: {
  activeTab: TabKey;
  counts: Record<TabKey, number>;
  onSwitch: (t: TabKey) => void;
}) {
  const steps: { key: TabKey; label: string }[] = [
    { key: 'ready',  label: '입고대기' },
    { key: 'pickup', label: '픽업대기' },
    { key: 'done',   label: '픽업완료' },
  ];
  const order: TabKey[] = ['ready', 'pickup', 'done'];
  const curIdx = order.indexOf(activeTab);

  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '14px', padding: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '10px' }}>
      {steps.map((step, si) => {
        const isActive = step.key === activeTab;
        const arrowActive = si < curIdx || si === curIdx;
        return (
          <React.Fragment key={step.key}>
            <div onClick={() => onSwitch(step.key)}
              style={{ flex: 1, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}>
              <div style={{
                width: '100%', height: '38px', borderRadius: '10px',
                background: isActive ? '#fa7703' : '#e8e8e8',
                border: isActive ? '2px solid #d96800' : '2px solid #ccc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900,
                color: isActive ? '#fff' : '#777',
                boxShadow: isActive ? '0 3px 8px rgba(250,119,3,0.4)' : '0 2px 4px rgba(0,0,0,0.08)',
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap', letterSpacing: '-0.3px',
              }}>
                {step.label}({counts[step.key]})
              </div>
            </div>
            {si < 2 && (
              <div style={{
                flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '38px', fontSize: '20px', fontWeight: 900, lineHeight: 1,
                color: arrowActive ? '#fa7703' : '#ddd', transition: 'color 0.3s',
                animation: arrowActive ? 'arr-pulse 1.4s ease-in-out infinite' : 'none',
              }}>
                <span style={{ letterSpacing: '-4px' }}>››</span>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function Home() {
  const [keyword, setKeyword]       = useState('');
  const [allData, setAllData]       = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab]   = useState<TabKey>('pickup');
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [toastMsg, setToastMsg]     = useState('');
  const [toastShow, setToastShow]   = useState(false);
  const [inboundItems, setInboundItems] = useState<InboundItem[]>([]);
  const [inboundLoaded, setInboundLoaded] = useState(false);
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/today-inbound')
      .then(r => r.json())
      .then(json => { if (json.success && json.data) setInboundItems(json.data); })
      .finally(() => setInboundLoaded(true));
  }, []);

  const readyItems  = useMemo(() => allData.filter(d => !d.isCanceled && d.status !== 'O' && !d.canPickup), [allData]);
  const pickupItems = useMemo(() => allData.filter(d => !d.isCanceled && d.status !== 'O' &&  d.canPickup), [allData]);
  const doneItems   = useMemo(() => allData.filter(d => !d.isCanceled && d.status === 'O'), [allData]);
  const counts      = useMemo(() => ({ ready: readyItems.length, pickup: pickupItems.length, done: doneItems.length }), [readyItems, pickupItems, doneItems]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 2500);
  }

  async function doSearch() {
    if (!keyword.trim()) { showToast('⚠️ 닉네임 또는 숫자 4자리를 입력해 주세요.'); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res  = await fetch('/api/customer-orders?keyword=' + encodeURIComponent(keyword.trim()));
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data as OrderItem[];
        setAllData(data);
        const hasPickup = data.some(d => !d.isCanceled && d.status !== 'O' && d.canPickup);
        setActiveTab(hasPickup ? 'pickup' : 'ready');
        setCheckedRows(new Set(data.filter(d => !d.isCanceled && d.status !== 'O' && d.canPickup).map(d => d.rowIdx)));
      } else {
        showToast(json.error || '조회 실패');
        setAllData([]);
      }
    } catch { showToast('네트워크 오류'); setAllData([]); }
    finally { setLoading(false); }
  }

  async function submitPickupDone() {
    const rowIdxList = Array.from(checkedRows);
    if (rowIdxList.length === 0) { showToast('선택된 항목이 없습니다.'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch('/api/customer-pickup-done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIdxList }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('✅ ' + rowIdxList.length + '건 픽업완료 처리되었습니다.');
        const today    = new Date();
        const todayStr = (today.getMonth() + 1) + '-' + String(today.getDate()).padStart(2, '0');
        const remainPickup = allData.filter(d => !d.isCanceled && d.status !== 'O' && d.canPickup && !rowIdxList.includes(d.rowIdx)).length;
        setAllData(prev => prev.map(item =>
          rowIdxList.includes(item.rowIdx)
            ? { ...item, status: 'O', canPickup: false, pickupDate: todayStr }
            : item
        ));
        setCheckedRows(new Set());
        setActiveTab(remainPickup === 0 ? 'done' : 'pickup');
      } else {
        showToast('❌ 저장 중 오류가 발생했습니다.');
      }
    } catch { showToast('❌ 저장 중 오류가 발생했습니다.'); }
    finally { setSubmitting(false); }
  }

  const currentItems = activeTab === 'ready' ? readyItems : activeTab === 'pickup' ? pickupItems : doneItems;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
      {/* 토스트 */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: toastShow ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.9)',
        backgroundColor: 'rgba(30,30,30,0.92)', color: 'white',
        borderRadius: '16px', padding: '14px 24px', fontSize: '13px', fontWeight: 'bold',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
        opacity: toastShow ? 1 : 0, transition: 'all 0.2s', zIndex: 9999, pointerEvents: 'none',
      }}>{toastMsg}</div>

      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '16px' }}>
        <HeaderBanner />

        {/* 검색창 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '10px 12px', marginBottom: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <input
            type="text"
            value={keyword}
            placeholder="주문조회, 닉네임 또는 숫자4자리"
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#fa7703'; }}
            onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = '#dee2e6'; }}
            style={{ flex: 1, border: '1.5px solid #dee2e6', borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', minWidth: 0, color: '#2c3e50', transition: 'border-color 0.2s' }}
          />
          <button onClick={doSearch} disabled={loading}
            style={{ flexShrink: 0, background: '#fa7703', color: 'white', border: 'none', borderRadius: '10px', padding: '0 18px', fontSize: '14px', fontWeight: 800, fontFamily: 'inherit', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1 }}>
            {loading ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : '조회'}
          </button>
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#fa7703', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#fa7703', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>조회 중...</div>
          </div>
        )}

        {/* 스텝바 + 결과 */}
        {!loading && searched && (
          <>
            <StepBar activeTab={activeTab} counts={counts} onSwitch={setActiveTab} />
            {activeTab === 'pickup' ? (
              <PickupTabView
                items={pickupItems}
                checkedRows={checkedRows}
                setCheckedRows={setCheckedRows}
                submitting={submitting}
                onSubmit={submitPickupDone}
              />
            ) : (
              <NormalTabView items={currentItems} activeTab={activeTab} />
            )}
          </>
        )}

        {/* 초기 화면 (조회 전) */}
        {!searched && inboundLoaded && (
          <InboundCard items={inboundItems} />
        )}
        {!searched && !inboundLoaded && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <p style={{ color: '#aaa', fontSize: '13px' }}>닉네임 또는 숫자 4자리를 입력하여<br />주문내역을 조회하세요.</p>
          </div>
        )}

        {/* 조회 후 입고 카드 */}
        {searched && !loading && inboundItems.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <InboundCard items={inboundItems} />
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '24px 0', marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>© 앤드마켓 andMarket</p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes arr-pulse { 0% { opacity: 0.25; } 50% { opacity: 1; } 100% { opacity: 0.25; } }
        input::placeholder { color: #bbb; font-size: 13px; }
        .step-item:active .step-circle { transform: scale(0.93) !important; }
      `}</style>
    </div>
  );
}

// ── 픽업대기 탭 ───────────────────────────────────────────────
function PickupTabView({ items, checkedRows, setCheckedRows, submitting, onSubmit }: {
  items: OrderItem[];
  checkedRows: Set<number>;
  setCheckedRows: (s: Set<number>) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  if (items.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '13px' }}>픽업대기 상품이 없습니다.</div>;
  }

  const checkedCount  = checkedRows.size;
  const allChecked    = checkedCount === items.length;
  const indeterminate = checkedCount > 0 && checkedCount < items.length;

  function toggleAll(checked: boolean) {
    setCheckedRows(checked ? new Set(items.map(d => d.rowIdx)) : new Set());
  }

  function toggleRow(rowIdx: number, checked: boolean) {
    const next = new Set(checkedRows);
    if (checked) next.add(rowIdx); else next.delete(rowIdx);
    setCheckedRows(next);
  }

  const groups: Record<string, OrderItem[]> = {};
  items.forEach(item => {
    if (!groups[item.prodName]) groups[item.prodName] = [];
    groups[item.prodName].push(item);
  });
  const keys = Object.keys(groups).sort((a, b) => (groups[b][0].resDate || '').localeCompare(groups[a][0].resDate || ''));

  return (
    <div>
      {/* 픽업 안내 이미지 */}
      <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
        <img
          src="/images/Center-banner.png"
          alt="픽업 안내"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>

      {/* 액션 바 */}
      <div style={{ background: '#eafaf1', border: '1.5px solid #a9dfbf', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IndeterminateCheckbox
            checked={allChecked}
            indeterminate={indeterminate}
            onChange={toggleAll}
            style={{ width: '18px', height: '18px', accentColor: '#27ae60', cursor: 'pointer', flexShrink: 0, margin: 0 }}
          />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#1a5c38' }}>
            전체선택 (<span>{checkedCount}</span>건)
          </span>
        </div>
        <PickupDoneButton count={checkedCount} submitting={submitting} onSubmit={onSubmit} />
      </div>

      {/* 섹션 타이틀 */}
      <div style={{ fontSize: '15px', fontWeight: 900, color: '#444', padding: '4px 6px', marginBottom: '6px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#27ae60', display: 'inline-block', flexShrink: 0 }} />
        픽업대기 상품 ({keys.length}종)
      </div>

      {/* 상품 그룹 */}
      {keys.map(prodName => (
        <PickupProductGroup key={prodName} prodName={prodName} items={groups[prodName]} checkedRows={checkedRows} onToggle={toggleRow} />
      ))}
    </div>
  );
}

function PickupDoneButton({ count, submitting, onSubmit }: { count: number; submitting: boolean; onSubmit: () => void }) {
  const [pressed, setPressed] = useState(false);
  const disabled = count === 0 || submitting;
  return (
    <button
      disabled={disabled}
      onClick={onSubmit}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: disabled ? '#ccc' : 'linear-gradient(180deg,#f05a4a 0%,#c0392b 100%)',
        color: 'white', border: 'none', borderRadius: '9px',
        padding: '7px 14px 9px', fontSize: '13px', fontWeight: 900, fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: disabled ? '0 2px 0 #aaa' : pressed ? '0 1px 0 #922b21,0 2px 4px rgba(192,57,43,0.3)' : '0 4px 0 #922b21,0 6px 8px rgba(192,57,43,0.35)',
        position: 'relative', top: pressed && !disabled ? '3px' : '0', transition: 'all 0.1s',
      }}>
      {submitting ? '처리 중...' : `✓ ${count}건 픽업완료 저장`}
    </button>
  );
}

function PickupProductGroup({ prodName, items, checkedRows, onToggle }: {
  prodName: string;
  items: OrderItem[];
  checkedRows: Set<number>;
  onToggle: (rowIdx: number, checked: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const totalQty = items.reduce((s, d) => s + Number(d.qty || 0), 0);
  const totalAmt = items.reduce((s, d) => s + Number(d.total || 0), 0);

  return (
    <div style={{ marginBottom: '6px' }}>
      <div onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eafaf1', borderRadius: '12px', padding: '9px 12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid #27ae60', userSelect: 'none' }}>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 900, color: '#1a5c38' }}>{prodName}</span>
        <span style={{ fontSize: '11px', color: '#27ae60', fontWeight: 700, whiteSpace: 'nowrap' }}>{items.length}건 · {totalQty}개 · {totalAmt.toLocaleString()}원</span>
        <span style={{ fontSize: '11px', color: '#27ae60', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ display: open ? 'block' : 'none', background: '#f4fdf7', borderRadius: '0 0 10px 10px', padding: open ? '4px 4px 2px' : '0' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
            <input type="checkbox" checked={checkedRows.has(item.rowIdx)} onChange={e => onToggle(item.rowIdx, e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: '#27ae60', cursor: 'pointer', flexShrink: 0, marginTop: '10px' }} />
            <div style={{ flex: 1, background: 'white', padding: '9px 11px 9px 14px', borderRadius: '10px', borderLeft: '4px solid #dcdde1', position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ position: 'absolute', top: '9px', right: '10px' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: '#f1f2f6', color: '#636e72' }}>대기중</span>
              </div>
              <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '3px', fontWeight: 400 }}>
                신청일 <b style={{ color: '#2c3e50' }}>{item.resDate}</b>&nbsp;|&nbsp;입고일 <b style={{ color: '#2c3e50' }}>{item.inDate || '-'}</b>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#27ae60', background: '#27ae6022', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>픽업가능</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#aaa', marginBottom: '3px', paddingRight: '70px' }}>{item.customer}</div>
              <div style={{ fontSize: '11px', color: '#7f8c8d', lineHeight: 1.6, fontWeight: 400 }}>
                수량: <b>{item.qty}개</b>&nbsp;|&nbsp;판매가: <b>{fmt(item.price)}원</b>&nbsp;|&nbsp;합계: <b style={{ color: '#fa7703' }}>{fmt(item.total)}원</b>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 일반 탭 (입고준비중 / 픽업완료) ──────────────────────────
function NormalTabView({ items, activeTab }: { items: OrderItem[]; activeTab: TabKey }) {
  const isDone      = activeTab === 'done';
  const title       = isDone ? '픽업 완료 상품' : '입고 준비중 상품';
  const dotColor    = isDone ? '#fa7703' : '#e67e22';

  if (items.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '13px' }}>해당 내역이 없습니다.</div>;
  }

  const groups: Record<string, OrderItem[]> = {};
  items.forEach(item => {
    if (!groups[item.prodName]) groups[item.prodName] = [];
    groups[item.prodName].push(item);
  });
  const keys = Object.keys(groups).sort((a, b) => {
    if (isDone) return (groups[b][0].pickupDate || '').localeCompare(groups[a][0].pickupDate || '');
    return (groups[b][0].resDate || '').localeCompare(groups[a][0].resDate || '');
  });

  return (
    <div>
      <div style={{ fontSize: '15px', fontWeight: 900, color: '#444', padding: '4px 6px', marginBottom: '6px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
        {title} ({keys.length}종)
      </div>
      {keys.map(prodName => {
        const grpItems = isDone
          ? [...groups[prodName]].sort((a, b) => (b.pickupDate || '').localeCompare(a.pickupDate || ''))
          : groups[prodName];
        return <NormalProductGroup key={prodName} prodName={prodName} items={grpItems} isDone={isDone} />;
      })}
    </div>
  );
}

function NormalProductGroup({ prodName, items, isDone }: { prodName: string; items: OrderItem[]; isDone: boolean }) {
  const [open, setOpen] = useState(false);
  const totalQty = items.reduce((s, d) => s + Number(d.qty || 0), 0);
  const totalAmt = items.reduce((s, d) => s + Number(d.total || 0), 0);

  return (
    <div style={{ marginBottom: '6px' }}>
      <div onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', borderRadius: '12px', padding: '9px 12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid #fa7703', userSelect: 'none' }}>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 900, color: '#2c3e50' }}>{prodName}</span>
        <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 700, whiteSpace: 'nowrap' }}>{items.length}건 · {totalQty}개 · {totalAmt.toLocaleString()}원</span>
        <span style={{ fontSize: '11px', color: '#e74c3c', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ display: open ? 'block' : 'none', padding: '4px 0 0 0' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ background: 'white', padding: '9px 11px 9px 14px', borderRadius: '10px', marginBottom: '4px', borderLeft: isDone ? '4px solid #fa7703' : '4px solid #dcdde1', position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ position: 'absolute', top: '9px', right: '10px', textAlign: 'center' }}>
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: isDone ? '#fa7703' : '#f1f2f6', color: isDone ? 'white' : '#636e72' }}>
                {isDone ? '픽업완료' : '준비중'}
              </span>
              {isDone && <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 800, color: '#fa7703' }}>📦 {item.pickupDate}</div>}
            </div>
            <div style={{ fontSize: '10px', color: '#bbb', marginBottom: '3px', fontWeight: 400 }}>
              신청일 <b style={{ color: '#2c3e50' }}>{item.resDate}</b>&nbsp;|&nbsp;입고일 <b style={{ color: '#2c3e50' }}>{item.inDate || '-'}</b>
              {!isDone && <span style={{ fontSize: '10px', fontWeight: 900, color: '#e67e22', background: '#e67e2222', padding: '1px 5px', borderRadius: '4px', marginLeft: '4px' }}>준비중</span>}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#aaa', marginBottom: '3px', paddingRight: '70px' }}>{item.customer}</div>
            <div style={{ fontSize: '11px', color: '#7f8c8d', lineHeight: 1.6, fontWeight: 400 }}>
              수량: <b>{item.qty}개</b>&nbsp;|&nbsp;판매가: <b>{fmt(item.price)}원</b>&nbsp;|&nbsp;합계: <b style={{ color: '#fa7703' }}>{fmt(item.total)}원</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 입고 상품 카드 ────────────────────────────────────────────
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
            {items.map((p, i) => {
              const inDateDisp = p.inDate ? p.inDate.substring(5).replace('-', '/').replace(/^0/, '') : '';
              return (
                <tr key={i}>
                  <td style={{ width: '28px', padding: '6px 4px 6px 14px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#fdd9aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#7a3800' }}>{i + 1}</div>
                  </td>
                  <td style={{ fontSize: '12px', fontWeight: 700, color: '#7a3800', padding: '6px 4px', borderBottom: i < items.length - 1 ? '1px solid #fdd9aa' : 'none', lineHeight: 1.35 }}>{p.name}</td>
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
