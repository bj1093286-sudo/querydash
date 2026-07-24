# QueryDash

Redash와 동일한 컨셉의 SQL 기반 데이터 시각화 대시보드. pnpm workspace + Turborepo 모노레포로 구성되어 있다.

## 구조

- `packages/types` — 공유 TypeScript 타입 (`@querydash/types`)
- `packages/ui` — 재사용 가능한 UI 컴포넌트 라이브러리 (`@querydash/ui`, npm 배포 가능)
- `packages/query-engine` — 데이터소스 커넥터 및 쿼리 실행 엔진 (`@querydash/query-engine`)
- `apps/web` — Next.js 프론트엔드
- `apps/server` — Hono 기반 백엔드 API

## 시작하기

```bash
pnpm install
cp .env.example .env
cp apps/server/.env.example apps/server/.env
```

`apps/server/.env`의 `DATABASE_URL`이 가리키는 PostgreSQL이 필요하다 (Docker로 실행하려면 `docker compose up postgres redis`).

DB 스키마 적용:

```bash
pnpm --filter @querydash/server db:generate
pnpm --filter @querydash/server db:migrate
```

개발 서버 실행 (워크스페이스 전체를 빌드 후 web/server를 동시 실행):

```bash
pnpm dev
```

- 웹: http://localhost:3000
- API: http://localhost:8000

## Docker Compose로 전체 실행

```bash
docker compose up --build
```

## Phase 1 구현 범위

- pnpm workspace + Turborepo 모노레포 세팅
- `@querydash/types` 공유 타입
- `@querydash/ui`: 디자인 토큰, SQLEditor(CodeMirror 6), SchemaTree, DataTable(TanStack Table + Virtual), 공통 컴포넌트
- `@querydash/query-engine`: PostgreSQL 커넥터, 파라미터 파서(SQL 인젝션 방지), 쿼리 실행/스키마 로더
- Hono + Drizzle ORM 백엔드: 데이터소스/쿼리 CRUD, 동기 쿼리 실행, 결과 저장/조회
- Next.js 프론트엔드: 쿼리 작성/실행/결과 확인, 데이터소스 등록 페이지
