import { DeviceHardware } from './DeviceHardware';
import type { Device } from './repository';

export function HardwareGallery({ devices, onOpen }: { devices: Device[]; onOpen: (id: string) => void }) {
  return <section className="hardware-gallery" aria-label="Vistas del hardware del estudio">
    <h2>Equipos del estudio</h2>
    <p>Vistas superiores de referencia. La ficha conserva el estado registrado de cada equipo.</p>
    <ul>{devices.map(device => <li key={device.id}>
      <button onClick={() => onOpen(device.id)} aria-label={`Abrir ficha de ${device.title}`}>
        <DeviceHardware id={device.id} title={device.title} compact />
        <strong>{device.title}</strong>
        {device.id === 'fm1-nrpn-test' && <span>Unidad A/B pendiente · referencia de ensayo</span>}
      </button>
    </li>)}</ul>
  </section>;
}
