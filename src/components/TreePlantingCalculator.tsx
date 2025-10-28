"use client";

import React, { useState, useEffect } from 'react';
import { TreeType } from '@/types/treeTypes';
import {
  RegionBounds,
  TreePlantingConfig,
  calculateTreePlanting,
  formatArea,
  formatNumber,
  TREE_SPACING_CONFIGS,
  getRecommendedSpacing
} from '@/utils/treePlanting';
import { ExportData } from '@/utils/exportUtils';

// Types for soil and climate data
interface SoilData {
  carbon: number | null;
  ph: number | null;
  isEstimated?: boolean;
}

interface ClimateData {
  temperature: number | null;
  precipitation: number | null;
  historicalData?: {
    temperatures: number[];
    precipitations: number[];
  };
}

// CollapsibleSection component and interface removed as they're unused

// Helper function for climate trend calculation
const calculateLinearTrend = (years: number[], values: number[]): number => {
  if (years.length !== values.length || years.length < 2) return 0;
  
  const n = years.length;
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = years.reduce((sum, year, i) => sum + year * values[i], 0);
  const sumXX = years.reduce((sum, year) => sum + year * year, 0);
  
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
};

interface TreePlantingCalculatorProps {
  selectedRegion: RegionBounds | null;
  selectedTreeType: TreeType | null;
  selectedTrees?: TreeType[];
  treePercentages?: { [key: string]: number };
  onDataReady?: (data: Partial<ExportData>) => void;
  simulationMode?: 'planting' | 'clear-cutting';
  years?: number;
  onYearsChange?: (years: number) => void;
  onCalculationModeChange?: (mode: 'perTree' | 'perArea') => void;
  onTreeAgeChange?: (age: number) => void;
  soil?: SoilData | null;
  climate?: ClimateData | null;
}

