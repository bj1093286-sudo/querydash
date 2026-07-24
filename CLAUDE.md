# 프로젝트: "QueryDash" - Redash 클론 오픈소스 SQL 시각화 대시보드

## 개요
Redash(https://github.com/getredash/redash)와 동일한 컨셉의 SQL 기반 데이터 시각화 대시보드 도구를 처음부터 구현한다.
다른 프로젝트에서도 npm 패키지로 설치하여 재사용할 수 있도록 핵심 컴포넌트들을 라이브러리로도 분리 배포 가능하게 설계한다.

---

## 1. 모노레포 프로젝트 구조

pnpm workspace 기반 모노레포로 구성한다.

querydash/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── packages/
│   ├── ui/                          # @querydash/ui - 공통 UI 컴포넌트 라이브러리
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── SQLEditor/
│   │   │   │   │   ├── SQLEditor.tsx
│   │   │   │   │   ├── SchemaTree.tsx
│   │   │   │   │   ├── AutoComplete.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Chart/
│   │   │   │   │   ├── ChartRenderer.tsx
│   │   │   │   │   ├── ChartEditor.tsx
│   │   │   │   │   ├── types/
│   │   │   │   │   │   ├── LineChart.tsx
│   │   │   │   │   │   ├── BarChart.tsx
│   │   │   │   │   │   ├── AreaChart.tsx
│   │   │   │   │   │   ├── PieChart.tsx
│   │   │   │   │   │   ├── ScatterChart.tsx
│   │   │   │   │   │   ├── HeatmapChart.tsx
│   │   │   │   │   │   ├── BoxPlot.tsx
│   │   │   │   │   │   ├── BubbleChart.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Table/
│   │   │   │   │   ├── DataTable.tsx
│   │   │   │   │   ├── PivotTable.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Counter/
│   │   │   │   │   └── Counter.tsx
│   │   │   │   ├── Parameter/
│   │   │   │   │   ├── ParameterPanel.tsx
│   │   │   │   │   ├── DateParameter.tsx
│   │   │   │   │   ├── DateRangeParameter.tsx
│   │   │   │   │   ├── TextParameter.tsx
│   │   │   │   │   ├── NumberParameter.tsx
│   │   │   │   │   ├── DropdownParameter.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Dashboard/
│   │   │   │   │   ├── DashboardGrid.tsx
│   │   │   │   │   ├── Widget.tsx
│   │   │   │   │   ├── TextWidget.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── common/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Dropdown.tsx
│   │   │   │       ├── Tabs.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Tag.tsx
│   │   │   │       ├── Tooltip.tsx
│   │   │   │       └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useQueryExecution.ts
│   │   │   │   ├── useSchema.ts
│   │   │   │   ├── useAutoComplete.ts
│   │   │   │   └── useChartConfig.ts
│   │   │   ├── theme/
│   │   │   │   ├── tokens.ts
│   │   │   │   ├── globalStyles.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsup.config.ts
│   ├── query-engine/                # @querydash/query-engine
│   │   ├── src/
│   │   │   ├── connectors/
│   │   │   │   ├── base.ts
│   │   │   │   ├── postgresql.ts
│   │   │   │   ├── mysql.ts
│   │   │   │   ├── bigquery.ts
│   │   │   │   ├── sqlite.ts
│   │   │   │   └── index.ts
│   │   │   ├── parameter-parser.ts
│   │   │   ├── query-runner.ts
│   │   │   ├── schema-loader.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── types/                       # @querydash/types
│       ├── src/
│       │   ├── query.ts
│       │   ├── visualization.ts
│       │   ├── dashboard.ts
│       │   ├── datasource.ts
│       │   └── index.ts
│       └── package.json
├── apps/
│   ├── web/                         # Next.js 웹앱
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── queries/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── dashboards/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── datasources/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── alerts/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Navbar.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── AppShell.tsx
│   │   │   │   ├── query/
│   │   │   │   │   ├── QueryPage.tsx
│   │   │   │   │   ├── QueryResultPanel.tsx
│   │   │   │   │   └── VisualizationTabs.tsx
│   │   │   │   └── datasource/
│   │   │   │       └── DataSourceForm.tsx
│   │   │   ├── store/
│   │   │   │   ├── queryStore.ts
│   │   │   │   ├── dashboardStore.ts
│   │   │   │   └── datasourceStore.ts
│   │   │   └── lib/
│   │   │       ├── api.ts
│   │   │       └── utils.ts
│   │   └── package.json
│   └── server/                      # Hono 백엔드
│       ├── src/
│       │   ├── routes/
│       │   │   ├── queries.ts
│       │   │   ├── datasources.ts
│       │   │   ├── dashboards.ts
│       │   │   ├── visualizations.ts
│       │   │   └── auth.ts
│       │   ├── services/
│       │   │   ├── queryService.ts
│       │   │   ├── datasourceService.ts
│       │   │   └── schedulerService.ts
│       │   ├── db/
│       │   │   ├── schema.ts
│       │   │   └── migrations/
│       │   ├── queue/
│       │   │   ├── worker.ts
│       │   │   └── jobs.ts
│       │   └── index.ts
│       └── package.json
├── docker-compose.yml
└── README.md

---

## 2. 디자인 시스템 (Redash 스타일 참고)

Redash의 디자인을 충실히 참고하되 좀 더 모던하게 다듬는다.

### 2-1. 컬러 토큰 (theme/tokens.ts)

export const colors = {
  primary: {
    50: '#EBF5FF',
    100: '#D6EBFF',
    200: '#ADD6FF',
    300: '#85C1FF',
    400: '#5CACFF',
    500: '#2196F3',
    600: '#1976D2',
    700: '#1565C0',
    800: '#0D47A1',
    900: '#0A3069',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F7F8FA',
    100: '#EEEFF2',
    200: '#D9DBE0',
    300: '#B8BCC5',
    400: '#9BA0AB',
    500: '#767C89',
    600: '#595E6A',
    700: '#3D4250',
    800: '#23272F',
    900: '#141720',
  },
  success: '#28A745',
  warning: '#FFC107',
  error: '#E53E3E',
  info: '#2196F3',
  chartPalette: [
    '#4DC4FF', '#FF6B6B', '#51CF66', '#FFD43B',
    '#CC5DE8', '#FF922B', '#20C997', '#748FFC',
    '#F06595', '#845EF7', '#FFA94D', '#69DB7C',
  ],
  editor: {
    background: '#FFFFFF',
    gutterBg: '#F7F8FA',
    lineNumber: '#9BA0AB',
    cursor: '#23272F',
    selection: '#D6EBFF',
    keyword: '#1976D2',
    string: '#28A745',
    number: '#E53E3E',
    comment: '#9BA0AB',
    table: '#CC5DE8',
    column: '#23272F',
  },
};

export const spacing = {
  xs: '4px', sm: '8px', md: '12px', lg: '16px',
  xl: '24px', xxl: '32px', xxxl: '48px',
};

export const radius = {
  sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 2px 8px rgba(0,0,0,0.08)',
  lg: '0 4px 16px rgba(0,0,0,0.12)',
  card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  monoFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  sizes: {
    xs: '11px', sm: '13px', md: '14px', lg: '16px',
    xl: '20px', xxl: '24px', xxxl: '32px',
  },
};

### 2-2. 전체 레이아웃 구조 (Redash 참고)

Navbar (높이 50px, 흰색 배경, 하단 1px 보더)
- 왼쪽: Logo, 검색바
- 가운데: Queries, Dashboards, Alerts 탭
- 오른쪽: + Create 드롭다운, 유저 프로필

쿼리 편집 페이지:
- 상단 바: 쿼리 이름(편집가능) | 데이터소스 선택 드롭다운 | Save 버튼 | Execute 버튼
- 좌측: 스키마 브라우저 (너비 240px, 접기가능)
- 우측: SQL 에디터 (CodeMirror)
- 에디터 아래: 파라미터 패널 ({{}} 감지시 자동 표시)
- 하단: 결과 패널 (리사이즈 가능, 탭으로 Table/시각화 전환)
  - 탭: [Table] [+ New Visualization]
  - 하단 바: "Showing X rows | 실행시간 0.XXs"

---

## 3. 핵심 컴포넌트 상세 구현 명세

### 3-1. SQL 에디터 (@querydash/ui - SQLEditor)

CodeMirror 6 기반 (@codemirror/lang-sql, @codemirror/autocomplete)

기능:
- SQL 문법 하이라이팅 (위 editor 컬러 토큰 적용)
- 스키마 기반 자동완성 (테이블명, 컬럼명)
- {{parameter_name}} 구문 커스텀 하이라이팅 (주황색 배경, 라운드)
- Ctrl+Enter로 실행, Ctrl+S로 저장 키보드 단축키
- 줄번호, 현재줄 하이라이팅
- 에디터 최소 높이 200px, 드래그로 리사이즈 가능

Props 인터페이스:

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  onSave?: () => void;
  schema?: DatabaseSchema;
  readOnly?: boolean;
  height?: string | number;
  placeholder?: string;
  dialect?: 'postgresql' | 'mysql' | 'sqlite' | 'bigquery';
}

