/**
 * Tree mix calculation utilities
 */

import { TreeType, getTreeTypeById } from '@/types/treeTypes';
import { TreeMix, TreeMixItem, TreeMixCalculation, ECOLOGICAL_MIXES } from '@/types/treeMix';
import { getRecommendedSpacing } from '@/utils/treePlanting';

// Calculate biodiversity score based on species diversity
export const calculateBiodiversityScore = (speciesCount: number): number => {
  if (speciesCount === 1) return 1;
  if (speciesCount === 2) return 2;
  if (speciesCount === 3) return 3;
  if (speciesCount === 4) return 4;
  return 5; // 5+ species
};

// Calculate weighted average for a property
export const calculateWeightedAverage = (items: TreeMixItem[], property: keyof TreeType): number => {
  if (items.length === 0) return 0;
  
  const totalWeight = items.reduce((sum, item) => sum + item.percentage, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = items.reduce((sum, item) => {
    const value = item.treeType[property];
    if (typeof value === 'number') {
      return sum + (value * item.percentage);
    }
    return sum;
  }, 0);
  
  return weightedSum / totalWeight;
};

// Calculate average spacing for mixed species
export const calculateAverageSpacing = (items: TreeMixItem[]): number => {
  if (items.length === 0) return 3.0; // Default spacing
  
  const spacingConfigs = {
    dense: 2.5,
    standard: 3.0,
    wide: 4.0,
    veryWide: 6.0
  };
  
  const weightedSpacing = items.reduce((sum, item) => {
    const spacingKey = getRecommendedSpacing(item.treeType.name);
    const spacing = spacingConfigs[spacingKey];
    return sum + (spacing * item.percentage);
  }, 0);
  
  const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
  return totalPercentage > 0 ? weightedSpacing / totalPercentage : 3.0;
};

// Calculate tree mix statistics
export const calculateTreeMix = (items: TreeMixItem[]): TreeMixCalculation => {
  const speciesCount = items.length;
  
  const weightedCarbonSequestration = calculateWeightedAverage(items, 'carbonSequestration');
  const weightedBiodiversityValue = calculateWeightedAverage(items, 'biodiversityValue');
  const weightedResilienceScore = calculateWeightedAverage(items, 'resilienceScore');
  const averageSpacing = calculateAverageSpacing(items);
  const biodiversityScore = calculateBiodiversityScore(speciesCount);
  
  return {
    weightedCarbonSequestration,
    weightedBiodiversityValue,
    weightedResilienceScore,
    averageSpacing,
    speciesCount,
    biodiversityScore
  };
};

// Validate tree mix
export const validateTreeMix = (items: TreeMixItem[]): TreeMix => {
  const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.1 && items.length > 0;
  
  return {
    items,
    totalPercentage,
    isValid
  };
};

// Apply ecological mix preset
export const applyEcologicalMix = (presetKey: keyof typeof ECOLOGICAL_MIXES): TreeMixItem[] => {
  const preset = ECOLOGICAL_MIXES[presetKey];
  const items: TreeMixItem[] = [];
  
  for (const item of preset.items) {
    const treeType = getTreeTypeById(item.treeTypeId);
    if (treeType) {
      items.push({
        treeType,
        percentage: item.percentage
      });
    }
  }
  
  return items;
};

// Get recommended mix based on climate and latitude
export const getRecommendedMix = (climate?: string, latitude?: number): string => {
  if (!climate && !latitude) return 'temperate';
  
  const absLat = Math.abs(latitude || 0);
  
  if (absLat > 60) return 'boreal';
  if (absLat < 23.5) return 'tropical';
  if (climate?.toLowerCase().includes('urban')) return 'urban';
  
  return 'temperate';
};

// Calculate carbon sequestration for mixed species with mortality
export const calculateMixedCarbonSequestration = (
  items: TreeMixItem[],
  totalTrees: number,
  years: number,
  mortalityRate: number
): {
  totalCarbon: number;
  averageAnnualCarbon: number;
  speciesBreakdown: Array<{
    species: string;
    trees: number;
    carbon: number;
    percentage: number;
  }>;
} => {
  const mix = calculateTreeMix(items);
  const weightedCarbon = mix.weightedCarbonSequestration;
  
  // Calculate total carbon with mortality
  const annualSurvivalRate = (100 - mortalityRate) / 100;
  let totalCarbon = 0;
  let previousTrees = totalTrees;
  
  for (let year = 1; year <= years; year++) {
    const currentTrees = Math.floor(previousTrees * annualSurvivalRate);
    const carbonThisYear = currentTrees * weightedCarbon;
    totalCarbon += carbonThisYear;
    previousTrees = currentTrees;
  }
  
  const averageAnnualCarbon = totalCarbon / years;
  
  // Calculate species breakdown
  const speciesBreakdown = items.map(item => {
    const speciesTrees = Math.floor(totalTrees * (item.percentage / 100));
    const speciesCarbon = speciesTrees * item.treeType.carbonSequestration * years;
    
    return {
      species: item.treeType.name,
      trees: speciesTrees,
      carbon: speciesCarbon,
      percentage: item.percentage
    };
  });
  
  return {
    totalCarbon,
    averageAnnualCarbon,
    speciesBreakdown
  };
}; 