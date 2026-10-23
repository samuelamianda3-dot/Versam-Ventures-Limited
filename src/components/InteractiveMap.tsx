import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Order } from '../types';
import { Navigation, Store, MapPin, Compass, Layers, Maximize2, Bike } from 'lucide-react';

interface InteractiveMapProps {
  order: Order;
  autoCenter?: boolean;
}

type MapTheme = 'dark' | 'voyager' | 'osm';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ order, autoCenter = true }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [followCourier, setFollowCourier] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const initialCenter = order.courier?.currentCoords || order.restaurant.coords;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrls: Record<MapTheme, { url: string; subdomains: string }> = {
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        subdomains: 'abcd',
      },
      voyager: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        subdomains: 'abcd',
      },
      osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: 'abc',
      },
    };

    const currentTileConfig = tileUrls[mapTheme];
    const tiles = L.tileLayer(currentTileConfig.url, {
      maxZoom: 19,
      subdomains: currentTileConfig.subdomains,
    }).addTo(map);

    tileLayerRef.current = tiles;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when theme changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    mapRef.current.removeLayer(tileLayerRef.current);

    const tileUrls: Record<MapTheme, { url: string; subdomains: string }> = {
      dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        subdomains: 'abcd',
      },
      voyager: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        subdomains: 'abcd',
      },
      osm: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: 'abc',
      },
    };

    const config = tileUrls[mapTheme];
    const newTiles = L.tileLayer(config.url, {
      maxZoom: 19,
      subdomains: config.subdomains,
    }).addTo(mapRef.current);

    tileLayerRef.current = newTiles;
  }, [mapTheme]);

  // Update Route Polylines and Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const route = order.routeCoords;
    const currentIndex = order.currentRouteIndex;

    // 1. Full/Remaining Route Polyline (dashed cyan/neutral)
    if (route && route.length > 0) {
      if (!routePolylineRef.current) {
        routePolylineRef.current = L.polyline(route, {
          color: '#38bdf8',
          weight: 4,
          opacity: 0.6,
          dashArray: '6, 8',
          lineCap: 'round',
        }).addTo(map);
      } else {
        routePolylineRef.current.setLatLngs(route);
      }

      // 2. Completed Trail Polyline (solid vibrant emerald green)
      const completedCoords = route.slice(0, Math.max(1, currentIndex + 1));
      if (!completedPolylineRef.current) {
        completedPolylineRef.current = L.polyline(completedCoords, {
          color: '#10b981',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        completedPolylineRef.current.setLatLngs(completedCoords);
      }
    }

    // 3. Restaurant Marker
    const restaurantHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-2 border-neutral-900 font-bold transition-transform hover:scale-110">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7M4 7V4h16v3M6 21V11m12 10V11"/></svg>
        </div>
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900/90 text-[11px] font-medium text-neutral-200 px-2 py-0.5 rounded border border-neutral-700/60 shadow-md">
          ${order.restaurant.name}
        </div>
      </div>
    `;

    const restaurantIcon = L.divIcon({
      html: restaurantHtml,
      className: 'custom-restaurant-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!restaurantMarkerRef.current) {
      restaurantMarkerRef.current = L.marker(order.restaurant.coords, { icon: restaurantIcon }).addTo(map);
      restaurantMarkerRef.current.bindPopup(`
        <div class="p-1">
          <p class="font-semibold text-sm text-neutral-100">${order.restaurant.name}</p>
          <p class="text-xs text-neutral-400 mt-0.5">${order.restaurant.address}</p>
          <p class="text-xs text-emerald-400 font-medium mt-1">${order.restaurant.cuisine} · Prep ~${order.restaurant.prepTimeAvgMin}m</p>
        </div>
      `);
    } else {
      restaurantMarkerRef.current.setLatLng(order.restaurant.coords);
    }

    // 4. Delivery Destination Marker
    const destinationHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-xl bg-green-500 text-neutral-950 flex items-center justify-center shadow-lg shadow-green-500/30 border-2 border-neutral-900 font-bold transition-transform hover:scale-110">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900/90 text-[11px] font-medium text-neutral-200 px-2 py-0.5 rounded border border-neutral-700/60 shadow-md">
          Destination
        </div>
      </div>
    `;

    const destinationIcon = L.divIcon({
      html: destinationHtml,
      className: 'custom-destination-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker(order.deliveryCoords, { icon: destinationIcon }).addTo(map);
      destinationMarkerRef.current.bindPopup(`
        <div class="p-1">
          <p class="font-semibold text-sm text-neutral-100">Delivery Address</p>
          <p class="text-xs text-neutral-400 mt-0.5">${order.deliveryAddress}</p>
          <p class="text-xs text-neutral-300 mt-1 italic">${order.deliveryInstructions}</p>
        </div>
      `);
    } else {
      destinationMarkerRef.current.setLatLng(order.deliveryCoords);
    }

    // 5. Courier Marker: Custom Bike with Bag at Courier icon & dynamic rotation
    if (order.courier) {
      const courier = order.courier;
      const isDelivered = order.status === 'delivered';
      const courierHtml = `
        <div class="relative flex items-center justify-center">
          ${!isDelivered ? '<div class="absolute -inset-3.5 rounded-full bg-emerald-400/25 pulse-beacon pointer-events-none"></div>' : ''}
          <div class="w-12 h-12 rounded-full bg-neutral-950 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 border-2 border-emerald-400 ring-2 ring-emerald-500/40 relative z-10 transition-transform">
            <div style="transform: rotate(${courier.heading}deg);" class="transition-transform duration-300 flex items-center justify-center">
              <!-- Bike with courier bag SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-8 h-8" fill="none">
                <circle cx="11" cy="33" r="6" stroke="#ffffff" stroke-width="2.5"/>
                <circle cx="37" cy="33" r="6" stroke="#ffffff" stroke-width="2.5"/>
                <path d="M11 33l11 0-3-11-8 11zm11 0l11-12h4m-4 0l4 12" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
                <!-- Courier thermal bag on rear rack -->
                <rect x="7" y="14" width="10" height="10" rx="2" fill="#10b981" stroke="#047857" stroke-width="1.2"/>
                <line x1="8.5" y1="19" x2="15.5" y2="19" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="1.5, 1"/>
                <!-- Handlebars -->
                <line x1="33" y1="21" x2="34.5" y2="15" stroke="#ffffff" stroke-width="2"/>
                <path d="M32 15h5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900/95 text-[11px] font-semibold text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40 shadow-lg flex items-center gap-1.5">
            <span>${courier.name.split(' ')[0]}</span>
            <span class="text-neutral-500">·</span>
            <span class="text-neutral-200">${courier.speedKmh} km/h</span>
          </div>
        </div>
      `;

      const courierIcon = L.divIcon({
        html: courierHtml,
        className: 'custom-courier-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      if (!courierMarkerRef.current) {
        courierMarkerRef.current = L.marker(courier.currentCoords, { icon: courierIcon, zIndexOffset: 1000 }).addTo(map);
      } else {
        courierMarkerRef.current.setLatLng(courier.currentCoords);
        courierMarkerRef.current.setIcon(courierIcon);
      }

      if (followCourier && autoCenter) {
        map.panTo(courier.currentCoords, { animate: true, duration: 0.8 });
      }
    }
  }, [order.currentRouteIndex, order.courier?.currentCoords, order.courier?.heading, order.status, followCourier, autoCenter]);

  // Handler to fit all markers in view
  const fitAllBounds = () => {
    const map = mapRef.current;
    if (!map) return;
    const points: [number, number][] = [order.restaurant.coords, order.deliveryCoords];
    if (order.courier?.currentCoords) {
      points.push(order.courier.currentCoords);
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    setFollowCourier(false);
  };

  const centerOnCourier = () => {
    if (!mapRef.current || !order.courier) return;
    mapRef.current.setView(order.courier.currentCoords, 16, { animate: true });
    setFollowCourier(true);
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Map HUD overlay */}
      <div className="absolute top-4 left-4 right-4 z-[500] pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left Telemetry Card */}
        <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-800/80 rounded-xl px-3.5 py-2.5 shadow-xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">Live GPS</span>
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-neutral-400">ETA</span>
            <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
              {order.status === 'delivered' ? '0 min' : `${order.etaMinutes} min`}
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-neutral-400">Remaining</span>
            <span className="text-sm font-semibold font-mono text-neutral-200 tabular-nums">
              {order.status === 'delivered' ? '0 km' : `${order.distanceRemainingKm} km`}
            </span>
          </div>
        </div>

        {/* Right Map Toolbar Controls */}
        <div className="pointer-events-auto flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-800/80 rounded-xl p-1 shadow-xl">
          <button
            onClick={centerOnCourier}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              followCourier
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title="Focus courier on map"
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Follow</span>
          </button>

          <button
            onClick={fitAllBounds}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            title="View entire route"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit Route</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 my-1" />

          {/* Theme switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                mapTheme === 'dark' ? 'bg-neutral-800 text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapTheme('voyager')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                mapTheme === 'voyager' ? 'bg-neutral-800 text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => setMapTheme('osm')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                mapTheme === 'osm' ? 'bg-neutral-800 text-emerald-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              OSM
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 z-[500] pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-800/80 rounded-xl px-3 py-2 shadow-xl flex items-center gap-3 text-xs text-neutral-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Kitchen: {order.restaurant.name.split(' ')[0]}</span>
        </div>
        <span className="text-neutral-600">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Versam Courier</span>
        </div>
        <span className="text-neutral-600">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Delivery Destination</span>
        </div>
      </div>
    </div>
  );
};
