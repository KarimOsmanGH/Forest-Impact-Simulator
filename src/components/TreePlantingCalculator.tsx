"use client";

import React, { useState } from 'react';
import { TreeType } from '@/types/treeTypes';
import {
  RegionBounds,
  calculateTreePlanting,
  calculatePlantationCarbonSequestration,
  formatArea,
  formatNumber,
  getPlantingRecommendations,
  calculatePlantingTimeline,
  TREE_SPACING_CONFIGS
} from '@/utils/treePlanting';
import {
  getMortalityRate,
  calculateAdjustedCarbonSequestration,
  getMortalityDescription
} from '@/utils/treeMortality';

interface TreePlantingCalculatorProps {
  selectedRegion: RegionBounds | null;
  selectedTreeType: TreeType | null;
  selectedTrees?: TreeType[];
  years: number;
}

const TreePlantingCalculator: React.FC<TreePlantingCalculatorProps> = ({
  selectedRegion,
  selectedTreeType,
  years
}) => {
  const [customSpacing, setCustomSpacing] = useState<number | undefined>();
  const [includeMortality, setIncludeMortality] = useState<boolean>(false);



  if (!selectedRegion || !selectedTreeType) {
    return null;
  }

  const plantingConfig = calculateTreePlanting(
    selectedRegion,
    selectedTreeType.name,
    customSpacing
  );

  const mortalityRate = getMortalityRate(selectedTreeType.name, years);
  
  let annualCarbonSequestration: number;
  let totalCarbonSequestration: number;
  let survivingTrees = plantingConfig.totalTrees;
  let deadTrees = 0;
  
  if (includeMortality) {
    const adjustedCarbon = calculateAdjustedCarbonSequestration(
      plantingConfig.totalTrees,
      selectedTreeType.carbonSequestration,
      mortalityRate,
      years
    );
    annualCarbonSequestration = adjustedCarbon.averageAnnualCarbon;
    totalCarbonSequestration = adjustedCarbon.totalCarbon;
    survivingTrees = adjustedCarbon.survivingTrees;
    deadTrees = adjustedCarbon.deadTrees;
  } else {
    annualCarbonSequestration = calculatePlantationCarbonSequestration(
      plantingConfig,
      selectedTreeType.carbonSequestration
    );
    totalCarbonSequestration = annualCarbonSequestration * years;
  }
  const recommendations = getPlantingRecommendations(plantingConfig.area);
  const timeline = calculatePlantingTimeline(plantingConfig.totalTrees);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Tree Planting Calculator</h3>
      
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
            <span className="text-xs text-gray-500">Spacing:</span>
            <span className="text-xs font-medium">{plantingConfig.spacing}m between trees</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Density:</span>
            <span className="text-xs font-medium">{formatNumber(plantingConfig.density)} trees/ha</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Total Trees:</span>
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

      {/* Tree Mortality Option */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeMortality"
            checked={includeMortality}
            onChange={(e) => setIncludeMortality(e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="includeMortality" className="text-xs font-medium text-gray-700">
            Include tree mortality in calculations
          </label>
        </div>
        {includeMortality && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
            <div className="text-orange-800 font-medium">Mortality Rate: {mortalityRate}% per year</div>
            <div className="text-orange-700">{getMortalityDescription(selectedTreeType.name, years)}</div>
          </div>
        )}
      </div>

      {/* Carbon Impact */}
      <div className="mb-4 flex flex-col bg-white rounded shadow p-4">
        <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          Carbon Impact
        </span>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500"><strong>Annual CO₂ sequestration:</strong></span>
            <span className="font-medium text-primary">
              {formatNumber(annualCarbonSequestration)} kg CO₂/year
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500"><strong>Total over {years} years:</strong></span>
            <span className="font-medium text-primary">
              {formatNumber(totalCarbonSequestration)} kg CO₂
            </span>
          </div>
          {includeMortality && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Surviving trees:</span>
                <span className="font-medium text-primary">{formatNumber(survivingTrees)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Trees lost to mortality:</span>
                <span className="font-medium text-orange-600">{formatNumber(deadTrees)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Planting Timeline */}
      <div className="mb-4 flex flex-col bg-white rounded shadow p-4">
        <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
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