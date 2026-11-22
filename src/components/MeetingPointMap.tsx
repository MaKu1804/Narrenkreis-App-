import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface MeetingPointMapProps {
  coordinates: { lat: number; lng: number };
  locationName?: string;
  meetingPointDetails?: string;
  isPicker?: boolean;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  height?: string;
  allExcursions?: Array<{
    id: string;
    title: string;
    coordinates: { lat: number; lng: number };
    date: string;
    locationName: string;
  }>;
  onSelectExcursion?: (id: string) => void;
}

export const MeetingPointMap: React.FC<MeetingPointMapProps> = ({
  coordinates,
  locationName = 'Treffpunkt',
  meetingPointDetails,
  isPicker = false,
  onCoordinatesChange,
  className = '',
  height = '320px',
  allExcursions,
  onSelectExcursion
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Custom SVG marker pin
  const createPinIcon = (color: string = '#0284c7', label?: string) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            background: ${color};
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
          ${label ? `<span style="margin-top: 4px; font-size: 11px; font-weight: 600; background: white; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); white-space: nowrap; border: 1px solid #e2e8f0;">${label}</span>` : ''}
        </div>
      `,
      iconSize: [34, 48],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [coordinates.lat, coordinates.lng],
      zoom: 13,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Layer group for all markers
    const group = L.layerGroup().addTo(map);
    markersGroupRef.current = group;

    if (allExcursions && allExcursions.length > 0) {
      // Multiple markers
      const bounds = L.latLngBounds([]);
      allExcursions.forEach(exc => {
        const m = L.marker([exc.coordinates.lat, exc.coordinates.lng], {
          icon: createPinIcon('#0284c7', exc.title.slice(0, 18) + '...')
        });
        m.bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <strong style="color: #0f172a; font-size: 14px;">${exc.title}</strong><br/>
            <span style="color: #64748b;">📅 ${exc.date} · 📍 ${exc.locationName}</span>
          </div>
        `);
        m.on('click', () => {
          if (onSelectExcursion) onSelectExcursion(exc.id);
        });
        m.addTo(group);
        bounds.extend([exc.coordinates.lat, exc.coordinates.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } else {
      // Single main marker
      const marker = L.marker([coordinates.lat, coordinates.lng], {
        icon: createPinIcon(isPicker ? '#e11d48' : '#0284c7'),
        draggable: isPicker
      }).addTo(map);

      markerRef.current = marker;

      if (locationName) {
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <strong style="color: #0f172a; font-size: 14px;">${locationName}</strong>
            ${meetingPointDetails ? `<p style="margin: 4px 0 0; color: #475569;">${meetingPointDetails}</p>` : ''}
            <div style="margin-top: 6px; font-size: 11px; color: #94a3b8; font-family: monospace;">
              ${coordinates.lat.toFixed(4)}° N, ${coordinates.lng.toFixed(4)}° E
            </div>
          </div>
        `);
      }

      if (isPicker) {
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          if (onCoordinatesChange) {
            onCoordinatesChange({ lat: latlng.lat, lng: latlng.lng });
          }
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          if (onCoordinatesChange) {
            onCoordinatesChange({ lat: e.latlng.lat, lng: e.latlng.lng });
          }
        });
      }
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync coordinates when updated externally
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
    }
    mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 13);
  }, [coordinates.lat, coordinates.lng]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 ${className}`}>
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />
      
      {/* Top right location badge */}
      <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/80 flex items-center gap-2 text-xs font-medium text-slate-700">
        <MapPin className="w-3.5 h-3.5 text-sky-600" />
        <span className="font-mono tabular-nums">{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
        <a 
          href={googleMapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-sky-600 transition-colors ml-1"
          title="In Google Maps öffnen"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {isPicker && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/90 text-white text-xs px-3 py-2 rounded-lg flex items-center justify-between backdrop-blur-sm shadow-md">
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-rose-400" />
            Klicken oder Marker ziehen, um genauen Treffpunkt festzulegen
          </span>
          <span className="text-slate-300 font-mono tabular-nums">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};
