# Taste Buddy → ChatGPT 계정 연결

Taste Buddy에서 분석 자료를 계정에 저장하고, ChatGPT의 연결된 계정으로 해당 자료를 읽는 구현입니다. OpenAI 모델 API를 호출하지 않습니다. 해석과 후속 대화는 사용자의 ChatGPT에서 진행됩니다.

## 현재 동작

1. 네이티브 분석 화면에서 **AI를 통해 분석**을 누릅니다.
2. 공유 범위와 Taste Buddy 계정 이메일을 확인합니다. 게스트는 기존 이메일 연결 화면을 이용합니다.
3. **자료 저장하고 ChatGPT 열기**를 누르면 최근 최대 20개 기록의 감각 평가·원문을 Supabase에 저장하고 등록된 ChatGPT 플러그인 페이지를 엽니다.
4. 최초 연결 때 ChatGPT에서 Taste Buddy를 연결하고 `/oauth/chatgpt`에서 같은 계정으로 로그인한 뒤 읽기를 허용합니다.
5. ChatGPT에서 Taste Buddy를 선택하고 “내 입맛 기록을 해석해 줘”라고 요청합니다. GPT가 `get_my_taste_evidence`를 호출합니다.

자료 자동 입력/전송용 비공식 URL은 사용하지 않습니다. HTTPS 링크가 iOS ChatGPT 앱으로 열리는지, 브라우저로 열리는지는 설치된 앱의 링크 처리에 달려 있습니다. 지원 기기·계정에서 직접 검증해야 합니다. 버튼만으로 새 대화가 자동 시작되거나 메시지가 자동 전송되는 구현은 아닙니다.

## 데이터와 접근 경계

- 직접 작성한 감각 평가, 음식 이름, 기록 시점, 원문 위치와 맥락만 내보냅니다. TBA가 생성한 인사이트를 새로운 관찰로 내보내지 않습니다. 이메일·사진·생년월일·계정 토큰은 분석 자료에 넣지 않습니다. 사용자가 원문에 적은 내용은 원문에 포함됩니다.
- 앱에서 요청할 때마다 사용자별 자료를 덮어씁니다. 저장 후 24시간이 지나면 조회되지 않습니다. 만료 자료는 DB에서 자동 삭제되는 것이 아니므로 운영 보존 기간에 맞춰 정기 삭제를 설정합니다.
- 이후 로컬 수정·삭제는 자동 동기화되지 않습니다. 다시 분석을 요청하거나 **공유한 분석 자료 삭제**로 서버 사본을 삭제해야 합니다. 앱의 일반 분석 화면과 이 사본은 독립적입니다.
- 사용자별 RLS는 본인의 자료만 저장·삭제하게 합니다. Auth 사용자를 삭제하면 외래 키로 사본도 삭제됩니다.
- Supabase OAuth 토큰은 `tb_chatgpt_reader` 역할·MCP 전용 audience·`taste:read` 권한으로 발급합니다. 이 역할은 `authenticator`에 부여하지 않습니다. 따라서 토큰으로 일반 PostgREST/RPC/Storage API에 접근할 수 없습니다.
- MCP 서버는 JWKS 서명, issuer, audience, 만료, client ID, 역할, scope, 사용자 ID를 검증한 뒤 서버 전용 키로 **검증된 사용자 ID의 `chatgpt_analysis_exports` 행만** 조회합니다. 도구 인자로 사용자 ID나 테이블/쿼리를 받지 않습니다. 서버 키는 앱·웹·GPT에 전달하지 않습니다.
- 기존 계정 삭제/사진 업로드 함수도 OAuth 토큰을 거부합니다. OAuth 토큰을 일반 앱 인증으로 취급하는 Edge Function을 추가하지 마세요.
- ChatGPT 연결 해제와 발급된 access token의 만료는 별개일 수 있습니다. 즉시 조회를 막으려면 앱에서 공유 자료를 삭제합니다. 이미 ChatGPT에 전달된 내용과 답변을 여기서 삭제할 수는 없습니다.