const TreePlantingCalculator: React.FC<TreePlantingCalculatorProps> = ({
  selectedRegion,
  selectedTreeType,
  selectedTrees,
  treePercentages,
  onDataReady,
  simulationMode = 'planting',
  years = 50,
  onYearsChange,
  onCalculationModeChange,
  onTreeAgeChange,
  soil,
  climate
}) => {
  const [customSpacing, setCustomSpacing] = useState<number | undefined>();
  const [calculationMode, setCalculationMode] = useState<'perTree' | 'perArea'>('perArea');
  const [averageTreeAge, setAverageTreeAge] = useState<number>(20); // Default to 20 years for mature forests

  // Notify parent when calculation mode changes
  useEffect(() => {
    if (onCalculationModeChange) {
      onCalculationModeChange(calculationMode);
    }
  }, [calculationMode, onCalculationModeChange]);

  // Notify parent when tree age changes
  useEffect(() => {
    if (onTreeAgeChange) {
      onTreeAgeChange(averageTreeAge);
    }
  }, [averageTreeAge, onTreeAgeChange]);

  // Determine which tree to use for planting calculations
  const treeForPlanting = selectedTreeType || (selectedTrees && selectedTrees.length > 0 ? selectedTrees[0] : null);
  
  // Calculate planting configuration with useMemo to recalculate when customSpacing changes
  const plantingConfig = React.useMemo(() => {
    let config: TreePlantingConfig | undefined;
    
    if (selectedRegion && treeForPlanting) {
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
        
        config = calculateTreePlanting(
          selectedRegion,
          'mixed', // Use 'mixed' to trigger custom spacing
          avgSpacing
        );
      } else {
        // Single tree or no percentages - use normal calculation
        config = calculateTreePlanting(
          selectedRegion,
          treeForPlanting.name,
          customSpacing
        );
      }

    }
    
    return config;
  }, [selectedRegion, treeForPlanting, selectedTrees, treePercentages, customSpacing]);

  // Call onDataReady callback when data is available
  React.useEffect(() => {
    if (onDataReady && selectedRegion && plantingConfig) {
      onDataReady({
        plantingData: {
          area: plantingConfig.area,
          totalTrees: plantingConfig.totalTrees,
          spacing: plantingConfig.spacing,
          density: plantingConfig.density
        }
      });
    }
  }, [onDataReady, selectedRegion, plantingConfig, customSpacing]);

  // Early return checks - must be after all hooks
  if (!selectedRegion || (!selectedTreeType && (!selectedTrees || selectedTrees.length === 0))) {
    return null;
  }
  
  if (!treeForPlanting) {
    return null;
  }

  if (!plantingConfig) {
    return null;
  }



  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      
      {/* Calculation Mode - At the very top */}
      <div className="mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calculation Mode
            </label>
            {calculationMode === 'perTree' ? (
              <p className="text-xs text-gray-500">
                Showing impact per individual tree
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Showing impact for entire area
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCalculationMode('perTree')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                calculationMode === 'perTree'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Per Tree
            </button>
            <button
              onClick={() => setCalculationMode('perArea')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                calculationMode === 'perArea'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Per Area
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Duration - Right below Calculation Mode */}
      {onYearsChange && (
        <div className="mb-4">
          <label htmlFor="years" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="font-bold">Simulation Duration:</span> <span className="font-bold text-primary">{years} year{years !== 1 ? 's' : ''}</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-8 text-center">1</span>
            <input
              id="years"
              type="range"
              min={1}
              max={100}
              value={years}
              onChange={e => onYearsChange(Number(e.target.value))}
              onWheel={e => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -1 : 1;
                const newValue = Math.max(1, Math.min(100, years + delta));
                onYearsChange(newValue);
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #1B4D3E 0%, #1B4D3E ${((years - 1) / 99) * 100}%, #e5e7eb ${((years - 1) / 99) * 100}%, #e5e7eb 100%)`
              }}
            />
            <span className="text-xs text-gray-500 w-8 text-center">100</span>
          </div>
        </div>
      )}

      {/* Region and Configuration */}
      <div className="mb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">Area size:</span>
            <span className="text-xs font-medium">{formatArea(plantingConfig.area)}</span>
          </div>
          {selectedRegion && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold">Coordinates:</span>
              <span className="text-xs font-medium">
                {selectedRegion.south.toFixed(4)}°S to {selectedRegion.north.toFixed(4)}°N<br />
                {selectedRegion.west.toFixed(4)}°W to {selectedRegion.east.toFixed(4)}°E
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span 
              className="text-xs text-gray-500 font-bold cursor-help"
              title="Tree spacing is optimized for healthy growth, allowing adequate sunlight, water, and root space. Denser spacing (2-3m) creates closed canopy faster, while wider spacing (4-6m) allows for understory development and easier maintenance."
            >
              Spacing:
            </span>
            <span className="text-xs font-medium">{plantingConfig.spacing}m between trees</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span 
              className="text-xs text-gray-500 font-bold cursor-help"
              title="Trees per hectare = 10,000m² ÷ (spacing in meters)². This ensures optimal tree distribution across your area for maximum forest health and carbon sequestration potential."
            >
              Density:
            </span>
            <span className="text-xs font-medium">{formatNumber(plantingConfig.density)} trees/ha</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500 font-bold">Total Trees:</span>
            <span className="text-xs font-medium text-primary">{formatNumber(plantingConfig.totalTrees)}</span>
          </div>
        </div>
        
        {selectedTrees && selectedTrees.length > 1 && (
          <div className="mt-2 p-2 bg-primary/10 border border-primary/30 rounded text-xs text-primary">
            <strong>🌳 Multi-species spacing:</strong> Spacing calculated as weighted average based on your tree selection and percentages.
          </div>
        )}
      </div>


      {/* Configuration Settings - Conditional based on calculation mode */}
      <div className="mb-4 space-y-4">
        {/* Per Area Mode Settings */}
        {calculationMode === 'perArea' && (
          <>
      {/* Custom Spacing Option */}
            <div>
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
          </>
        )}

        {/* Average Tree Age (Clear-cutting mode only) */}
        {simulationMode === 'clear-cutting' && (
          <div>
            <label 
              className="block text-xs font-medium text-gray-700 mb-1 cursor-help"
              title="Enter the average age of trees in this forest area. Young forests: 5-15 years, Mature forests: 20-50 years, Old-growth: 50+ years. This affects carbon emission calculations."
            >
              Average Tree Age (years)
            </label>
            <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="200"
              step="1"
              value={averageTreeAge || ''}
              onChange={(e) => setAverageTreeAge(e.target.value ? parseInt(e.target.value) : 20)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
              <div className="text-xs text-gray-500 flex items-center">
                {averageTreeAge < 10 && "Young"}
                {averageTreeAge >= 10 && averageTreeAge < 30 && "Mature"}
                {averageTreeAge >= 30 && averageTreeAge < 60 && "Mature"}
                {averageTreeAge >= 60 && "Ancient"}
              </div>
            </div>
          </div>
        )}


        {/* Soil and Climate Data */}
        {(soil || climate) && (
          <div className="mt-4 space-y-3">
            <h4 className="font-semibold text-gray-800 text-sm">Environmental Data</h4>
            
            {soil && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <h5 className="font-semibold text-primary mb-2 text-xs flex items-center gap-2">
                  Soil Data
                  {soil.isEstimated && (
                    <span className="text-xs font-normal text-primary/80">(Estimated)</span>
                  )}
                </h5>
                <div className="space-y-1 text-xs text-primary">
                  <div className="flex justify-between">
                    <span>Soil Carbon Content:</span>
                    <span className="font-medium">
                      {soil?.carbon !== undefined && soil.carbon !== null ? `${soil.carbon.toFixed(1)} g/kg` : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Soil pH Level:</span>
                    <span className="font-medium">
                      {soil?.ph !== undefined && soil.ph !== null ? soil.ph.toFixed(1) : 'Not available'}
                    </span>
                  </div>
                  {soil?.carbon && (
                    <div className="mt-2 pt-2 border-t border-primary/30">
                      <div className="text-xs text-primary">
                        <span className="font-semibold">Carbon Bonus:</span> +{(soil.carbon * 0.1).toFixed(1)} kg CO₂/year per tree
                      </div>
                    </div>
                  )}
                  {soil.isEstimated && (
                    <div className="mt-2 pt-2 border-t border-primary/30 text-xs text-primary/80">
                      ℹ️ Soil data unavailable for this location. Using climate-zone estimates.
                    </div>
                  )}
                </div>
              </div>
            )}

            {climate && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <h5 className="font-semibold text-primary mb-2 text-xs">
                  Climate Data
                </h5>
                <div className="space-y-1 text-xs text-primary">
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className="font-medium">
                      {climate?.temperature !== undefined && climate.temperature !== null 
                        ? `${climate.temperature.toFixed(1)}°C` 
                        : 'Estimated from latitude'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Precipitation:</span>
                    <span className="font-medium">
                      {climate?.precipitation !== undefined && climate.precipitation !== null 
                        ? `${climate.precipitation.toFixed(1)} mm` 
                        : 'Estimated from latitude'}
                    </span>
                  </div>

                  {climate?.historicalData && climate.historicalData.temperatures.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/30">
                      <div className="text-xs text-primary">
                        <span className="font-semibold">Climate Trend:</span> {calculateLinearTrend(Array.from({length: climate.historicalData.temperatures.length}, (_, i) => i), climate.historicalData.temperatures).toFixed(3)}°C/year
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>



    </div>
  );
};



export default TreePlantingCalculator; 