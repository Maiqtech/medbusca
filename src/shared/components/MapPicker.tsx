import React, { memo, useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import L from 'leaflet';

// Corrige ícones padrão do Leaflet com Vite/bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AddressResult {
  endereco: string;
  bairro: string;
}

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  onAddressFound?: (address: AddressResult) => void;
  disabled?: boolean;
}

function parseAddress(a: any): AddressResult {
  const rua = a?.road ?? a?.pedestrian ?? a?.footway ?? '';
  const numero = a?.house_number ? `, ${a.house_number}` : '';
  const bairro = a?.suburb ?? a?.neighbourhood ?? a?.quarter ?? a?.city_district ?? a?.district ?? '';
  return { endereco: rua ? `${rua}${numero}` : '', bairro };
}

// Div do mapa nunca re-renderiza — evita conflito React x Leaflet no DOM
const LeafletDiv = memo(
  ({ divRef }: { divRef: React.RefObject<HTMLDivElement> }) => (
    <div ref={divRef} style={{ height: '300px', width: '100%' }} />
  ),
  () => true
);

export default function MapPicker({ latitude, longitude, onChange, onAddressFound, disabled }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  // Inicializa o mapa uma vez
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: L.LatLngExpression = (latitude && longitude)
      ? [latitude, longitude]
      : [-12.9714, -38.5014]; // Salvador, BA

    const map = L.map(mapRef.current).setView(center, latitude ? 15 : 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (disabled) return;
      const { lat, lng } = e.latlng;
      const latNum = parseFloat(lat.toFixed(6));
      const lngNum = parseFloat(lng.toFixed(6));

      if (markerRef.current) {
        markerRef.current.setLatLng([latNum, lngNum]);
      } else {
        markerRef.current = L.marker([latNum, lngNum]).addTo(map);
      }

      onChange(latNum, lngNum);

      if (onAddressFound) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          const data = await res.json();
          onAddressFound(parseAddress(data.address));
        } catch { /* silencioso */ }
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Atualiza marcador e view quando lat/lng mudam via busca
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !latitude || !longitude) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
    }
    map.setView([latitude, longitude], 16);
  }, [latitude, longitude]);

  const buscarEndereco = async () => {
    if (!busca.trim()) return;
    setBuscando(true);
    setErroBusca(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busca)}&limit=1&countrycodes=br&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const data = await res.json();
      if (!data.length) {
        setErroBusca('Endereço não encontrado. Tente ser mais específico.');
        return;
      }
      const { lat, lon, address } = data[0];
      const latNum = parseFloat(parseFloat(lat).toFixed(6));
      const lngNum = parseFloat(parseFloat(lon).toFixed(6));
      onChange(latNum, lngNum);
      if (onAddressFound) onAddressFound(parseAddress(address));
    } catch {
      setErroBusca('Erro ao buscar endereço. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar endereço no mapa..."
            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarEndereco())}
            disabled={disabled || buscando}
          />
        </div>
        <button
          type="button"
          onClick={buscarEndereco}
          disabled={disabled || buscando || !busca.trim()}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
        >
          {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Buscar
        </button>
      </div>

      {erroBusca && (
        <p className="text-xs text-red-600 font-medium ml-1">{erroBusca}</p>
      )}

      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <LeafletDiv divRef={mapRef} />
        {!disabled && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-bold text-slate-600 shadow-md flex items-center gap-1.5">
              <MapPin size={12} className="text-blue-600" />
              Clique no mapa para marcar a localização
            </div>
          </div>
        )}
      </div>

      {latitude && longitude ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <Navigation size={14} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700">
            Localização definida: {latitude}, {longitude}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <MapPin size={14} className="text-amber-600 shrink-0" />
          <span className="text-xs font-bold text-amber-700">
            Busque o endereço ou clique no mapa para marcar.
          </span>
        </div>
      )}
    </div>
  );
}
