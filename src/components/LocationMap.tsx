"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';
import LocationSearch from './LocationSearch';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Rectangle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Rectangle),
  { ssr: false }
);

// Create a client-only wrapper component
const ClientOnlyMap = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    // Import Leaflet CSS only on client side
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('leaflet/dist/leaflet.css');
    }
  }, []);
  
  if (!isClient) {
    return <div className="h-96 bg-gray-100 flex items-center justify-center">Loading map...</div>;
  }
  
  return <>{children}</>;
};

// Map controller component for navigation
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      // Check if map is ready by checking if it has a container
      const container = map.getContainer();
      if (container && container.style) {
        map.setView(center, zoom, { animate: true });
      } else {
        // If map isn't ready, wait a bit and try again
        const timer = setTimeout(() => {
          try {
            const container = map.getContainer();
            if (container && container.style) {
              map.setView(center, zoom, { animate: true });
            }
          } catch (error) {
            console.warn('Map still not ready for setView:', error);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.warn('Map not ready for setView:', error);
    }
  }, [map, center, zoom]);
  
  return null;
};

// Map click handler component - Disabled for region-only selection
const MapClickHandler = () => {
  // Point clicking is disabled - only region selection is supported
  return null;
};

// Define types for bounds and events
interface MapBounds {
  getSouth: () => number;
  getNorth: () => number;
  getWest: () => number;
  getEast: () => number;
}

interface LeafletMouseEvent {
  latlng: { lat: number; lng: number };
  originalEvent: Event;
}

