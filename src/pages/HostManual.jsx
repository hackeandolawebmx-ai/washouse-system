import ManualView from '../components/manual/ManualView';
import { manualSucursal } from '../data/manuals/sucursal';

export default function HostManual() {
    return <ManualView manual={manualSucursal} kicker="Sucursal · Manual" />;
}
