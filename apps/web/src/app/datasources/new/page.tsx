import { DataSourceForm } from '../../../components/datasource/DataSourceForm';

export default function NewDataSourcePage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-4 text-xl font-semibold text-qd-neutral-800">새 데이터소스</h1>
      <DataSourceForm />
    </div>
  );
}
