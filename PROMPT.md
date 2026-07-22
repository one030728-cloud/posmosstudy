# 프로젝트: 토스 POS 학원 관리 플러그인 (탭앱)

## 배경 / 목표

학원(교육기관) 사장님을 위한 **토스 POS 플러그인(탭앱)**을 만든다. 사장님이 토스 "사장님(POS)" 앱 안에서:

1. 원생을 등록하고
2. 원생에게 결제링크(1회성 결제 — 입학비, 교재비 등)를 보내고
3. 원생의 월 수강료를 **정기결제(자동결제)** 로 청구할 수 있게 한다.

참고 문서:
- 결제링크 기능: https://docs.tosspayments.com/guides/v2/linkpay (LinkPay — no-code 결제 링크, 상품 생성 API → productKey/URL 반환 → 웹훅으로 결제 상태 수신)
- 정기결제 개념: https://docs.tosspayments.com/resources/glossary/billing (빌링키 = 카드정보 암호화 토큰, customerKey = 상점이 고객을 구분하는 식별값, 빌링키와 1:1 매핑. 신용/체크카드만 지원, 정기 구독 전용, 실패율이 높아 재시도/대체카드 로직 필요)
- 토스 POS 플러그인 개발: https://docs.tossplace.com/ (Open API — Access Key/Secret 인증, `x-access-key`/`x-secret-key` 헤더. 애플리케이션 등록 → 테스트 가맹점 연결 → 연동 확인 순서. TypeScript 기반 개발 환경. **POS 플러그인은 실물 단말기 없이 개발 가능** — 프론트 플러그인과 달리 로컬 개발/테스트가 바로 가능함)

## 아키텍처 (반드시 이 구조를 따를 것)

```
[사장님(POS) 앱 안의 탭앱]  ──HTTPS──▶  [백엔드 서버(BFF)]  ──▶  토스페이먼츠 API (LinkPay, 빌링)
   (TypeScript/React, 토스 POS SDK)         (Access Key/Secret 보관)   토스플레이스 Open API (매장 정보)
                                                 │
                                        DB: 원생 / 결제 / 빌링키
                                                 ▲
                                        웹훅 수신 엔드포인트 ◀── 토스페이먼츠 (결제 완료/실패 알림)
                                                 │
                                        스케줄러(cron): 매월 자동청구
```

**중요한 보안 원칙**: Access Key/Secret, 토스페이먼츠 시크릿 키는 절대 프론트(탭앱) 코드에 넣지 않는다. 탭앱은 백엔드 API만 호출하는 얇은 클라이언트로 만든다. 웹훅 처리와 정기 결제 배치(cron)는 반드시 서버에서 수행한다.

## 데이터 모델 (참고, 필요시 조정 가능)

- `Student`: id, name, guardianPhone, courseId, monthlyFee, status(재원/휴원/퇴원)
- `BillingKey`: id, studentId, customerKey(=studentId로 고정), billingKey, cardLast4, issuedAt, status
- `PaymentLink`: id, studentId, productKey, url, amount, status(대기/완료/만료), sentAt
- `PaymentHistory`: id, studentId, type(링크/정기), amount, status, failReason, paidAt
- `BillingSchedule`: studentId, dueDay(매월 결제일), nextRunAt

## 핵심 플로우

### ① 원생 등록
탭앱 폼(이름/연락처/수강료/담당 강좌) → 백엔드 저장. 토스 API 호출 없음.

### ② 결제링크 발송 (1회성)
1. 탭앱에서 원생 선택 → 금액/사유 입력 후 발송
2. 백엔드가 LinkPay 상품 생성 API 호출 → productKey + URL 발급
3. 학부모 연락처로 문자 발송 (LinkPay 자체 문자 발송 기능 활용)
4. 웹훅으로 결제 완료/실패 수신 → PaymentHistory 갱신 → 탭앱에 반영

### ③ 정기결제 등록 및 자동 청구
1. 탭앱에서 "정기결제 등록" → 학부모에게 빌링키 등록창 링크 전달 (본인인증 포함 방식 권장)
2. 학부모가 카드 등록 완료 → billingKey 수신, customerKey(studentId)와 매핑 저장
3. 백엔드 스케줄러(매일 실행)가 dueDay가 오늘인 학생을 찾아 빌링키로 자동 결제 호출
4. 결과를 PaymentHistory에 기록. 실패 시(한도초과/카드분실/유효기간만료 등) 재등록 안내 알림 + 재시도 로직(예: 3일 뒤 1회 재시도)

## 탭앱 화면

- 원생 목록: 이름 / 수강료 / 이번 달 결제 상태 / 빌링키 등록 여부
- 원생 상세: 결제 이력, "결제링크 보내기", "정기결제 등록/해지" 버튼
- 대시보드: 이번 달 미납자, 정기결제 실패 건

## 작업 지시

지금 이 디렉터리(`C:\Users\han\Desktop\토스학원`)는 비어 있다. 아래 순서로 **알아서 스스로 판단해 진행**하되, 각 단계가 끝나면 무엇을 했는지 간단히 보고할 것:

1. 프로젝트 스캐폴딩: 백엔드(Node/TypeScript, 예: NestJS 또는 Express) + 프론트(탭앱, React+TypeScript) 모노레포 또는 별도 폴더로 구성. 실제 토스 API 키는 아직 없으니 `.env.example`과 목(mock) 응답으로 개발한다.
2. 데이터 모델/DB 스키마 구현 (SQLite 또는 Postgres, 개발 편의상 SQLite부터)
3. 원생 등록 CRUD API + 탭앱 화면
4. 결제링크 발송 플로우 — 실제 토스페이먼츠 LinkPay API는 아직 키가 없으므로 **인터페이스는 실제 API 스펙대로 구현하되, API 클라이언트 부분은 환경변수로 목/실제 전환 가능하게 추상화**. 웹훅 수신 엔드포인트도 구현
5. 정기결제(빌링) 플로우 — 빌링키 저장, 스케줄러(cron), 자동청구, 실패 재시도 로직
6. 각 단계마다 기본적인 테스트(가능하면) 또는 최소한 수동 확인 가능한 방법을 정리

토스페이먼츠/토스플레이스 실제 API 키, 시크릿, 가맹점 계정은 아직 없다는 전제로 진행하고, 실제 키가 필요한 지점은 명확히 표시해둘 것. 임의로 실제 API를 호출하거나 외부에 결제 요청을 보내지 않는다 (전부 로컬/목 환경).
