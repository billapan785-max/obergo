import React, { useEffect, useState, useMemo, Component, ReactNode, ErrorInfo } from 'react';

// Local Error Boundary to catch Google Maps crashes (e.g. AdvancedMarker Illegal constructor)
class MapErrorBoundary extends Component<{children: ReactNode, onError: () => void}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Map rendering error:", error, errorInfo);
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MapContainer, TileLayer, Marker, Polyline, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bid } from './types';
import { Navigation, MapPin, Key, ExternalLink } from 'lucide-react';

interface LiveMapProps {
  customerAvatar?: string;
  workerAvatar?: string;
  isWorker?: boolean;
  customerLocation?: [number, number];
  workerLocation?: [number, number];
  biddingWorkers?: Bid[];
}

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.GOOGLE_MAPS_PLATFORM_KEY) return process.env.GOOGLE_MAPS_PLATFORM_KEY;
    if (process.env.GOOGLE_MAPS_PLAT) return process.env.GOOGLE_MAPS_PLAT;
    if (process.env.GOOGLE_MAPS_API_KEY) return process.env.GOOGLE_MAPS_API_KEY;
    if (process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY) return process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY;
    if (process.env.VITE_GOOGLE_MAPS_PLAT) return process.env.VITE_GOOGLE_MAPS_PLAT;
  }
  const metaEnv = (import.meta as any).env;
  if (metaEnv) {
    if (metaEnv.VITE_GOOGLE_MAPS_PLATFORM_KEY) return metaEnv.VITE_GOOGLE_MAPS_PLATFORM_KEY;
    if (metaEnv.VITE_GOOGLE_MAPS_PLAT) return metaEnv.VITE_GOOGLE_MAPS_PLAT;
    if (metaEnv.VITE_GOOGLE_MAPS_API_KEY) return metaEnv.VITE_GOOGLE_MAPS_API_KEY;
  }
  if ((globalThis as any).GOOGLE_MAPS_PLATFORM_KEY) return (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY;
  return '';
};

const API_KEY = getApiKey();
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim().length > 5;

// Default locations in Islamabad / Lahore, Pakistan
const defaultCustomerLoc: [number, number] = [33.6844, 73.0479];
const defaultWorkerLoc: [number, number] = [33.6900, 73.0550];