### 3-2. 스키마 브라우저 (@querydash/ui - SchemaTree)

- 에디터 왼쪽에 위치, 너비 240px, 접기/펼치기 가능
- 상단 검색 input으로 테이블/컬럼 필터링
- 트리 구조: 데이터소스 > 스키마 > 테이블 > 컬럼(타입 표시)
- 테이블/컬럼 클릭시 에디터에 자동 삽입 (Redash의 >> 아이콘)
- 새로고침 버튼으로 스키마 리로드

Props:

interface SchemaTreeProps {
  schema: DatabaseSchema;
  onInsert: (text: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

### 3-3. 쿼리 파라미터 시스템 (@querydash/ui - ParameterPanel)

- SQL에서 {{param_name}} 패턴을 자동 감지하여 UI 생성
- 파라미터 타입: Text, Number, Date, Date Range, Dropdown (정적/쿼리 기반)
- 파라미터명에 "date"가 포함되면 자동으로 DatePicker 사용
- 날짜 파라미터에 "Quick Range" 지원: Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, Custom
- 여러 파라미터가 있으면 가로로 나열, "Apply Changes" 버튼으로 일괄 적용

Props:

interface ParameterPanelProps {
  parameters: Parameter[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onApply: () => void;
}

### 3-4. 차트 시각화 시스템 (@querydash/ui - Chart)

ECharts (Apache ECharts) 기반으로 구현한다.

지원 차트 타입 (Redash 전체 타입 포함):
1. Table (기본, 정렬/페이지네이션/검색)
2. Line Chart
3. Bar Chart (수직/수평)
4. Area Chart
5. Pie Chart / Donut Chart
6. Scatter Chart
7. Bubble Chart
8. Heatmap
9. Box Plot
10. Counter (큰 숫자 표시 위젯)
11. Pivot Table
12. Funnel Chart
13. Cohort (리텐션 테이블)
14. Word Cloud
15. Sankey Diagram
16. Sunburst Chart
17. Map (추후)

차트 설정 에디터 (ChartEditor) - Redash와 동일하게 탭 구조:
- General 탭: 차트 타입 선택, X축 컬럼, Y축 컬럼(다중), Group By 컬럼
- X Axis 탭: 축 레이블, 범위(min/max), 정렬, 스케일(linear/log/datetime)
- Y Axis 탭: 좌/우 Y축 설정, 범위, 레이블
- Series 탭: 각 시리즈별 타입 변경(라인-바 혼합), 색상, z-index, 좌/우축 할당
- Colors 탭: 시리즈별 색상 커스텀 (컬러피커)
- Data Labels 탭: 호버시 표시 정보 설정
- 설정 변경시 실시간 프리뷰 업데이트 (Redash처럼 저장 없이 바로 반영)

ChartRenderer Props:

interface ChartRendererProps {
  type: VisualizationType;
  data: QueryResult;
  config: ChartConfig;
  width?: number | string;
  height?: number | string;
  loading?: boolean;
  onConfigChange?: (config: ChartConfig) => void;
}

interface ChartConfig {
  xAxis: string;
  yAxis: string[];
  groupBy?: string;
  seriesOptions?: Record<string, SeriesOption>;
  xAxisOptions?: AxisOption;
  yAxisOptions?: AxisOption[];
  colorPalette?: string[];
  stacking?: 'none' | 'stack' | 'percent';
  legend?: { enabled: boolean; position: string };
  dataLabels?: DataLabelOption;
}

### 3-5. 결과 테이블 (@querydash/ui - DataTable)

- TanStack Table (React Table v8) 기반
- 기능: 컬럼 정렬, 컬럼 리사이즈, 페이지네이션, 행 수 표시
- 숫자 컬럼 자동 우측 정렬, 날짜 컬럼 포맷팅
- 대용량 데이터 가상 스크롤링 (@tanstack/react-virtual)
- 하단에 "Showing X rows | 실행시간 0.XXs" 표시 (Redash 스타일)

### 3-6. 대시보드 빌더 (@querydash/ui - DashboardGrid)

- react-grid-layout 기반 드래그앤드롭 레이아웃
- 12컬럼 그리드, 위젯 리사이즈 가능
- 위젯 타입: Visualization(쿼리 결과 차트), Text(마크다운)
- 편집 모드 / 뷰 모드 토글
- 위젯 추가: "Add Widget" 버튼 -> 기존 쿼리의 시각화 선택 모달
- 대시보드 레벨 파라미터 필터 (상단에 표시, 여러 쿼리에 동시 적용)
- 자동 새로고침 간격 설정 (1분/5분/10분/30분/1시간)

---

## 4. 백엔드 API 명세

### 4-1. 기술 스택
- Runtime: Node.js + Hono (경량 웹프레임워크)
- ORM: Drizzle ORM
- 메타데이터 DB: PostgreSQL
- 큐: BullMQ + Redis (쿼리 비동기 실행)
- 인증: JWT + bcrypt

### 4-2. DB 스키마 (Drizzle)

users: id, email, name, password_hash, role('admin'|'editor'|'viewer'), created_at, updated_at

datasources: id, name, type('postgresql'|'mysql'|'bigquery'|'sqlite'), connection_options(jsonb 암호화), created_by, created_at

queries: id, name, description, sql_text, datasource_id, schedule(jsonb cron식), options(jsonb), is_published, is_archived, created_by, latest_result_id, created_at, updated_at

query_results: id, query_id, data(jsonb), runtime_seconds, retrieved_at

visualizations: id, query_id, name, type, options(jsonb), created_at, updated_at

dashboards: id, name, slug, is_published, is_archived, dashboard_filters(jsonb), layout(jsonb), created_by, created_at, updated_at

widgets: id, dashboard_id, visualization_id, text(텍스트위젯용), options(jsonb 위치 크기), width, created_at

alerts: id, name, query_id, column, op('greater'|'less'|'equals'), value, state('ok'|'triggered'|'unknown'), schedule, created_by, created_at

### 4-3. REST API 엔드포인트

인증:
- POST /api/auth/login
- POST /api/auth/signup
- GET /api/auth/me

데이터소스:
- GET /api/datasources
- POST /api/datasources
- GET /api/datasources/:id
- PUT /api/datasources/:id
- DELETE /api/datasources/:id
- GET /api/datasources/:id/schema

쿼리:
- GET /api/queries
- POST /api/queries
- GET /api/queries/:id
- PUT /api/queries/:id
- DELETE /api/queries/:id
- POST /api/queries/:id/execute
- GET /api/queries/:id/result
- GET /api/jobs/:id

시각화:
- POST /api/visualizations
- PUT /api/visualizations/:id
- DELETE /api/visualizations/:id

대시보드:
- GET /api/dashboards
- POST /api/dashboards
- GET /api/dashboards/:id
- PUT /api/dashboards/:id
- DELETE /api/dashboards/:id
- POST /api/dashboards/:id/widgets
- PUT /api/widgets/:id
- DELETE /api/widgets/:id

알림:
- GET /api/alerts
- POST /api/alerts
- GET /api/alerts/:id
- PUT /api/alerts/:id
- DELETE /api/alerts/:id

공유:
- POST /api/queries/:id/share
- GET /api/public/queries/:token
- GET /api/public/dashboards/:token

---

## 5. 쿼리 실행 흐름

1. 프론트에서 POST /api/queries/:id/execute (params 포함)
2. 서버가 {{param}} 바인딩 -> 안전한 parameterized query로 변환
3. BullMQ에 job 등록 -> job_id 반환
4. 프론트는 GET /api/jobs/:job_id 로 폴링 (1초 간격)
5. Worker가 해당 datasource에 연결 -> SQL 실행
6. 결과를 query_results 테이블에 저장
7. job 상태를 completed로 업데이트
8. 프론트가 폴링에서 완료 감지 -> 결과 렌더링

- 쿼리 타임아웃: 기본 300초, datasource별 설정 가능
- 결과 캐싱: 동일 쿼리+파라미터 조합의 결과를 TTL(설정 가능) 동안 캐싱
- 동시 실행 제한: datasource별 max_concurrent 설정

---

## 6. 라이브러리 배포 설정 (@querydash/ui)

다른 프로젝트에서 npm install @querydash/ui 로 설치하여 사용할 수 있게 한다.

tsup.config.ts:
- entry: src/index.ts
- format: cjs, esm
- dts: true
- splitting: true
- sourcemap: true
- clean: true
- external: react, react-dom
- treeshake: true

package.json:
- name: "@querydash/ui"
- main: ./dist/index.cjs
- module: ./dist/index.js
- types: ./dist/index.d.ts
- exports."." import/require/types 설정
- exports."./styles.css": ./dist/styles.css
- peerDependencies: react >=18, react-dom >=18

외부 사용 예시:
import { SQLEditor, SchemaTree, ChartRenderer, ParameterPanel, DataTable, DashboardGrid, Counter } from '@querydash/ui';
import '@querydash/ui/styles.css';

---

## 7. Docker Compose (전체 실행 환경)

services:
- web: Next.js (포트 3000)
- server: Hono API (포트 8000)
- worker: BullMQ 워커
- postgres: PostgreSQL 16 (포트 5432)
- redis: Redis 7 (포트 6379)

환경변수:
- DATABASE_URL: postgresql://querydash:querydash@postgres:5432/querydash
- REDIS_URL: redis://redis:6379
- JWT_SECRET: 환경변수로 주입

---

## 8. 구현 순서 (Phase별)

### Phase 1 - 코어 MVP
1. 모노레포 세팅 (pnpm workspace + Turborepo)
2. @querydash/types 패키지 (공유 타입)
3. @querydash/ui 패키지 기본 구조 + 디자인 토큰
4. SQLEditor 컴포넌트 (CodeMirror 6)
5. DataTable 컴포넌트 (TanStack Table)
6. 백엔드 기본 API (Hono + Drizzle)
7. 데이터소스 등록 + PostgreSQL 커넥터
8. 쿼리 실행 (동기 먼저) + 결과 표시
9. 쿼리 저장/불러오기

### Phase 2 - 시각화
10. ChartRenderer + ChartEditor 컴포넌트 (ECharts)
11. Line, Bar, Area, Pie 차트 구현
12. 차트 설정 탭 UI (General, X Axis, Y Axis, Series, Colors)
13. Scatter, Heatmap, Box Plot 추가
14. Counter 위젯
15. Pivot Table

### Phase 3 - 파라미터 + 비동기
16. ParameterPanel 컴포넌트 (파라미터 파서)
17. DatePicker, DateRange, Dropdown 파라미터
18. BullMQ 비동기 쿼리 실행 + 폴링
19. 쿼리 결과 캐싱

### Phase 4 - 대시보드
20. DashboardGrid (react-grid-layout)
21. 위젯 추가/제거/리사이즈
22. 대시보드 파라미터 필터
23. 자동 새로고침
24. 공유 링크 (public URL)

### Phase 5 - 고도화
25. MySQL, SQLite, BigQuery 커넥터 추가
26. SchemaTree 컴포넌트
27. 스케줄 실행 (cron)
28. 알림 (Alert)
29. 사용자 인증/권한
30. @querydash/ui npm 배포 설정

---

## 9. 기술 스택 요약

- 모노레포: pnpm workspace + Turborepo
- 프론트엔드: Next.js 14+ (App Router) + TypeScript
- 상태관리: Zustand
- SQL 에디터: CodeMirror 6 (@codemirror/lang-sql)
- 차트: Apache ECharts (echarts-for-react)
- 테이블: TanStack Table v8 + TanStack Virtual
- 대시보드 레이아웃: react-grid-layout
- 스타일링: Tailwind CSS + CSS Modules
- 백엔드: Node.js + Hono
- ORM: Drizzle ORM
- 큐: BullMQ + Redis
- 메타 DB: PostgreSQL
- 빌드(라이브러리): tsup
- 컨테이너: Docker + Docker Compose
- 패키지 매니저: pnpm

---

## 10. 중요 구현 규칙

1. 모든 UI 컴포넌트는 @querydash/ui 패키지에 작성하고, apps/web에서 import하여 사용한다.
2. @querydash/ui의 모든 컴포넌트는 독립적으로 사용 가능해야 한다 (앱 의존성 없이).
3. 스타일은 Tailwind CSS를 기본으로 하되, 디자인 토큰(tokens.ts)의 값을 tailwind.config에 연동한다.
4. 모든 컴포넌트에 TypeScript 타입을 완벽히 적용한다.
5. Redash의 UI/UX 흐름을 최대한 따른다: 쿼리 작성 -> 실행 -> 결과 테이블 -> 시각화 추가 -> 대시보드에 배치.
6. 파라미터 구문은 SQL 인젝션 방지를 위해 반드시 서버에서 parameterized query로 변환한다.
7. 차트 설정 변경시 저장 버튼 없이 실시간 프리뷰가 업데이트되어야 한다 (Redash 동작 방식).
8. 라이브러리 패키지(@querydash/ui)는 tree-shaking이 가능하도록 named export만 사용한다.

---

## 11. 쿼리 실행 안전장치 및 에러 핸들링

### 11-1. SQL 에러 피드백

쿼리 실행 시 DB에서 에러가 발생하면 사용자에게 명확한 에러 메시지를 보여준다.

에러 응답 형식:
{
  "status": "error",
  "error": {
    "code": "SYNTAX_ERROR",
    "message": "ERROR: syntax error at or near \"SELEC\"\nLINE 1: SELEC * FROM users\n        ^",
    "line": 1,
    "column": 1
  }
}

프론트엔드 에러 표시 규칙:
- 결과 패널에 빨간색 에러 박스로 DB 원본 에러 메시지를 그대로 표시
- 에러 메시지에서 LINE 번호를 파싱하여 SQL 에디터의 해당 줄에 빨간 밑줄 표시
- 에러 유형별 아이콘: 문법 에러, 권한 에러, 타임아웃, 연결 실패

주요 에러 유형 처리:
1. Syntax Error - DB 원본 메시지 표시 + 에디터에 에러 위치 하이라이팅
2. Permission Denied - "이 테이블에 대한 접근 권한이 없습니다" 안내
3. Table/Column Not Found - "테이블이 존재하지 않습니다" + 스키마 브라우저에서 유사한 테이블명 제안
4. Query Timeout - "쿼리 실행 시간이 초과되었습니다. 쿼리를 최적화하거나 관리자에게 제한 시간 변경을 요청하세요"
5. Connection Error - "데이터소스에 연결할 수 없습니다. 연결 설정을 확인해주세요"

### 11-2. 쿼리 실행 제한 (Rate Limiting & Resource Protection)

서버 과부하를 방지하기 위한 다층 제한을 구현한다.

사용자별 제한:
- maxConcurrentQueries: 3 (한 유저가 동시에 실행 가능한 쿼리 수)
- maxQueriesPerMinute: 30
- maxQueriesPerHour: 300
- maxResultRows: 100000
- maxResultSizeMB: 50
- queryTimeoutSeconds: 300

데이터소스별 제한:
- maxConcurrentQueries: 10 (이 DB에 동시에 날릴 수 있는 총 쿼리 수)
- queryTimeoutSeconds: 300
- maxConnectionPoolSize: 20

전체 시스템 제한:
- maxTotalConcurrentQueries: 50
- maxQueueSize: 100
- queueTimeoutSeconds: 120

제한 초과 시 동작:
- 동시 실행 초과: "현재 N개의 쿼리가 실행 중입니다. 완료될 때까지 기다려주세요." + 큐에 등록하고 순서 대기
- Rate Limit 초과: HTTP 429 응답 + "요청이 너무 많습니다. X초 후에 다시 시도해주세요." + Execute 버튼 임시 비활성화 + 남은 시간 카운트다운
- 결과 행 초과: maxResultRows까지만 반환 + "결과가 100,000행을 초과합니다. 처음 100,000행만 표시됩니다. LIMIT을 추가해주세요." 경고 배너
- 타임아웃: 쿼리 강제 취소 (pg_cancel_backend 등) + 타임아웃 에러 표시
- 큐 대기 초과: "서버가 바쁩니다. 잠시 후 다시 시도해주세요."

제한 설정 UI (관리자 페이지):
Settings > Query Execution 페이지에서 관리자가 위 값들을 설정할 수 있는 폼을 제공한다.
role별로 다른 제한:
- viewer: maxConcurrentQueries=1, queryTimeoutSeconds=60
- editor: maxConcurrentQueries=3, queryTimeoutSeconds=300
- admin: maxConcurrentQueries=10, queryTimeoutSeconds=600

구현 방식:
- Rate Limit: Redis의 sliding window counter 사용
- 동시 실행 제한: Redis에 유저별/데이터소스별 실행 중 카운터 관리
- 타임아웃: DB 레벨 statement_timeout 설정 + 서버 레벨 setTimeout으로 이중 보호
- 결과 크기: 스트리밍으로 row를 읽으며 카운트, 초과 시 조기 종료

### 11-3. 쿼리 실행 전 검증 (Pre-execution Validation)

쿼리를 DB에 보내기 전에 기본적인 검증을 수행한다.
1. 빈 쿼리 차단: 공백만 있는 쿼리 실행 방지
2. 위험 쿼리 경고: DROP, DELETE, TRUNCATE, ALTER 등 DDL/DML 감지 시 확인 모달 표시
3. 읽기 전용 모드: 데이터소스 설정에서 read_only=true 시 SELECT/WITH만 허용
4. 파라미터 미입력 검증: 파라미터가 있는데 값이 비어있으면 실행 차단 + 해당 입력필드 하이라이팅

### 11-4. 쿼리 실행 상태 표시 (프론트엔드)

Execute 버튼 클릭 후 상태를 실시간으로 표시:
- Queued: "대기 중... (앞에 N개 쿼리)" + 큐 위치 표시
- Running: "실행 중... (X.Xs 경과)" + 경과 시간 실시간 카운트 + Cancel 버튼 활성화
- Completed: "완료 (X.XXs) | N rows" + 결과 렌더링
- Failed: 에러 메시지 표시
- Cancelled: "쿼리가 취소되었습니다"

Cancel 버튼 클릭 시:
- 서버에 DELETE /api/jobs/:id 요청
- 서버가 DB에 쿼리 취소 명령 (PostgreSQL: pg_cancel_backend, MySQL: KILL QUERY)
- BullMQ job도 취소
---

## 12. 쿼리 결과 내보내기 (Export)

결과 테이블 우측 상단에 Download 드롭다운 버튼을 배치한다.

지원 포맷:
- CSV (.csv) - 서버 스트리밍 생성, 대용량 대응
- Excel (.xlsx) - exceljs 라이브러리 사용, 컬럼 타입/포맷 유지
- JSON (.json) - raw 데이터 그대로
- 클립보드 복사 - 탭 구분 텍스트, 엑셀에 바로 붙여넣기 가능

API:
- GET /api/queries/:id/result/export?format=csv
- GET /api/queries/:id/result/export?format=xlsx
- GET /api/queries/:id/result/export?format=json

Excel 상세:
- 첫 행은 컬럼 헤더 (bold 처리)
- 숫자 컬럼은 숫자 포맷 유지
- 날짜 컬럼은 날짜 포맷 적용
- 시트명은 쿼리 이름 사용
- 컬럼 너비 자동 조절 (autofit)

CSV 상세:
- UTF-8 BOM 포함 (한글 엑셀 호환)
- 대용량은 서버에서 스트리밍으로 생성

프론트엔드:
- 다운로드 중 로딩 스피너 표시
- 10만행 이상일 경우 "대용량 파일입니다. 다운로드에 시간이 걸릴 수 있습니다." 안내
---

이 명세에 따라 Phase 1부터 순서대로 구현을 시작해줘. 각 Phase의 모든 파일을 빠짐없이 작성하고, 실행 가능한 상태로 만들어줘.
