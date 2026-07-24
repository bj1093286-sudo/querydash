import { QueryPage } from '../../../components/query/QueryPage';

export default function QueryDetailPage({ params }: { params: { id: string } }) {
  return <QueryPage queryId={params.id} />;
}
