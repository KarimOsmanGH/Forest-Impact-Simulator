"use client";

import React, { useState } from 'react';
import { TreeType } from '@/types/treeTypes';
import {
  RegionBounds,
  calculateTreePlanting,
  formatArea,
  formatNumber,
  calculatePlantingTimeline,
  TREE_SPACING_CONFIGS,
  getRecommendedSpacing
} from '@/utils/treePlanting';

interface TreePlantingCalculatorProps {
  selectedRegion: RegionBounds | null;
  selectedTreeType: TreeType | null;
  selectedTrees?: TreeType[];
  treePercentages?: { [key: string]: number };
}

const TreePlantingCalculator: React.FC<TreePlantingCalculatorProps> = ({
  selectedRegion,
  selectedTreeType,
  selectedTrees,
  treePercentages
}) => {
  const [customSpacing, setCustomSpacing] = useState<number | undefined>();



  if (!selectedRegion || (!selectedTreeType && (!selectedTrees || selectedTrees.length === 0))) {
    return null;
  }

  // Determine which tree to use for planting calculations
  const treeForPlanting = selectedTreeType || (selectedTrees && selectedTrees.length > 0 ? selectedTrees[0] : null);
  
  if (!treeForPlanting) {
    return null;
  }

  // Calculate planting configuration
  let plantingConfig;
  
  if (selectedTrees && selectedTrees.length > 1 && treePercentages) {
    // For multiple trees, calculate weighted average spacing
    let totalWeight = 0;
    let weightedSpacing = 0;
    
    selectedTrees.forEach(tree => {
      const percentage = treePercentages[tree.id] || 0;
      const spacingKey = getRecommendedSpacing(tree.name);
      const spacing = TREE_SPACING_CONFIGS[spacingKey].spacing;
      
      totalWeight += percentage;
      weightedSpacing += spacing * (percentage / 100);
    });
    
    // Use weighted average spacing, but ensure it's within reasonable bounds
    let avgSpacing = totalWeight > 0 ? weightedSpacing : TREE_SPACING_CONFIGS.standard.spacing;
    
    // Ensure spacing is within reasonable bounds (2.5m to 6.0m)
    avgSpacing = Math.max(2.5, Math.min(6.0, avgSpacing));
    
    // If percentages don't add up to 100%, adjust to use standard spacing
    if (Math.abs(totalWeight - 100) > 5) {
      avgSpacing = TREE_SPACING_CONFIGS.standard.spacing;
    }
    
    plantingConfig = calculateTreePlanting(
      selectedRegion,
      'mixed', // Use 'mixed' to trigger custom spacing
      avgSpacing
    );
  } else {
    // Single tree or no percentages - use normal calculation
    plantingConfig = calculateTreePlanting(
      selectedRegion,
      treeForPlanting.name,
      customSpacing
    );
  }

  // Note: Carbon sequestration and mortality calculations removed as requested
  const timeline = calculatePlantingTimeline(plantingConfig.totalTrees);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      
      {/* Region Information */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Selected Region</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Area:</span>
            <p className="font-medium">{formatArea(plantingConfig.area)}</p>
          </div>
          <div>
            <span className="text-gray-500">Coordinates:</span>
            <p className="font-medium text-xs">
              {selectedRegion.south.toFixed(4)}°S to {selectedRegion.north.toFixed(4)}°N<br />
              {selectedRegion.west.toFixed(4)}°W to {selectedRegion.east.toFixed(4)}°E
            </p>
          </div>
        </div>
      </div>

      {/* Tree Spacing Configuration */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Planting Configuration</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span 
              className="text-xs text-gray-500 font-bold cursor-help"
              title="Tree spacing is optimized for healthy growth, allowing adequate sunlight, water, and root space. Denser spacing (2-3m) creates closed canopy faster, while wider spacing (4-6m) allows for understory development and easier maintenance."
            >
              Spacing:
            </span>
            <span className="text-xs font-medium">{plantingConfig.spacing}m between trees</span>
          </div>
          <div className="flex items-center justify-between">
            <span 
              className="text-xs text-gray-500 font-bold cursor-help"
              title="Trees per hectare = 10,000m² ÷ (spacing in meters)². This ensures optimal tree distribution across your area for maximum forest health and carbon sequestration potential."
            >
              Density:
            </span>
            <span className="text-xs font-medium">{formatNumber(plantingConfig.density)} trees/ha</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">Total Trees:</span>
            <span className="text-xs font-medium text-primary">{formatNumber(plantingConfig.totalTrees)}</span>
          </div>
        </div>
        
        {selectedTrees && selectedTrees.length > 1 && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            <strong>🌳 Multi-species spacing:</strong> Spacing calculated as weighted average based on your tree selection and percentages.
          </div>
        )}
      </div>

      {/* Custom Spacing Option */}
      <div className="mb-4">
        <label 
          className="block text-xs font-medium text-gray-700 mb-1 cursor-help"
          title="Adjust spacing for specific site conditions, access requirements, or management goals. Wider spacing (5-6m) for equipment access, narrower (2-3m) for rapid canopy closure. Auto uses species-specific recommendations."
        >
          Custom Spacing (meters)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="10"
            step="0.5"
            value={customSpacing || ''}
            onChange={(e) => setCustomSpacing(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Auto"
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => setCustomSpacing(undefined)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            Auto
          </button>
        </div>
      </div>

      {/* Planting Timeline */}
      <div className="mb-4 flex flex-col bg-white rounded shadow p-4">
        <span className="text-xs text-gray-500 mb-2 flex items-center gap-1 font-semibold">
          🌱 Planting Timeline (Realistic Project Planning)
        </span>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span 
              className="text-gray-600 cursor-help"
              title="Project scale determines planting rates, crew size, and equipment used. Larger projects can use more efficient methods."
            >
              <strong>Project Scale:</strong>
            </span>
            <span className="font-medium text-primary">{timeline.projectScale}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span 
              className="text-gray-600 cursor-help"
              title="Recommended approach based on project scale, including crew size, equipment, and methodology."
            >
              <strong>Recommended Approach:</strong>
            </span>
            <span className="font-medium text-primary text-right max-w-xs">{timeline.recommendedApproach}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span 
              className="text-gray-600 cursor-help"
              title="Planting rate assumes experienced crew with appropriate equipment for the project scale."
            >
              <strong>Planting capacity:</strong>
            </span>
            <span className="font-medium text-primary">{formatNumber(timeline.treesPerYear)} trees/year</span>
          </div>
          <div className="flex justify-between text-xs">
            <span 
              className="text-gray-600 cursor-help"
              title="Total time to complete all planting based on project scale and recommended approach."
            >
              <strong>Project duration:</strong>
            </span>
            <span className="font-medium text-primary">{timeline.yearsToComplete} year{timeline.yearsToComplete !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span 
              className="text-gray-600 cursor-help"
              title="Trees planted per planting season, accounting for optimal planting windows and weather conditions."
            >
              <strong>Seasonal workload:</strong>
            </span>
            <span className="font-medium text-primary">{formatNumber(timeline.treesPerSeason)} trees/season</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreePlantingCalculator; 