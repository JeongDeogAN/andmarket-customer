# andmarket09.com/customer 도메인 설정 가이드

> 현재 Vercel 배포 URL: `andmarket-customer.vercel.app`  
> 목표 도메인: `andmarket09.com/customer`

---

## Step 5. Vercel 커스텀 도메인 연결

### 5-1. Vercel 프로젝트 설정 진입

1. [https://vercel.com](https://vercel.com) 로그인
2. `andmarket-customer` 프로젝트 선택
3. 상단 탭 **Settings** → 좌측 메뉴 **Domains** 클릭

### 5-2. 도메인 추가

1. 입력창에 `andmarket09.com` 입력 후 **Add** 클릭
2. Vercel이 DNS 설정값을 화면에 표시함 (아래 유형 중 하나)

| 유형 | 이름 | 값 |
|------|------|----|
| **A 레코드** | `@` (루트) | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

> **중요:** Vercel 화면에 표시된 실제 값을 사용하세요. 위 값은 일반적인 예시이며 계정마다 다를 수 있습니다.

### 5-3. www 리다이렉트 설정 (선택)

- `www.andmarket09.com` → `andmarket09.com` 자동 리다이렉트 여부 선택
- Vercel에서 두 도메인 모두 추가하면 자동 처리됨

---

## Step 6. 가비아 DNS 설정

### 6-1. 가비아 DNS 관리 진입

1. [https://www.gabia.com](https://www.gabia.com) 로그인
2. 우측 상단 **My가비아** → **서비스 관리**
3. **도메인** 탭 → `andmarket09.com` 선택
4. **DNS 정보** → **DNS 관리** 클릭

### 6-2. 기존 DNS 레코드 확인

- 기존에 등록된 A 레코드나 CNAME이 있으면 **삭제** 후 진행
- 가비아 기본 네임서버(ns1.gabia.net 등)를 사용 중인지 확인

### 6-3. A 레코드 추가 (루트 도메인)

| 항목 | 입력값 |
|------|--------|
| 타입 | `A` |
| 호스트 | `@` |
| IP 주소 | `76.76.21.21` (Vercel 제공값) |
| TTL | `3600` (기본값) |

### 6-4. CNAME 레코드 추가 (www)

| 항목 | 입력값 |
|------|--------|
| 타입 | `CNAME` |
| 호스트 | `www` |
| 값 | `cname.vercel-dns.com` (Vercel 제공값) |
| TTL | `3600` (기본값) |

### 6-5. 저장 및 전파 대기

- **저장** 버튼 클릭
- DNS 전파 시간: 보통 **10분 ~ 최대 48시간** (국내는 대부분 1시간 이내)
- Vercel Domains 탭에서 ✅ 체크 표시 확인되면 완료

---

## 설정 완료 후 확인 방법

```bash
# DNS 전파 확인 (PowerShell)
nslookup andmarket09.com

# 또는 브라우저에서 직접 접속
https://andmarket09.com/customer
```

---

## 주의사항

- `/customer` 경로는 코드 수정(basePath 설정) 완료 후 정상 작동함
- 도메인 연결만으로는 `/customer` 경로가 동작하지 않음 — **코드 수정(Step 1~3)이 선행**되어야 함
- SSL 인증서는 Vercel이 자동 발급 (Let's Encrypt), 별도 설정 불필요

---

## 전체 작업 순서 요약

```
[코드 수정] Step 1. next.config.ts → basePath: '/customer' 추가
[코드 수정] Step 2. page.tsx → fetch/이미지 경로 수정
[코드 수정] Step 3. layout.tsx → 도메인 andmarket09.com/customer 로 변경
[배포]      Step 4. git push → Vercel 자동 빌드 및 배포
[DNS]       Step 5. Vercel에 andmarket09.com 도메인 추가
[DNS]       Step 6. 가비아에 A레코드 / CNAME 등록
[확인]      https://andmarket09.com/customer 접속 테스트
```
