"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { TreeType } from '@/types/treeTypes';
import { validateLatitude, validateLongitude, validateYears, apiRateLimiter } from '@/utils/security';
import { ExportData } from '@/utils/exportUtils';

// Custom Tooltip Component
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const showTooltip = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={showTooltip}
      onTouchEnd={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
          className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            pointerEvents: 'none'
          }}
        >
          {content}
          <div 
            className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
            style={{
              left: '50%',
              top: '100%',
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          />
        </div>
      )}
    </div>
  );
};

interface ForestImpactCalculatorProps {
  latitude: number | null;
  longitude: number | null;
  years: number;
  selectedTreeType?: TreeType | null;
  selectedTrees?: TreeType[];
  treePercentages?: { [key: string]: number };
  selectedRegion?: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  onYearsChange: (years: number) => void;
  onDataReady?: (data: Partial<ExportData>) => void;
}

interface ImpactMetrics {
  carbonSequestration: number;
  biodiversityImpact: number;
  forestResilience: number;
  waterRetention: number;
  airQualityImprovement: number;
}

interface SoilData {
  carbon?: number | null;
  ph?: number | null;
  texture?: string;
}

interface ClimateData {
  temperature?: number | null;
  precipitation?: number | null;
  historicalData?: {
    temperatures: number[];
    precipitations: number[];
    years: number[];
  };
}

interface ClimatePrediction {
  temperature: number;
  precipitation: number;
  growthModifier: number;
}