// Leaflet fallback custom icons
const createCustomIcon = (avatarUrl?: string, color: string = '#22c55e', label: string = 'User') => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 44px; height: 44px; background: ${color}; opacity: 0.25; border-radius: 50%; animation: pulse 2s infinite ease-in-out;"></div>
        <div style="width: 38px; height: 38px; background: white; border-radius: 50%; border: 3px solid ${color}; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 2;">
          ${avatarUrl ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="width: 100%; height: 100%; background: ${color};"></div>`}
        </div>
        <div style="position: absolute; bottom: -18px; background: #0f172a; color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 10px; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 3;">
          ${label}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0.1; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }
      </style>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

// Calculate Haversine distance in KM
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateRouteWaypoints(start: [number, number], end: [number, number]): [number, number][] {
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  const offsetLat = (end[1] - start[1]) * 0.15;
  const offsetLng = (start[0] - end[0]) * 0.15;

  return [
    start,
    [start[0] + (midLat - start[0]) * 0.5 + offsetLat, start[1] + (midLng - start[1]) * 0.5 + offsetLng],
    [midLat + (end[0] - midLat) * 0.5 - offsetLat, midLng + (end[1] - midLng) * 0.5 - offsetLng],
    end,
  ];
}

// Leaflet auto bounds helper
function LeafletMapAutoBounds({ workerLoc, customerLoc }: { workerLoc: [number, number]; customerLoc: [number, number] }) {
  const map = useLeafletMap();
  useEffect(() => {
    if (workerLoc && customerLoc) {
      try {
        const bounds = L.latLngBounds([workerLoc, customerLoc]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
      } catch (err) {}
    }
  }, [workerLoc[0], workerLoc[1], customerLoc[0], customerLoc[1], map]);
  return null;
}

// Google Maps Polyline Component
function GoogleMapPolyline({ path, color = '#3b82f6' }: { path: { lat: number; lng: number }[]; color?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2) return;
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 6,
    });
    polyline.setMap(map);
    return () => polyline.setMap(null);
  }, [map, path, color]);
  return null;
}

export function LiveMap({ customerAvatar, workerAvatar, isWorker, customerLocation, workerLocation, biddingWorkers }: LiveMapProps) {
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const [isKeyError, setIsKeyError] = useState(false);

  // Catch Google Maps authentication failure (e.g., API key not enabled in GCP or invalid)
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps authentication failed. Falling back to Leaflet OpenStreetMap.');
      setIsKeyError(true);
    };
  }, []);

  const initialCustomerLoc = useMemo<[number, number]>(() => {
    if (customerLocation) return customerLocation;
    return defaultCustomerLoc;
  }, [customerLocation]);

  const initialWorkerLoc = useMemo<[number, number]>(() => {
    if (workerLocation) return workerLocation;
    if (customerLocation) return [customerLocation[0] + 0.003, customerLocation[1] + 0.003];
    return defaultWorkerLoc;
  }, [workerLocation, customerLocation]);

  const [workerLoc, setWorkerLoc] = useState<[number, number]>(initialWorkerLoc);
  const [customerLoc, setCustomerLoc] = useState<[number, number]>(initialCustomerLoc);

  const bidderLocations = useMemo(() => {
    if (!biddingWorkers || biddingWorkers.length === 0) return [];
    return biddingWorkers.map((bid, index) => {
      const angle = (index * 137.5) * (Math.PI / 180);
      const distance = 0.005 + (index * 0.002);
      return {
        ...bid,
        lat: customerLoc[0] + Math.cos(angle) * distance,
        lng: customerLoc[1] + Math.sin(angle) * distance,
      };
    });
  }, [biddingWorkers, customerLoc]);

  useEffect(() => {
    if (workerLocation) setWorkerLoc(workerLocation);
  }, [workerLocation]);

  useEffect(() => {
    if (customerLocation) setCustomerLoc(customerLocation);
  }, [customerLocation]);

  const hasAssignedWorker = Boolean(workerAvatar && (!biddingWorkers || biddingWorkers.length === 0));
  const showWorkerAndRoute = Boolean(hasAssignedWorker || isWorker);

  const distKm = useMemo(() => {
    if (!showWorkerAndRoute) return 0;
    return getDistanceKm(workerLoc[0], workerLoc[1], customerLoc[0], customerLoc[1]);
  }, [workerLoc, customerLoc, showWorkerAndRoute]);

  const etaMins = useMemo(() => {
    if (distKm <= 0.05) return 'Arrived';
    const mins = Math.max(1, Math.round((distKm / 25) * 60));
    return `${mins} min${mins > 1 ? 's' : ''}`;
  }, [distKm]);

  const routeWaypoints = useMemo(() => {
    if (!showWorkerAndRoute) return [];
    return generateRouteWaypoints(workerLoc, customerLoc);
  }, [workerLoc, customerLoc, showWorkerAndRoute]);

  const googlePath = useMemo(() => {
    return routeWaypoints.map(([lat, lng]) => ({ lat, lng }));
  }, [routeWaypoints]);

  return (
    <div className="relative w-full h-full">
      {/* Top GPS Floating Banner */}
      {showWorkerAndRoute && (
        <div className="absolute top-3 left-3 right-3 z-[1000] bg-gray-900/90 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-gray-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <div>
              <p className="font-bold text-gray-100 flex items-center gap-1">
                <Navigation size={12} className="text-blue-400" /> Live GPS Tracking
              </p>
              <p className="text-[10px] text-gray-400">
                {distKm <= 0.05 ? 'At location' : 'En route / Active navigation'}
              </p>
            </div>
          </div>

          <div className="text-right bg-gray-800/80 px-2.5 py-1 rounded-xl border border-gray-700/50">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{etaMins}</p>
            <p className="text-[11px] font-mono text-gray-200">{distKm > 0.05 ? `${distKm.toFixed(1)} km` : '0.0 km'}</p>
          </div>
        </div>
      )}

      {/* Banner if Google Maps API key is missing or had error */}
      {(!hasValidKey || isKeyError) && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 dark:bg-gray-900/95 p-3 rounded-2xl shadow-2xl border border-yellow-500/30 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-yellow-700 dark:text-yellow-400">
              <Key size={14} />
              <span>{isKeyError ? 'Google Maps API Error (Maps JS API Not Enabled)' : 'Enable 3D Google Maps View'}</span>
            </div>
            <button 
              onClick={() => setShowKeyInfo(!showKeyInfo)} 
              className="text-[10px] bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-lg font-bold"
            >
              {showKeyInfo ? 'Hide Details' : 'How to Fix?'}
            </button>
          </div>

          {isKeyError && (
            <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
              Your Google Maps Key was detected, but Google Cloud returned an error. We switched to <strong>OpenStreetMap</strong> automatically so your app keeps working!
            </p>
          )}

          {showKeyInfo && (
            <div className="text-[11px] text-gray-600 dark:text-gray-300 space-y-1.5 pt-1 border-t border-gray-200 dark:border-gray-800">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                To fix this error in Google Cloud Console:
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-gray-600 dark:text-gray-400">
                <li>Go to <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5 font-bold">Google Cloud Console → Maps JavaScript API <ExternalLink size={10} /></a></li>
                <li>Click <strong>ENABLE</strong> button for your project.</li>
                <li>Make sure Billing is enabled on your GCP account (Google provides $200 free credit monthly).</li>
                <li>In AI Studio Secrets: save key as <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-green-600 font-mono">GOOGLE_MAPS_PLATFORM_KEY</code></li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Render Google Maps if valid key and no auth error, else OpenStreetMap Leaflet fallback */}
      {hasValidKey && !isKeyError ? (
        <MapErrorBoundary onError={() => setIsKeyError(true)}>
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={{ lat: customerLoc[0], lng: customerLoc[1] }}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={true}
            >
              {/* Route line */}
              {showWorkerAndRoute && googlePath.length > 1 && (
                <GoogleMapPolyline path={googlePath} color="#3b82f6" />
              )}

              {/* Customer Marker */}
              <AdvancedMarker position={{ lat: customerLoc[0], lng: customerLoc[1] }}>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-10 h-10 bg-green-500/30 rounded-full animate-ping" />
                  <div className="w-9 h-9 bg-white rounded-full border-2 border-green-500 overflow-hidden shadow-lg flex items-center justify-center z-10">
                    {customerAvatar ? (
                      <img src={customerAvatar} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-green-500 flex items-center justify-center text-white font-bold text-xs">
                        <MapPin size={16} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-4 bg-slate-900 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow z-20">
                    {isWorker ? 'Customer' : 'You'}
                  </div>
                </div>
              </AdvancedMarker>

              {/* Worker Marker */}
              {showWorkerAndRoute && (
                <AdvancedMarker position={{ lat: workerLoc[0], lng: workerLoc[1] }}>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-10 h-10 bg-blue-500/30 rounded-full animate-ping" />
                    <div className="w-9 h-9 bg-white rounded-full border-2 border-blue-500 overflow-hidden shadow-lg flex items-center justify-center z-10">
                      {workerAvatar ? (
                        <img src={workerAvatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                          W
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-4 bg-slate-900 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow z-20">
                      {isWorker ? 'You (Worker)' : 'Worker'}
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Bidding workers */}
              {bidderLocations.map((bidder) => (
                <AdvancedMarker key={bidder.id} position={{ lat: bidder.lat, lng: bidder.lng }}>
                  <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-500 overflow-hidden shadow flex items-center justify-center z-10">
                      {bidder.workerAvatar ? (
                        <img src={bidder.workerAvatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {bidder.workerName.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-4 bg-slate-900 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow z-20">
                      {bidder.workerName.split(' ')[0]}
                    </div>
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        </MapErrorBoundary>
      ) : (
        <MapContainer
          center={isWorker ? workerLoc : customerLoc}
          zoom={14}
          style={{ width: '100%', height: '100%', zIndex: 10 }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {showWorkerAndRoute && <LeafletMapAutoBounds workerLoc={workerLoc} customerLoc={customerLoc} />}

          {showWorkerAndRoute && routeWaypoints.length > 0 && (
            <Polyline
              positions={routeWaypoints}
              pathOptions={{ color: '#1e40af', weight: 8, opacity: 0.35, lineCap: 'round', lineJoin: 'round' }}
            />
          )}

          {showWorkerAndRoute && routeWaypoints.length > 0 && (
            <Polyline
              positions={routeWaypoints}
              pathOptions={{ color: '#3b82f6', weight: 5, dashArray: '8, 8', lineCap: 'round', lineJoin: 'round' }}
            />
          )}

          <Marker 
            position={customerLoc} 
            icon={createCustomIcon(customerAvatar, '#22c55e', isWorker ? 'Customer Location' : 'You')} 
          />
          
          {showWorkerAndRoute && (
            <Marker 
              position={workerLoc} 
              icon={createCustomIcon(workerAvatar, '#3b82f6', isWorker ? 'You (Worker)' : 'Worker')} 
            />
          )}

          {bidderLocations.map((bidder) => (
            <Marker 
              key={bidder.id} 
              position={[bidder.lat, bidder.lng]} 
              icon={createCustomIcon(bidder.workerAvatar, '#3b82f6', bidder.workerName.split(' ')[0])} 
            />
          ))}
        </MapContainer>
      )}
    </div>
  );
}
