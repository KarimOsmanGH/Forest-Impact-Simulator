/**
 * Utilities for creating shareable links with encoded analysis parameters
 */

export interface ShareableState {
  mode: 'planting' | 'clear-cutting';
  latitude?: number;
  longitude?: number;
  region?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  years: number;
  calculationMode: 'perTree' | 'perArea';
  averageTreeAge?: number;
  treeIds: string[]; // Store only IDs, not full tree objects
  treePercentages: { [key: string]: number };
}

// Compact state representation for URL encoding
interface CompactState {
  m: 0 | 1; // mode: 0=planting, 1=clear-cutting
  lat?: number;
  lon?: number;
  r?: number[]; // region as [n,s,e,w]
  y: number; // years
  c: 0 | 1; // calculationMode: 0=perTree, 1=perArea
  a?: number; // averageTreeAge
  t: string[]; // treeIds
  p: { [key: string]: number }; // treePercentages (only non-zero)
}

/**
 * Convert ShareableState to compact representation
 */
function toCompactState(state: ShareableState): CompactState {
  const compact: CompactState = {
    m: state.mode === 'planting' ? 0 : 1,
    y: state.years,
    c: state.calculationMode === 'perTree' ? 0 : 1,
    t: state.treeIds,
    p: {}
  };
  
  // Round coordinates to 4 decimals to save space
  if (state.latitude !== undefined) compact.lat = Math.round(state.latitude * 10000) / 10000;
  if (state.longitude !== undefined) compact.lon = Math.round(state.longitude * 10000) / 10000;
  
  // Compact region representation
  if (state.region) {
    compact.r = [
      Math.round(state.region.north * 10000) / 10000,
      Math.round(state.region.south * 10000) / 10000,
      Math.round(state.region.east * 10000) / 10000,
      Math.round(state.region.west * 10000) / 10000
    ];
  }
  
  if (state.averageTreeAge !== undefined) compact.a = state.averageTreeAge;
  
  // Only include non-zero percentages
  Object.entries(state.treePercentages).forEach(([key, value]) => {
    if (value > 0) compact.p[key] = value;
  });
  
  return compact;
}

/**
 * Convert compact representation back to ShareableState
 */
function fromCompactState(compact: CompactState): ShareableState {
  const state: ShareableState = {
    mode: compact.m === 0 ? 'planting' : 'clear-cutting',
    years: compact.y,
    calculationMode: compact.c === 0 ? 'perTree' : 'perArea',
    treeIds: compact.t,
    treePercentages: compact.p
  };
  
  if (compact.lat !== undefined) state.latitude = compact.lat;
  if (compact.lon !== undefined) state.longitude = compact.lon;
  
  if (compact.r) {
    state.region = {
      north: compact.r[0],
      south: compact.r[1],
      east: compact.r[2],
      west: compact.r[3]
    };
  }
  
  if (compact.a !== undefined) state.averageTreeAge = compact.a;
  
  return state;
}

/**
 * Encode state to URL-safe base64 string with compression
 */
export function encodeStateToUrl(state: ShareableState): string {
  try {
    // Convert to compact representation
    const compact = toCompactState(state);
    const json = JSON.stringify(compact);
    
    // Use btoa for base64 encoding (browser-safe)
    const base64 = typeof window !== 'undefined' 
      ? btoa(json)
      : Buffer.from(json).toString('base64');
    
    // Make URL-safe by replacing characters
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Error encoding state:', error);
    return '';
  }
}

/**
 * Decode URL parameter to state object
 */
export function decodeUrlToState(encoded: string): ShareableState | null {
  try {
    // Restore base64 padding and characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decode base64
    const json = typeof window !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8');
    
    const compact = JSON.parse(json) as CompactState;
    
    // Convert from compact format
    const state = fromCompactState(compact);
    
    // Validate required fields
    if (!state.mode || !state.years || !state.calculationMode) {
      console.error('Invalid state: missing required fields');
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Error decoding state:', error);
    return null;
  }
}

/**
 * Generate shareable URL for current analysis
 */
export function generateShareableUrl(state: ShareableState): string {
  const encoded = encodeStateToUrl(state);
  if (!encoded) {
    return '';
  }
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname
    : '';
  
  return `${baseUrl}?share=${encoded}`;
}

/**
 * Get share parameter from current URL
 */
export function getShareParameterFromUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const params = new URLSearchParams(window.location.search);
  return params.get('share');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Validate state object
 */
export function validateState(state: ShareableState): boolean {
  // Check required fields
  if (!state.mode || !['planting', 'clear-cutting'].includes(state.mode)) {
    return false;
  }
  
  if (!state.years || state.years <= 0 || state.years > 200) {
    return false;
  }
  
  if (!state.calculationMode || !['perTree', 'perArea'].includes(state.calculationMode)) {
    return false;
  }
  
  // Check location
  if (!state.latitude && !state.longitude && !state.region) {
    return false;
  }
  
  // Validate coordinates if present
  if (state.latitude !== undefined && (state.latitude < -90 || state.latitude > 90)) {
    return false;
  }
  
  if (state.longitude !== undefined && (state.longitude < -180 || state.longitude > 180)) {
    return false;
  }
  
  // Validate region bounds if present
  if (state.region) {
    const { north, south, east, west } = state.region;
    if (north < -90 || north > 90 || south < -90 || south > 90) {
      return false;
    }
    if (east < -180 || east > 180 || west < -180 || west > 180) {
      return false;
    }
    if (north <= south) {
      return false;
    }
  }
  
  // Validate tree percentages
  if (state.treePercentages) {
    const total = Object.values(state.treePercentages).reduce((sum, val) => sum + val, 0);
    if (total < 0 || total > 100) {
      return false;
    }
  }
  
  return true;
}
