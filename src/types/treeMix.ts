/**
 * Types for multi-tree species selection
 */

import { TreeType } from './treeTypes';

export interface TreeMixItem {
  treeType: TreeType;
  percentage: number;
}

export interface TreeMix {
  items: TreeMixItem[];
  totalPercentage: number;
  isValid: boolean;
}

export interface TreeMixCalculation {
  weightedCarbonSequestration: number;
  weightedBiodiversityValue: number;
  weightedResilienceScore: number;
  averageSpacing: number;
  speciesCount: number;
  biodiversityScore: number; // 1-5 based on species diversity
}

// Ecological mix presets
export const ECOLOGICAL_MIXES = {
  temperate: {
    name: "Temperate Forest Mix",
    description: "Classic temperate forest with high biodiversity",
    items: [
      { treeTypeId: "oak", percentage: 40 },
      { treeTypeId: "maple", percentage: 30 },
      { treeTypeId: "birch", percentage: 20 },
      { treeTypeId: "pine", percentage: 10 }
    ]
  },
  boreal: {
    name: "Boreal Forest Mix",
    description: "Northern forest adapted to cold climates",
    items: [
      { treeTypeId: "spruce", percentage: 60 },
      { treeTypeId: "pine", percentage: 25 },
      { treeTypeId: "birch", percentage: 15 }
    ]
  },
  tropical: {
    name: "Tropical Forest Mix",
    description: "Diverse tropical species for maximum biodiversity",
    items: [
      { treeTypeId: "eucalyptus", percentage: 50 },
      { treeTypeId: "mangrove", percentage: 30 },
      { treeTypeId: "cedar", percentage: 20 }
    ]
  },
  urban: {
    name: "Urban Forest Mix",
    description: "City-adapted species with aesthetic appeal",
    items: [
      { treeTypeId: "maple", percentage: 40 },
      { treeTypeId: "oak", percentage: 30 },
      { treeTypeId: "willow", percentage: 20 },
      { treeTypeId: "pine", percentage: 10 }
    ]
  },
  carbon: {
    name: "Carbon Focus Mix",
    description: "Optimized for maximum carbon sequestration",
    items: [
      { treeTypeId: "eucalyptus", percentage: 60 },
      { treeTypeId: "sequoia", percentage: 25 },
      { treeTypeId: "oak", percentage: 15 }
    ]
  },
  biodiversity: {
    name: "Biodiversity Focus Mix",
    description: "Maximum species diversity for ecosystem health",
    items: [
      { treeTypeId: "oak", percentage: 25 },
      { treeTypeId: "maple", percentage: 25 },
      { treeTypeId: "birch", percentage: 20 },
      { treeTypeId: "willow", percentage: 15 },
      { treeTypeId: "pine", percentage: 15 }
    ]
  }
}; 