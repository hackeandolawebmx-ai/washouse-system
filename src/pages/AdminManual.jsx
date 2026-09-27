import ManualView from '../components/manual/ManualView';
import { manualAdmin } from '../data/manuals/admin';

export default function AdminManual() {
    return <ManualView manual={manualAdmin} kicker="Administración · Manual" />;
}
