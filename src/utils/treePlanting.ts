/**
 * Tree planting calculations and utilities
 */

export interface TreePlantingConfig {
  spacing: number; // meters between trees
  density: number; // trees per hectare
  area: number; // hectares
  totalTrees: number;
  carbonSequestration: number; // kg CO2 per year for the entire plantation
}

export interface RegionBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Tree spacing configurations for different tree types
export const TREE_SPACING_CONFIGS = {
  // Dense planting for fast-growing species
  dense: {
    spacing: 2.5, // 2.5m spacing
    density: 1600, // 1600 trees/ha
    description: "Dense planting (2.5m spacing)"
  },
  // Standard commercial forestry
  standard: {
    spacing: 3.0, // 3m spacing
    density: 1111, // 1111 trees/ha
    description: "Standard spacing (3m spacing)"
  },
  // Wide spacing for large trees
  wide: {
    spacing: 4.0, // 4m spacing
    density: 625, // 625 trees/ha
    description: "Wide spacing (4m spacing)"
  },
  // Very wide for giant trees
  veryWide: {
    spacing: 6.0, // 6m spacing
    density: 278, // 278 trees/ha
    description: "Very wide spacing (6m spacing)"
  }
};

// Calculate area in hectares from region bounds
export const calculateRegionArea = (bounds: RegionBounds): number => {
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  
  // Convert to meters (approximate)
  const latMeters = latDiff * 111000; // 1 degree latitude ≈ 111km
  const lngMeters = lngDiff * 111000 * Math.cos((bounds.north + bounds.south) * Math.PI / 360);
  
  const areaSquareMeters = latMeters * lngMeters;
  const areaHectares = areaSquareMeters / 10000; // Convert to hectares
  
  return Math.max(0, areaHectares);
};

// Get recommended spacing based on tree type
export const getRecommendedSpacing = (treeType: string): keyof typeof TREE_SPACING_CONFIGS => {
  const treeTypeLower = treeType.toLowerCase();
  
  // Fast-growing species (dense planting for quick canopy closure)
  if (treeTypeLower.includes('eucalyptus') || treeTypeLower.includes('willow') || 
      treeTypeLower.includes('poplar') || treeTypeLower.includes('birch') ||
      treeTypeLower.includes('bamboo') || treeTypeLower.includes('papaya') ||
      treeTypeLower.includes('banana') || treeTypeLower.includes('tulip_poplar') ||
      treeTypeLower.includes('sycamore')) {
    return 'dense';
  }
  
  // Large/giant trees (need more space for root systems and canopy)
  if (treeTypeLower.includes('sequoia') || treeTypeLower.includes('redwood') || 
      treeTypeLower.includes('cedar') || treeTypeLower.includes('baobab') ||
      treeTypeLower.includes('douglas fir') || treeTypeLower.includes('monkey puzzle')) {
    return 'veryWide';
  }
  
  // Medium-large trees (standard forestry spacing)
  if (treeTypeLower.includes('oak') || treeTypeLower.includes('maple') || 
      treeTypeLower.includes('pine') || treeTypeLower.includes('spruce') ||
      treeTypeLower.includes('fir') || treeTypeLower.includes('mahogany') ||
      treeTypeLower.includes('teak') || treeTypeLower.includes('beech') ||
      treeTypeLower.includes('ash') || treeTypeLower.includes('hickory') ||
      treeTypeLower.includes('black walnut') || treeTypeLower.includes('white oak') ||
      treeTypeLower.includes('sugar maple') || treeTypeLower.includes('linden')) {
    return 'wide';
  }
  
  // Small trees and shrubs (can be planted closer together)
  if (treeTypeLower.includes('juniper') || treeTypeLower.includes('rowan') ||
      treeTypeLower.includes('olive') || treeTypeLower.includes('fig') ||
      treeTypeLower.includes('pomegranate') || treeTypeLower.includes('almond') ||
      treeTypeLower.includes('carob') || treeTypeLower.includes('cherry') ||
      treeTypeLower.includes('avocado') || treeTypeLower.includes('mango') ||
      treeTypeLower.includes('cashew') || treeTypeLower.includes('marula') ||
      treeTypeLower.includes('shea') || treeTypeLower.includes('sandalwood') ||
      treeTypeLower.includes('neem') || treeTypeLower.includes('camphor')) {
    return 'dense';
  }
  
  // Default to standard for unknown types
  return 'standard';
};

// Calculate tree planting configuration
export const calculateTreePlanting = (
  bounds: RegionBounds,
  treeType: string,
  customSpacing?: number
): TreePlantingConfig => {
  const area = calculateRegionArea(bounds);
  
  let spacing: number;
  let density: number;
  
  if (customSpacing) {
    spacing = customSpacing;
    density = 10000 / (spacing * spacing); // trees per hectare
  } else {
    const spacingKey = getRecommendedSpacing(treeType);
    const config = TREE_SPACING_CONFIGS[spacingKey];
    spacing = config.spacing;
    density = config.density;
  }
  
  const totalTrees = Math.floor(area * density);
  
  return {
    spacing,
    density,
    area,
    totalTrees,
    carbonSequestration: 0 // Will be calculated based on tree type
  };
};

// Calculate carbon sequestration for the entire plantation
export const calculatePlantationCarbonSequestration = (
  plantingConfig: TreePlantingConfig,
  carbonPerTree: number
): number => {
  return plantingConfig.totalTrees * carbonPerTree;
};

// Format area for display
export const formatArea = (areaHectares: number): string => {
  if (areaHectares < 1) {
    return `${(areaHectares * 10000).toFixed(0)} m²`;
  } else if (areaHectares < 100) {
    return `${areaHectares.toFixed(2)} hectares`;
  } else {
    return `${(areaHectares / 100).toFixed(2)} km²`;
  }
};

// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Get planting recommendations based on region size
export const getPlantingRecommendations = (areaHectares: number): string[] => {
  const recommendations: string[] = [];
  
  if (areaHectares < 0.1) {
    recommendations.push("Small area - consider container planting or urban forestry");
  } else if (areaHectares < 1) {
    recommendations.push("Medium area - suitable for community gardens or small woodlots");
  } else if (areaHectares < 10) {
    recommendations.push("Large area - suitable for commercial forestry or restoration");
  } else {
    recommendations.push("Very large area - consider mixed-species planting for biodiversity");
    recommendations.push("Plan for fire breaks and access roads");
  }
  
  if (areaHectares > 5) {
    recommendations.push("Consider phased planting over multiple years");
  }
  
  return recommendations;
};

// Calculate planting timeline
export const calculatePlantingTimeline = (totalTrees: number): {
  treesPerYear: number;
  yearsToComplete: number;
  treesPerSeason: number;
} => {
  // Realistic planting rates based on professional tree planting operations
  const treesPerPersonPerDay = 500; // Professional planters: 500-2000 trees/day depending on terrain
  const plantingDaysPerYear = 90; // 3 months of planting season (spring/fall)
  const people = 5; // Smaller, more realistic team size
  
  const treesPerDay = treesPerPersonPerDay * people;
  const treesPerYear = treesPerDay * plantingDaysPerYear;
  const yearsToComplete = Math.ceil(totalTrees / treesPerYear);
  const treesPerSeason = Math.ceil(totalTrees / yearsToComplete);
  
  return {
    treesPerYear,
    yearsToComplete,
    treesPerSeason
  };
}; 