## 실제 연결을 활성화하는 순서

아래 외부 설정이 완료되기 전에는 `TB_CHATGPT_ENTRY_URL`을 비워 둡니다. 미등록 기능 버튼을 사용자에게 노출하지 않습니다.

현재 `tastebuddy.app`의 응답 헤더에서 Vercel 운영을 확인했습니다. 루트 `vercel.json`과 `api/chatgpt.mjs`를 함께 배포하면 같은 프로젝트 안에서 아래 주소를 사용할 수 있습니다. **아직 배포된 경로가 아닙니다.**

- 로그인·동의: `https://tastebuddy.app/oauth/chatgpt`
- MCP: `https://tastebuddy.app/mcp`
- 공개 인증 메타데이터: `https://tastebuddy.app/.well-known/oauth-protected-resource/mcp`

Vercel 환경 변수에 서버용 설정과 웹용 공개 설정을 각각 넣습니다. `TB_MCP_RESOURCE=https://tastebuddy.app/mcp`로 설정하고 웹/서버의 Supabase URL과 OAuth client ID를 일치시킵니다. 빌드 시 `write-discovery.mjs`가 공개 설정만 정적 파일로 생성합니다. Vercel의 `/.well-known` 경로는 rewrite하지 않습니다. 현재 프로젝트의 Node 버전은 22 이상이어야 합니다. 아래 별도 Node/Docker 서버 배포는 다른 호스팅을 선택할 때의 대안입니다.

1. **공개 주소 준비**
   - 웹 앱을 HTTPS로 배포합니다. `/oauth/chatgpt` 요청이 SPA의 `index.html`로 전달되어야 합니다.
   - 이 디렉터리의 서버를 Node 22 이상 또는 Docker로 HTTPS 뒤에 배포합니다. 공개 resource 주소는 `https://실제-MCP-호스트/mcp` 형태입니다. reverse proxy는 Authorization 헤더와 POST 본문을 보존해야 합니다. 요청 본문·토큰을 접근 로그에 남기지 않습니다.
2. **Supabase OAuth 클라이언트 등록**
   - 기존 프로젝트의 Auth → OAuth Server를 활성화합니다. Authorization path를 `/oauth/chatgpt`로, Site URL을 배포한 웹 앱 주소로 설정합니다. 기존 Site URL/리다이렉트에 의존하는 로그인 흐름도 확인합니다.
   - ChatGPT 앱 관리 화면에서 표시하는 **정확한 redirect URI**를 사용해 전용 OAuth 클라이언트를 사전 등록합니다. 임의 redirect URI나 와일드카드를 사용하지 않습니다.
   - PKCE S256을 사용합니다. ChatGPT가 요청하는 OAuth 방식과 일치하는 public client(`none`) 또는 confidential client를 선택합니다. confidential client secret은 ChatGPT 앱 등록 화면에만 설정하며 iOS/웹 번들에 넣지 않습니다.
   - 이 구현은 단일 사전 등록 client ID만 허용합니다. Dynamic Client Registration을 열지 않습니다.
3. **DB와 토큰 훅 배포**
   - `supabase/migrations/20260906120000_chatgpt_analysis_connection.sql`을 적용합니다.
   - 관리용 SQL로 `public.chatgpt_oauth_configuration`의 한 행에 실제 `client_id`, `resource_url`을 설정합니다. 일반 사용자/API에서 수정할 수 없는 테이블입니다.
   - Auth → Hooks에서 `public.chatgpt_access_token_hook`을 Custom Access Token Hook으로 활성화합니다. 기존 hook이 있으면 기존 동작을 보존해 병합합니다. 기존 OAuth 클라이언트가 있다면 이 훅은 기본적으로 거부하므로 적용 전에 별도 정책을 정해야 합니다. 일반 앱 로그인 토큰은 바꾸지 않습니다.
   - 비대칭 JWT 서명 키(ES256 또는 RS256)와 JWKS를 확인합니다. 이 MCP 서버는 HS256 shared secret을 받지 않습니다.
   - 변경한 `delete-account`, `upload-profile-avatar`, `upload-feedback-reflection-photo` Edge Functions를 배포합니다.