const fetchSoilData = async (lat: number, lon: number): Promise<SoilData> => {
  try {
    // Validate coordinates
    if (!validateLatitude(lat) || !validateLongitude(lon)) {
      throw new Error('Invalid coordinates');
    }
    
    // Rate limiting
    if (!apiRateLimiter.isAllowed('soil')) {
      throw new Error('Rate limit exceeded');
    }
    

    
    // Use the ISRIC SoilGrids API endpoint with correct properties
    const res = await fetch(`https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=soc&property=phh2o&depth=0-5cm&value=mean`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ForestFuture/1.0'
      }
    });
    
    if (!res.ok) {
  
      throw new Error(`Soil API error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Soil API response:', data);
    
    // Extract organic carbon and pH from the response
    let carbon = null;
    let ph = null;
    
    if (data.properties && data.properties.layers) {
      for (const layer of data.properties.layers) {
        if (layer.name === 'soc' && layer.depths && layer.depths[0]) {
          // Convert from dg/kg to g/kg (divide by 10)
          const rawValue = layer.depths[0].values?.mean || null;
          carbon = rawValue ? rawValue / 10 : null;
        }
        if (layer.name === 'phh2o' && layer.depths && layer.depths[0]) {
          // Convert from pHx10 to actual pH (divide by 10)
          const rawValue = layer.depths[0].values?.mean || null;
          ph = rawValue ? rawValue / 10 : null;
        }
      }
    }
    
    console.log('Extracted soil data:', { carbon, ph });
    return { carbon, ph };
  } catch (error) {
    console.error('Error fetching soil data:', error);
    return { carbon: null, ph: null };
  }
};

const processDailyToYearly = (temperatures: (number | null)[], precipitations: (number | null)[]) => {
  const yearlyTemps: number[] = [];
  const yearlyPrecip: number[] = [];
  const years: number[] = [];
  
  // Group data by year (assuming 365 days per year)
  const daysPerYear = 365;
  const numYears = Math.floor(temperatures.length / daysPerYear);
  
  for (let year = 0; year < numYears; year++) {
    const startIndex = year * daysPerYear;
    const endIndex = startIndex + daysPerYear;
    
    // Get daily values for this year
    const yearTemps = temperatures.slice(startIndex, endIndex).filter(t => t !== null && t !== undefined) as number[];
    const yearPrecip = precipitations.slice(startIndex, endIndex).filter(p => p !== null && p !== undefined) as number[];
    
    // Calculate yearly averages if we have enough data
    if (yearTemps.length > 300 && yearPrecip.length > 300) { // At least 300 days of data
      const avgTemp = yearTemps.reduce((sum, temp) => sum + temp, 0) / yearTemps.length;
      const totalPrecip = yearPrecip.reduce((sum, precip) => sum + precip, 0);
      
      yearlyTemps.push(avgTemp);
      yearlyPrecip.push(totalPrecip);
      years.push(year + 1);
    }
  }
  
  return { temperatures: yearlyTemps, precipitations: yearlyPrecip, years };
};

const fetchClimateData = async (lat: number, lon: number): Promise<ClimateData> => {
  try {
    // Validate coordinates
    if (!validateLatitude(lat) || !validateLongitude(lon)) {
      throw new Error('Invalid coordinates');
    }
    
    // Rate limiting
    if (!apiRateLimiter.isAllowed('climate')) {
      throw new Error('Rate limit exceeded');
    }
    
    console.log('Fetching climate data for:', lat, lon);
    
    // Fetch current weather data
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation&timezone=auto`);
    
    if (!weatherRes.ok) {
      throw new Error(`Weather API error: ${weatherRes.status} ${weatherRes.statusText}`);
    }
    
    const weatherData = await weatherRes.json();
    console.log('Weather API response:', weatherData);
    
    // Fetch historical data for climate trend analysis
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 11); // 11 years of data
    
    const historicalRes = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`);
    
    let historicalData = undefined;
    if (historicalRes.ok) {
      const historicalWeatherData = await historicalRes.json();
      console.log('Historical weather data:', historicalWeatherData);
      
      if (historicalWeatherData.daily) {
        const temperatures = historicalWeatherData.daily.temperature_2m_mean || [];
        const precipitations = historicalWeatherData.daily.precipitation_sum || [];
        
        // Process daily data into yearly averages
        const yearlyData = processDailyToYearly(temperatures, precipitations);
        
        if (yearlyData.temperatures.length > 0) {
          historicalData = {
            temperatures: yearlyData.temperatures,
            precipitations: yearlyData.precipitations,
            years: yearlyData.years
          };
        }
      }
    }
    
    const currentTemp = weatherData.current?.temperature_2m || null;
    const currentPrecip = weatherData.current?.precipitation || null;
    
    console.log('Extracted climate data:', { currentTemp, currentPrecip, historicalData });
    return {
      temperature: currentTemp,
      precipitation: currentPrecip,
      historicalData
    };
  } catch (error) {
    console.error('Error fetching climate data:', error);
    return { temperature: null, precipitation: null };
  }
};

const predictFutureClimate = (
  currentTemp: number | null,
  currentPrecip: number | null,
  historicalData: { temperatures: number[]; precipitations: number[]; years: number[] } | undefined,
  year: number,
  latitude: number
): ClimatePrediction => {
  // Default values based on latitude if no data available
  let predictedTemp = currentTemp || (Math.abs(latitude) < 30 ? 25 : Math.abs(latitude) < 60 ? 15 : Math.abs(latitude) < 70 ? 5 : -5);
  let predictedPrecip = currentPrecip || 1000;
  
  // If we have historical data, calculate trends
  if (historicalData && historicalData.temperatures.length > 5) {
    const tempTrend = calculateLinearTrend(historicalData.years, historicalData.temperatures);
    predictedTemp = predictedTemp + (tempTrend * year);
    
    const precipTrend = calculateLinearTrend(historicalData.years, historicalData.precipitations);
    predictedPrecip = Math.max(0, predictedPrecip + (precipTrend * year));
  }
  
  // Calculate growth modifier based on predicted conditions
  const growthModifier = calculateGrowthModifier(predictedTemp, predictedPrecip, currentTemp || predictedTemp, currentPrecip || predictedPrecip);
  
  return {
    temperature: predictedTemp,
    precipitation: predictedPrecip,
    growthModifier
  };
};

const calculateLinearTrend = (years: number[], values: number[]): number => {
  if (years.length !== values.length || years.length < 2) return 0;
  
  const n = years.length;
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = years.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = years.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
};

const calculateGrowthModifier = (
  predictedTemp: number,
  predictedPrecip: number,
  currentTemp: number,
  currentPrecip: number
): number => {
  // Temperature change impact (trees generally grow better with moderate warming)
  const tempChange = predictedTemp - currentTemp;
  const tempModifier = 1 + (tempChange * 0.02); // 2% change per degree
  
  // Precipitation change impact
  const precipChange = predictedPrecip - currentPrecip;
  const precipModifier = 1 + (precipChange * 0.0001); // 0.01% change per mm
  
  return Math.max(0.5, Math.min(1.5, tempModifier * precipModifier)); // Clamp between 0.5 and 1.5
};

const calculateAnnualCarbonWithGrowth = (matureRate: number, year: number): number => {
  // Growth curve: slow start, rapid growth, then plateau
  let growthFactor = 0;
  if (year === 1) growthFactor = 0.05;
  else if (year === 2) growthFactor = 0.15;
  else if (year === 3) growthFactor = 0.30;
  else if (year === 4) growthFactor = 0.50;
  else if (year === 5) growthFactor = 0.70;
  else if (year === 6) growthFactor = 0.85;
  else growthFactor = 0.95;
  
  return matureRate * growthFactor;
};

const ForestImpactCalculator: React.FC<ForestImpactCalculatorProps> = ({ latitude, longitude, years, selectedTreeType, selectedTrees, treePercentages, selectedRegion, onYearsChange, onDataReady }) => {

  const [soil, setSoil] = useState<SoilData | null>(null);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch soil and climate data for the selected location
  useEffect(() => {
    if (latitude && longitude) {
      // Validate inputs
      if (!validateLatitude(latitude) || !validateLongitude(longitude) || !validateYears(years)) {
        setError('Invalid coordinates or years provided. Years must be between 1-100.');
        return;
      }
      
      setLoading(true);
      setError(null);
      Promise.allSettled([
        fetchSoilData(latitude, longitude),
        fetchClimateData(latitude, longitude)
      ])
        .then((results) => {
          const [soilResult, climateResult] = results;
          
          if (soilResult.status === 'fulfilled') {
            setSoil(soilResult.value);
          } else {
            console.log('Soil data failed:', soilResult.reason);
            setSoil({ carbon: null, ph: null });
          }
          
          if (climateResult.status === 'fulfilled') {
            setClimate(climateResult.value);
          } else {
            console.log('Climate data fetch failed:', climateResult.reason);
            setClimate({ temperature: null, precipitation: null });
            setError('Weather API temporarily unavailable - using regional climate estimates based on latitude');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setSoil(null);
      setClimate(null);
    }
  }, [latitude, longitude, years]);

  const calculateImpact = (
    lat: number,
    lng: number,
    soil?: SoilData,
    climate?: ClimateData,
    treeType?: TreeType,
    treeTypes?: TreeType[]
  ): ImpactMetrics => {
    // Handle multiple trees with percentage distribution
    let carbonBase = 0;
    let biodiversityBase = 0;
    let resilienceBase = 0;
    
    if (treeTypes && treeTypes.length > 0) {
      if (treePercentages && Object.values(treePercentages).reduce((sum, p) => sum + (p || 0), 0) === 100) {
        // Use percentage distribution
        treeTypes.forEach(tree => {
          const percentage = treePercentages[tree.id] || 0;
          const weight = percentage / 100;
          carbonBase += tree.carbonSequestration * weight;
          biodiversityBase += tree.biodiversityValue * weight;
          resilienceBase += tree.resilienceScore * weight;
        });
      } else {
        // Fallback to equal distribution
        const carbonSum = treeTypes.reduce((sum, tree) => sum + tree.carbonSequestration, 0);
        const biodiversitySum = treeTypes.reduce((sum, tree) => sum + tree.biodiversityValue, 0);
        const resilienceSum = treeTypes.reduce((sum, tree) => sum + tree.resilienceScore, 0);
        
        carbonBase = carbonSum / treeTypes.length;
        biodiversityBase = biodiversitySum / treeTypes.length;
        resilienceBase = resilienceSum / treeTypes.length;
      }
    } else if (treeType) {
      // Single tree type
      carbonBase = treeType.carbonSequestration;
      biodiversityBase = treeType.biodiversityValue;
      resilienceBase = treeType.resilienceScore;
    } else {
      // No trees selected - return zero values
      carbonBase = 0;
      biodiversityBase = 0;
      resilienceBase = 0;
    }
    
    // Apply environmental modifiers
    if (soil?.carbon) carbonBase += soil.carbon / 10;
    if (climate?.precipitation) resilienceBase += climate.precipitation / 1000;
    
    const carbonSequestration = carbonBase;
    const biodiversityImpact = Math.min(5, biodiversityBase);
    const forestResilience = Math.min(5, resilienceBase);

    // Water retention calculation
    let waterBase = 70; // Default base
    
    // Only apply geographic assumptions if we don't have actual climate data
    if (climate?.precipitation === null || climate?.precipitation === undefined) {
      // Use geographic fallbacks when no precipitation data available
      waterBase = Math.abs(lat) < 30 ? 85 : Math.abs(lat) < 60 ? 75 : 70;
    } else {
      // Use actual precipitation data to calculate water retention
      // Higher precipitation means better water retention potential
      const precipBonus = climate.precipitation > 1500 ? 15 : climate.precipitation > 1000 ? 10 : climate.precipitation > 500 ? 5 : 0;
      waterBase = Math.max(60, Math.min(90, 70 + precipBonus));
    }
    
    // Water retention improves over time as soil structure develops
    const waterRetention = Math.min(95, waterBase + (years * 0.3)); // Improves by ~0.3% per year, max 95%

    // Air quality improves over time as trees mature and grow larger
    // Base air quality improvement varies by climate zone (more impact in polluted areas)
    let airQualityBase = 60; // Default temperate zone
    
    // Only apply geographic assumptions if we don't have actual climate data
    if (climate?.temperature === null || climate?.temperature === undefined || 
        climate?.precipitation === null || climate?.precipitation === undefined) {
      // Use geographic fallbacks when no climate data available
      if (Math.abs(lat) < 30) {
        airQualityBase = 70; // Tropical - higher impact due to year-round growth and dense vegetation
      } else if (Math.abs(lat) < 60) {
        airQualityBase = 60; // Temperate - moderate impact
      } else {
        airQualityBase = 50; // Boreal/Arctic - lower impact due to shorter growing seasons
      }
    } else {
      // Use actual climate data to adjust air quality impact
      // Higher temperatures and precipitation generally mean better air quality improvement potential
      const tempBonus = climate.temperature > 20 ? 5 : climate.temperature > 10 ? 0 : -5;
      const precipBonus = climate.precipitation > 1000 ? 3 : climate.precipitation > 500 ? 0 : -3;
      airQualityBase = Math.max(40, Math.min(80, 60 + tempBonus + precipBonus));
    }
    
    const airQualityImprovement = Math.min(95, airQualityBase + (years * 0.7)); // Improves by ~0.7% per year, max 95%

    return {
      carbonSequestration: Math.max(0, carbonSequestration),
      biodiversityImpact: Math.max(0, biodiversityImpact),
      forestResilience: Math.max(0, forestResilience),
      waterRetention: Math.max(0, waterRetention),
      airQualityImprovement: Math.max(0, airQualityImprovement)
    };
  };

  // Calculate impact and all derived values BEFORE early returns to ensure consistent hook order
  const impact = calculateImpact(
    latitude || 0,
    longitude || 0,
    soil || undefined,
    climate || undefined,
    selectedTreeType || undefined,
    selectedTrees || undefined
  );
  
  // Calculate cumulative carbon with realistic growth model and climate predictions
  const calculateCumulativeCarbon = (annualRate: number, years: number): number => {
    let total = 0;
    
    // Only apply climate predictions if we have actual climate data
    const hasClimateData = climate?.temperature !== null && climate?.temperature !== undefined && 
                          climate?.precipitation !== null && climate?.precipitation !== undefined;
    
    for (let year = 1; year <= years; year++) {
      // Growth curve: slow start, rapid growth, then plateau
      // Year 1: 5% of mature rate
      // Year 2: 15% of mature rate  
      // Year 3: 30% of mature rate
      // Year 4: 50% of mature rate
      // Year 5: 70% of mature rate
      // Year 6: 85% of mature rate
      // Year 7+: 95% of mature rate (approaching full maturity)
      
      let growthFactor = 0;
      if (year === 1) growthFactor = 0.05;
      else if (year === 2) growthFactor = 0.15;
      else if (year === 3) growthFactor = 0.30;
      else if (year === 4) growthFactor = 0.50;
      else if (year === 5) growthFactor = 0.70;
      else if (year === 6) growthFactor = 0.85;
      else growthFactor = 0.95;
      
      let combinedGrowthFactor = growthFactor;
      
      // Only apply climate prediction if we have actual climate data
      if (hasClimateData) {
        const climatePrediction = predictFutureClimate(
          climate.temperature!,
          climate.precipitation!,
          climate?.historicalData,
          year,
          latitude || 0
        );
        
        // Combine tree growth factor with climate modifier
        combinedGrowthFactor = growthFactor * climatePrediction.growthModifier;
      }
      
      total += annualRate * combinedGrowthFactor;
    }
    return total;
  };
  
  const totalCarbon = calculateCumulativeCarbon(impact.carbonSequestration, years);
  const totalCarbonLabel = years === 1 ? 'Total Carbon (1 year)' : `Total Carbon (${years} years)`;
  
  // Calculate cumulative biodiversity and resilience with growth model and climate predictions
  const calculateCumulativeImpact = (annualRate: number, years: number): number => {
    let total = 0;
    
    // Only apply climate predictions if we have actual climate data
    const hasClimateData = climate?.temperature !== null && climate?.temperature !== undefined && 
                          climate?.precipitation !== null && climate?.precipitation !== undefined;
    
    for (let year = 1; year <= years; year++) {
      // Similar growth curve for biodiversity and resilience
      let growthFactor = 0;
      if (year === 1) growthFactor = 0.10;
      else if (year === 2) growthFactor = 0.25;
      else if (year === 3) growthFactor = 0.45;
      else if (year === 4) growthFactor = 0.65;
      else if (year === 5) growthFactor = 0.80;
      else if (year === 6) growthFactor = 0.90;
      else growthFactor = 0.95;
      
      let combinedGrowthFactor = growthFactor;
      
      // Only apply climate prediction if we have actual climate data
      if (hasClimateData) {
        const climatePrediction = predictFutureClimate(
          climate.temperature!,
          climate.precipitation!,
          climate?.historicalData,
          year,
          latitude || 0
        );
        
        // Combine tree growth factor with climate modifier
        combinedGrowthFactor = growthFactor * climatePrediction.growthModifier;
      }
      
      total += annualRate * combinedGrowthFactor;
    }
    return total / years; // Return average over the period
  };
  
  const averageBiodiversity = calculateCumulativeImpact(impact.biodiversityImpact, years);
  const averageResilience = calculateCumulativeImpact(impact.forestResilience, years);

  // Calculate meaningful comparisons
  const getComparisons = (totalCarbon: number) => {
    const comparisons = [];
    
    // Car emissions comparison (average car emits ~4.6 metric tons CO2/year)
    const carEmissions = 4600; // kg CO2/year
    const carYears = totalCarbon / carEmissions;
    if (carYears >= 0.1) {
      comparisons.push(`${carYears.toFixed(1)} year${carYears !== 1 ? 's' : ''} of average car emissions`);
    }
    
    // Flight comparison (one round-trip flight NY-London emits ~986 kg CO2)
    const flightEmissions = 986; // kg CO2 per round trip
    const flights = totalCarbon / flightEmissions;
    if (flights >= 0.1) {
      comparisons.push(`${flights.toFixed(1)} round-trip flight${flights !== 1 ? 's' : ''} (NY-London)`);
    }
    
    // Household electricity comparison (average US household emits ~7.5 metric tons CO2/year)
    const householdEmissions = 7500; // kg CO2/year
    const householdYears = totalCarbon / householdEmissions;
    if (householdYears >= 0.1) {
      comparisons.push(`${householdYears.toFixed(1)} year${householdYears !== 1 ? 's' : ''} of average household electricity`);
    }
    
    return comparisons;
  };

  const comparisons = getComparisons(totalCarbon);

  // Call onDataReady when data is ready - wrapped in useEffect to avoid render-time state updates
  useEffect(() => {
    if (onDataReady && latitude && longitude && !loading && !error) {
      onDataReady({
        metadata: {
          timestamp: new Date().toISOString(),
          simulatorVersion: "1.0.0",
          location: {
            latitude,
            longitude,
            region: selectedRegion
          },
          simulation: {
            years,
            selectedTrees: selectedTrees || (selectedTreeType ? [selectedTreeType] : []),
            treePercentages: treePercentages || {}
          }
        },
        environmentalData: {
          soil,
          climate
        },
        impactResults: {
          carbonSequestration: impact.carbonSequestration,
          biodiversityImpact: impact.biodiversityImpact,
          forestResilience: impact.forestResilience,
          waterRetention: impact.waterRetention,
          airQualityImprovement: impact.airQualityImprovement,
          totalCarbon,
          averageBiodiversity,
          averageResilience
        }
      });
    }
  }, [onDataReady, latitude, longitude, loading, error, selectedRegion, years, selectedTrees, selectedTreeType, treePercentages, soil, climate]);

  // Early return checks - must be after all hooks and calculations
  if (!latitude || !longitude) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Select a location on the map to see the potential impact of planting a forest there.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Loading environmental data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Forest Impact Simulation</h3>

      {selectedRegion && (
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Selected Region</h4>
          <p className="text-xs text-black">
            <strong>Area:</strong> {selectedRegion.north.toFixed(4)}°N to {selectedRegion.south.toFixed(4)}°S,
            {selectedRegion.east.toFixed(4)}°E to {selectedRegion.west.toFixed(4)}°W
          </p>
          <p className="text-xs text-black mt-1">
            <strong>Analysis based on center point:</strong> {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
          </p>
        </div>
      )}

      <div className="mb-6">
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
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-gray-500 w-8 text-center">100</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Environmental Data</h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li><strong>Soil Carbon:</strong> {soil?.carbon !== undefined && soil.carbon !== null ? `${soil.carbon.toFixed(1)} g/kg` : 'N/A'}</li>
          <li><strong>Soil pH:</strong> {soil?.ph !== undefined && soil.ph !== null ? soil.ph.toFixed(1) : 'N/A'}</li>
          <li>
            <strong>Current Temperature:</strong> 
            <span 
              className="cursor-help text-gray-900 ml-1"
              title={(!climate?.temperature || !climate?.precipitation) ? "Using regional estimates based on latitude (tropical, temperate, boreal, or arctic climate zones) for calculations." : "Real-time temperature data from weather stations"}
            >
              {climate?.temperature !== undefined && climate.temperature !== null ? `${climate.temperature.toFixed(1)}°C` : 'N/A (estimated from latitude)'}
            </span>
          </li>
          <li>
            <strong>Current Precipitation:</strong> 
            <span 
              className="cursor-help text-gray-900 ml-1"
              title={(!climate?.temperature || !climate?.precipitation) ? "Using regional estimates based on latitude (tropical, temperate, boreal, or arctic climate zones) for calculations." : "Real-time precipitation data from weather stations"}
            >
              {climate?.precipitation !== undefined && climate.precipitation !== null ? `${climate.precipitation.toFixed(1)} mm` : 'N/A (estimated from latitude)'}
            </span>
          </li>
          {climate?.historicalData && climate.historicalData.temperatures.length > 0 && (
            <>
              <li><strong>Climate Trend:</strong> {calculateLinearTrend(climate.historicalData.years, climate.historicalData.temperatures).toFixed(3)}°C/year</li>
              <li><strong>Historical Data:</strong> {climate.historicalData.years.length} years available</li>
            </>
          )}
        </ul>
      </div>

      {selectedTrees && selectedTrees.length > 0 && (
        <div className="mb-4 flex flex-col bg-white rounded shadow p-4 max-w-3xl w-full">
          <span className="text-xs font-bold text-gray-700 mb-2">Selected Trees: {selectedTrees.length} species</span>
          <ul className="space-y-2 text-xs text-gray-700">
            {selectedTrees.map((tree) => {
              const percentage = treePercentages?.[tree.id] || 0;
              return (
                <li key={tree.id} className="flex flex-col sm:flex-row sm:items-center sm:gap-2 break-words">
                  <span className="font-medium">{tree.name} <span className="font-normal text-gray-500">- {tree.scientificName}</span></span>
                  <span className="text-gray-600">({tree.carbonSequestration} kg CO₂/year)</span>
                  {selectedTrees.length > 1 && percentage > 0 && (
                    <span className="text-green-700 font-medium">({percentage}%)</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-gray-600 mt-3">
            {selectedTrees.length > 1 && treePercentages && Object.values(treePercentages).reduce((sum, p) => sum + (p || 0), 0) === 100 
              ? <><strong>Weighted avg:</strong> {impact.carbonSequestration.toFixed(1)} kg CO₂/year</>
              : <><strong>Average:</strong> {(selectedTrees.reduce((sum, tree) => sum + tree.carbonSequestration, 0) / selectedTrees.length).toFixed(1)} kg CO₂/year per tree</>
            }
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 max-w-5xl w-full">
        <Tooltip 
          content="Current year's carbon sequestration based on tree growth stage. Trees start with low sequestration and increase as they mature over 20+ years."
          className="flex flex-col bg-white rounded shadow p-4 cursor-help"
        >
          <span className="text-xs text-gray-500 mb-1">
            Annual Carbon Sequestration (Year {years})
          </span>
          <span className="text-primary font-bold text-lg">{calculateAnnualCarbonWithGrowth(impact.carbonSequestration, years).toFixed(1)} kg CO₂/year</span>
        </Tooltip>
        
        <Tooltip 
          content={climate?.temperature !== null && climate?.temperature !== undefined && 
                   climate?.precipitation !== null && climate?.precipitation !== undefined 
                   ? "Total carbon sequestered over the entire simulation period, accounting for tree growth and climate predictions"
                   : "Total carbon sequestered over the entire simulation period, accounting for tree growth (climate predictions excluded due to unavailable data)"}
          className="flex flex-col bg-white rounded shadow p-4 cursor-help"
        >
          <span className="text-xs text-gray-500 mb-1">
            {totalCarbonLabel}
          </span>
          <span className="text-primary font-bold text-lg">{totalCarbon.toFixed(1)} kg CO₂</span>
        </Tooltip>
        
        <Tooltip 
          content="Measures ecosystem diversity and habitat quality. Higher values indicate better biodiversity support and wildlife habitat creation."
          className="flex flex-col bg-white rounded shadow p-4 cursor-help"
        >
          <span className="text-xs text-gray-500 mb-1">
            Biodiversity Impact (avg over {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{averageBiodiversity.toFixed(1)}/5</span>
        </Tooltip>
        
        <Tooltip 
          content="Forest's ability to withstand climate change, pests, and disturbances. Higher values indicate more resilient ecosystems."
          className="flex flex-col bg-white rounded shadow p-4 cursor-help"
        >
          <span className="text-xs text-gray-500 mb-1">
            Forest Resilience (avg over {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{averageResilience.toFixed(1)}/5</span>
        </Tooltip>
        
        <Tooltip 
          content="Percentage of rainfall retained in soil and groundwater. Improves over time as tree roots develop and soil structure improves."
          className="flex flex-col bg-white rounded shadow p-4 cursor-help"
        >
          <span className="text-xs text-gray-500 mb-1">
            Water Retention (after {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{impact.waterRetention.toFixed(0)}%</span>
        </Tooltip>
        
        <Tooltip 
          content="Reduction in air pollution through particle filtration and oxygen production. Improves as trees mature and canopy develops."
          className="flex flex-col bg-white rounded shadow p-4 cursor-help"
        >
          <span className="text-xs text-gray-500 mb-1">
            Air Quality Improvement (after {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{impact.airQualityImprovement.toFixed(0)}%</span>
        </Tooltip>
      </div>

      {comparisons.length > 0 && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Real-world Impact Comparison</h4>
          <p className="text-sm text-green-700 mb-2">
            This forest would sequester the equivalent of:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            {comparisons.map((comparison, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span><strong>{comparison}</strong></span>
              </li>
            ))}
          </ul>
        </div>
      )}


    </div>
  );
};

export default ForestImpactCalculator; 