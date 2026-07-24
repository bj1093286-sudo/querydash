import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-4 text-xl font-semibold text-qd-neutral-800">QueryDash에 오신 것을 환영합니다</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/queries/new"
          className="rounded-qd-md border border-qd-neutral-200 bg-white p-4 shadow-qd-card hover:border-qd-primary-300"
        >
          <div className="font-medium text-qd-neutral-800">새 쿼리</div>
          <p className="text-sm text-qd-neutral-500">SQL을 작성하고 실행하세요.</p>
        </Link>
        <Link
          href="/datasources/new"
          className="rounded-qd-md border border-qd-neutral-200 bg-white p-4 shadow-qd-card hover:border-qd-primary-300"
        >
          <div className="font-medium text-qd-neutral-800">데이터소스 연결</div>
          <p className="text-sm text-qd-neutral-500">PostgreSQL, MySQL 데이터소스를 등록하세요.</p>
        </Link>
        <Link
          href="/queries"
          className="rounded-qd-md border border-qd-neutral-200 bg-white p-4 shadow-qd-card hover:border-qd-primary-300"
        >
          <div className="font-medium text-qd-neutral-800">쿼리 둘러보기</div>
          <p className="text-sm text-qd-neutral-500">저장된 쿼리를 확인하세요.</p>
        </Link>
      </div>
    </div>
  );
}
