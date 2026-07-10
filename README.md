# mart-platform 자동차 안심연락 QR

## 포함된 기능
- QR 100개 발급목록 검증
- 최초 스캔: 앱 설치·알림 허용 후 전화번호 등록
- 등록 후 스캔: 차량이동요청 / 긴급호출
- 호출자 화면에 차주 전화번호 비노출
- PWA 설치 및 Web Push
- 본사 관리자 QR번호 검색
- Supabase DB 및 Vercel Serverless API

## GitHub 업로드
압축을 풀고 `mart-platform` 저장소의 **Add file → Upload files**에서
압축 안의 파일과 폴더를 모두 올린 뒤 **Commit changes**를 누릅니다.

## Supabase
`sql/supabase.sql`을 SQL Editor에서 실행합니다.

## Vercel 환경변수
Project Settings → Environment Variables에 아래 값을 입력합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  (절대 공개하지 말 것)
- `ADMIN_PASSWORD`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` 예: `mailto:관리자이메일`

VAPID 키는 로컬에서 `npx web-push generate-vapid-keys`로 만들 수 있습니다.

## 운영 주소
- QR 화면: `/72?qr=GJ-GK-001-STORE0001`
- 관리자: `/admin`

## 중요한 제한
현재 호출비용을 호출자에게 직접 결제시키는 결제 기능과 문자업체 발송은 포함하지 않았습니다.
Web Push는 작동하며, 문자 백업 발송을 사용하려면 문자업체 API 계정과 발신번호 인증이 추가로 필요합니다.