// Custom region selector component
const CustomRegionSelector = ({ onBoundsChange, onSelectingChange }: { onBoundsChange: (bounds: MapBounds) => void; onSelectingChange?: (selecting: boolean) => void }) => {
  const map = useMap();
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const tempRectangleRef = useRef<L.Rectangle | null>(null);
  
  // Add visual feedback for dragging state and notify parent
  useEffect(() => {
    if (isSelecting) {
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = 'default';
    }
    
    // Notify parent component of selecting state
    onSelectingChange?.(isSelecting);
    
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isSelecting, onSelectingChange]);

  useEffect(() => {
    if (!map) return;

    const handleMouseDown = (e: LeafletMouseEvent) => {
      console.log('Mouse down:', e.latlng);
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      setIsSelecting(true);
      setStartPoint([e.latlng.lat, e.latlng.lng]);
      map.dragging.disable();
      // Prevent any click handlers from firing during region selection
      e.originalEvent.stopImmediatePropagation();
    };

    const handleMouseMove = (e: LeafletMouseEvent) => {
      if (!isSelecting || !startPoint) return;
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      
      const bounds = {
        getSouth: () => Math.min(startPoint[0], e.latlng.lat),
        getNorth: () => Math.max(startPoint[0], e.latlng.lat),
        getWest: () => Math.min(startPoint[1], e.latlng.lng),
        getEast: () => Math.max(startPoint[1], e.latlng.lng),
      };
      setCurrentBounds(bounds);
      
      // Update temporary rectangle for visual feedback
      if (tempRectangleRef.current) {
        map.removeLayer(tempRectangleRef.current);
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require('leaflet');
      const newTempRectangle = L.rectangle([
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()]
      ], {
        color: '#166534',
        fillColor: '#166534',
        fillOpacity: 0.2,
        weight: 2
      });
      newTempRectangle.addTo(map);
      tempRectangleRef.current = newTempRectangle;
    };

    const handleMouseUp = (e: LeafletMouseEvent) => {
      console.log('Mouse up:', e.latlng, 'isSelecting:', isSelecting, 'currentBounds:', currentBounds);
      if (isSelecting && currentBounds) {
        const dragDistance = Math.sqrt(
          Math.pow(e.latlng.lat - startPoint![0], 2) + 
          Math.pow(e.latlng.lng - startPoint![1], 2)
        );
        console.log('Drag distance:', dragDistance);
        if (dragDistance > 0.0001) { // Very small threshold to allow any meaningful drag
          console.log('Calling onBoundsChange');
          onBoundsChange(currentBounds);
        } else {
          console.log('Drag distance too small, not selecting region');
          // Prevent the click handler from firing by stopping propagation
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
      }
      // Remove temporary rectangle
      if (tempRectangleRef.current) {
        map.removeLayer(tempRectangleRef.current);
        tempRectangleRef.current = null;
      }
      map.dragging.enable();
      setIsSelecting(false);
      setStartPoint(null);
      setCurrentBounds(null);
    };

    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      if (tempRectangleRef.current) {
        map.removeLayer(tempRectangleRef.current);
      }
      map.dragging.enable();
    };
  }, [map, onBoundsChange, isSelecting, startPoint, currentBounds]);

  return null;
};

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onRegionSelect: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onSearchLocation?: (lat: number, lng: number, name: string) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({ onLocationSelect, onRegionSelect, onSearchLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<[number, number, number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.0, 10.0]);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fix Leaflet marker icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);



  const handleSearchLocation = (lat: number, lng: number, name: string) => {
    setMapCenter([lat, lng]);
    setMapZoom(10);
    setSelectedLocation([lat, lng]);
    setSelectedRegion(null);
    onLocationSelect(lat, lng);
    if (onSearchLocation) {
      onSearchLocation(lat, lng, name);
    }
  };

  const handleBoundsChange = (bounds: MapBounds) => {
    console.log('Region selected:', bounds);
    const region = [
      bounds.getNorth(),
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast()
    ] as [number, number, number, number];
    
    setSelectedRegion(region);
    setSelectedLocation(null);
    onRegionSelect({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
  };



  const clearSelection = () => {
    setSelectedLocation(null);
    setSelectedRegion(null);
    // Use coordinates that are clearly invalid/out of bounds to indicate no selection
    onLocationSelect(0, 0);
    onRegionSelect({ north: 0, south: 0, east: 0, west: 0 });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>

      
      <div className={`relative ${isFullscreen ? 'h-full w-full' : 'p-3'}`}>
        {!isFullscreen && <LocationSearch onLocationSelect={handleSearchLocation} />}
        <div 
          ref={mapContainerRef}
          className={`relative ${isFullscreen ? 'h-full w-full' : ''}`}
          style={isFullscreen ? { padding: 0 } : {}}
        >
          <ClientOnlyMap>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ 
                height: isFullscreen ? '100%' : '384px', 
                width: '100%',
                position: 'relative',
                zIndex: isFullscreen ? 1000 : 'auto'
              }}
              ref={mapRef}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapController center={mapCenter} zoom={mapZoom} />
              {selectedLocation && (
                <Marker position={selectedLocation} />
              )}
              {selectedRegion && (
                <Rectangle 
                  bounds={[
                    [selectedRegion[0], selectedRegion[1]],
                    [selectedRegion[2], selectedRegion[3]]
                  ]}
                  color="green"
                  fillColor="green"
                  fillOpacity={0.2}
                />
              )}
              
              {/* Custom Region Selector - Always enabled for drag selection */}
              <CustomRegionSelector 
                onBoundsChange={handleBoundsChange} 
              />
              <MapClickHandler />
            </MapContainer>
          </ClientOnlyMap>
          
          {/* Map control buttons */}
          <div className="absolute top-2 right-2 z-[1000] flex gap-2">
            {/* Clear selection button */}
            {selectedRegion && (
              <button
                onClick={clearSelection}
                className="bg-white hover:bg-gray-100 text-gray-700 rounded-md p-2 shadow-md border border-gray-200 transition-colors"
                title="Clear selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {/* Fullscreen toggle button */}
            <button
              onClick={toggleFullscreen}
              className="bg-white hover:bg-gray-100 text-gray-700 rounded-md p-2 shadow-md border border-gray-200 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {!isFullscreen && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedRegion ? (
              <p>🗺️ <strong>Selected region:</strong> {selectedRegion[0].toFixed(4)}°N to {selectedRegion[2].toFixed(4)}°N, {selectedRegion[1].toFixed(4)}°E to {selectedRegion[3].toFixed(4)}°E</p>
            ) : (
              <p>🗺️ <strong>Click and drag</strong> to select a region for forest impact analysis</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap; 