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

interface MapBounds {
  getSouth: () => number;
  getNorth: () => number;
  getWest: () => number;
  getEast: () => number;
}

const CustomRegionSelector = ({ onBoundsChange, onSelectingChange }: { onBoundsChange: (bounds: MapBounds) => void; onSelectingChange?: (selecting: boolean) => void }) => {
  const map = useMap();
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tempRectangleRef = useRef<any>(null);
  
  // Add visual feedback for dragging state and notify parent
  useEffect(() => {
    if (isSelecting) {
      document.body.style.cursor = 'crosshair';
      // Prevent text selection on mobile during dragging
      document.body.style.userSelect = 'none';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).webkitUserSelect = 'none';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).mozUserSelect = 'none';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).msUserSelect = 'none';
    } else {
      document.body.style.cursor = 'default';
      // Restore text selection
      document.body.style.userSelect = 'auto';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).webkitUserSelect = 'auto';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).mozUserSelect = 'auto';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).msUserSelect = 'auto';
    }
    
    // Notify parent component of selecting state
    onSelectingChange?.(isSelecting);
    
    return () => {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).webkitUserSelect = 'auto';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).mozUserSelect = 'auto';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.body.style as any).msUserSelect = 'auto';
    };
  }, [isSelecting, onSelectingChange]);

  useEffect(() => {
    if (!map) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseStart = (e: any) => {
      // Only activate selection if CTRL key is pressed
      if (!e.originalEvent.ctrlKey) {
        return; // Allow normal map panning
      }
      
      console.log('CTRL+Mouse start:', e.latlng);
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
      setIsSelecting(true);
      setStartPoint([e.latlng.lat, e.latlng.lng]);
      map.dragging.disable();
      e.originalEvent.stopImmediatePropagation();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTouchStart = (e: any) => {
      // For mobile devices, use click-to-create-square approach
      console.log('Touch start:', e.latlng);
      
      // Create a small initial selection square (0.01 degrees in each direction)
      const initialSize = 0.01;
      const centerLat = e.latlng.lat;
      const centerLng = e.latlng.lng;
      
      const bounds = {
        getSouth: () => centerLat - initialSize,
        getNorth: () => centerLat + initialSize,
        getWest: () => centerLng - initialSize,
        getEast: () => centerLng + initialSize,
      };
      
      console.log('Created initial selection square');
      setIsSelecting(true);
      setStartPoint([centerLat, centerLng]);
      setCurrentBounds(bounds);
      map.dragging.disable();
      
      // Create visual rectangle immediately
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (e: any) => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTouchMove = (e: any) => {
      if (!isSelecting || !startPoint) return;
      
      // Prevent default touch behavior during selection
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseEnd = (e: any) => {
      console.log('Mouse end:', e.latlng, 'isSelecting:', isSelecting, 'currentBounds:', currentBounds);
      if (isSelecting && currentBounds) {
        const dragDistance = Math.sqrt(
          Math.pow(e.latlng.lat - startPoint![0], 2) + 
          Math.pow(e.latlng.lng - startPoint![1], 2)
        );
        console.log('Drag distance:', dragDistance);
        if (dragDistance > 0.0001) {
          console.log('Calling onBoundsChange');
          onBoundsChange(currentBounds);
        } else {
          console.log('Drag distance too small, not selecting region');
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTouchEnd = (e: any) => {
      console.log('Touch end:', e.latlng, 'isSelecting:', isSelecting, 'currentBounds:', currentBounds);
      
      if (isSelecting && currentBounds) {
        // For mobile, always confirm the selection since we created it with a tap
        console.log('Confirming mobile selection');
        onBoundsChange(currentBounds);
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

    // Add mouse events for desktop
    map.on('mousedown', handleMouseStart);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseEnd);
    
    // Add touch events for mobile
    map.on('touchstart', handleTouchStart);
    map.on('touchmove', handleTouchMove);
    map.on('touchend', handleTouchEnd);
    
    // Also add click event for mobile as fallback
    map.on('click', (e: any) => {
      // Only handle clicks on mobile devices (no CTRL key)
      if (!e.originalEvent.ctrlKey && 'ontouchstart' in window) {
        console.log('Mobile click detected:', e.latlng);
        handleTouchStart(e);
      }
    });

    return () => {
      map.off('mousedown', handleMouseStart);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseEnd);
      map.off('touchstart', handleTouchStart);
      map.off('touchmove', handleTouchMove);
      map.off('touchend', handleTouchEnd);
      map.off('click');
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([54.0, 15.0]);
  const [mapZoom, setMapZoom] = useState<number>(4);
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"> 
      <div className="relative p-3">
        <LocationSearch onLocationSelect={handleSearchLocation} />
        <div 
          ref={mapContainerRef}
          className="relative"
        >
          <ClientOnlyMap>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ 
                height: '384px', 
                width: '100%',
                position: 'relative',
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
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {selectedRegion ? (
            <p>🗺️ <strong>Selected region:</strong> {selectedRegion[0].toFixed(4)}°N to {selectedRegion[2].toFixed(4)}°N, {selectedRegion[1].toFixed(4)}°E to {selectedRegion[3].toFixed(4)}°E</p>
          ) : (
            <p>🗺️ Select a region for forest impact analysis</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationMap; 