4. **서버·웹 설정**
   - 서버: `.env.example`의 `SUPABASE_URL`, 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`, `TB_CHATGPT_CLIENT_ID`, `TB_MCP_RESOURCE`를 secret/config 관리 기능으로 주입합니다.
   - 웹: 기존 Supabase 공개 설정과 `VITE_TB_CHATGPT_CLIENT_ID`를 설정하고 `npm run build` 결과를 배포합니다.
   - 클라이언트 ID와 resource URL은 DB 설정과 정확히 같아야 합니다.
   - 서버 시작: 이 디렉터리에서 `npm ci --ignore-scripts` 후 환경 변수를 주입하고 `npm start`. Docker는 이 디렉터리를 빌드 컨텍스트로 사용합니다.
5. **ChatGPT 연결·등록**
   - 개발용 계정에서 실제 MCP URL과 OAuth client 정보를 등록해 연결을 테스트합니다. 공개 배포는 OpenAI의 심사·공개 절차를 진행합니다. 비공개 테스트 연결과 일반 사용자에게 배포하는 등록은 다릅니다.
   - ChatGPT 플러그인 페이지의 **실제 HTTPS 주소**를 얻습니다. 주소를 추측해서 만들지 않습니다.
6. **네이티브 활성화**
   - `TB_CHATGPT_ENTRY_URL` 빌드 설정에 해당 주소를 넣습니다. xcconfig에서는 `https:/$()/chatgpt.com/plugins/실제-slug` 형식을 사용해 `//`가 주석으로 해석되지 않게 합니다.
   - 앱의 Supabase 프로젝트와 웹 로그인/MCP의 프로젝트가 같은지 확인합니다.

## 검증

로컬:

```sh
node --test scripts/chatgpt-connection.test.mjs scripts/chatgpt-session-boundary.test.mjs
npm --prefix integrations/chatgpt ci --ignore-scripts
npm --prefix integrations/chatgpt test
npm run build
```

iOS는 TasteBuddy scheme의 build와 unit tests를 실행합니다. `ChatGPTAnalysisConnectionTests`는 허용된 연결 주소, 최근 20개 기록 묶음, 원문 보존, 생성 인사이트 제외를 검증합니다.

배포 후 실제 계정으로 반드시 확인할 항목:

- discovery → 로그인 → 동의 → PKCE token exchange → MCP 조회가 완료되는지.
- 일반 앱 토큰, 다른 OAuth client, 잘못된 audience, 만료 토큰은 MCP에서 거부되는지.
- OAuth 토큰으로 Supabase REST/RPC/Storage와 계정 삭제/사진 업로드가 거부되는지.
- 두 계정의 기록이 서로 보이지 않는지, 자료 삭제와 계정 삭제 후 조회가 중단되는지.
- 원문 없는 기록과 만료 자료에서 GPT가 근거를 만들어내지 않는지.
- iOS ChatGPT 앱/브라우저 전환과 실제 플러그인 사용 가능 여부. OpenAI 계정·지역·앱 버전에 따라 차이가 있을 수 있습니다.

로컬 모의 인증 테스트는 Supabase의 실제 토큰 발급·ChatGPT 연결·OpenAI 심사 통과를 증명하지 않습니다.

참고: [OpenAI 인증](https://developers.openai.com/plugins/build/auth), [ChatGPT 연결 테스트](https://developers.openai.com/plugins/deploy/connect-chatgpt), [Supabase OAuth 서버](https://supabase.com/docs/guides/auth/oauth-server), [Supabase MCP 인증](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication).
