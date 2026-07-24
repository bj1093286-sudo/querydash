import { DashboardView } from '../../../components/dashboard/DashboardView';

export default function DashboardDetailPage({ params }: { params: { id: string } }) {
  return <DashboardView dashboardId={params.id} />;
}
