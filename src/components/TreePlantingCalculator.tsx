"use client";

import React, { useState } from 'react';
import { TreeType } from '@/types/treeTypes';
import {
  RegionBounds,
  calculateTreePlanting,
  formatArea,
  formatNumber,
  getPlantingRecommendations,
  calculatePlantingTimeline,
  TREE_SPACING_CONFIGS
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

  const plantingConfig = calculateTreePlanting(
    selectedRegion,
    treeForPlanting.name,
    customSpacing
  );

  // Note: Carbon sequestration and mortality calculations removed as requested
  const recommendations = getPlantingRecommendations(plantingConfig.area);
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
            <span className="text-xs text-gray-500 font-bold">Spacing:</span>
            <span className="text-xs font-medium">{plantingConfig.spacing}m between trees</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">Density:</span>
            <span className="text-xs font-medium">{formatNumber(plantingConfig.density)} trees/ha</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">Total Trees:</span>
            <span className="text-xs font-medium text-primary">{formatNumber(plantingConfig.totalTrees)}</span>
          </div>
        </div>
      </div>

      {/* Custom Spacing Option */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">
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
        <span className="text-xs text-gray-500 mb-1 flex items-center gap-1 underline">
          Planting Timeline
        </span>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500"><strong>Trees per year:</strong></span>
            <span className="font-medium text-primary">{formatNumber(timeline.treesPerYear)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500"><strong>Years to complete:</strong></span>
            <span className="font-medium text-primary">{timeline.yearsToComplete}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500"><strong>Trees per season:</strong></span>
            <span className="font-medium text-primary">{formatNumber(timeline.treesPerSeason)}</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Recommendations</h4>
        <ul className="space-y-1">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start">
              <span className="text-primary mr-1">•</span>
              {recommendation}
            </li>
          ))}
        </ul>
      </div>

      {/* Spacing Presets */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Spacing Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TREE_SPACING_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setCustomSpacing(config.spacing)}
              className={`p-2 text-xs rounded border transition-colors ${
                customSpacing === config.spacing
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{config.description}</div>
              <div className="text-gray-500">{config.density} trees/ha</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TreePlantingCalculator; 