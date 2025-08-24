"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TreeType } from '@/types/treeTypes';
import { validateLatitude, validateLongitude, apiRateLimiter } from '@/utils/security';
import { ExportData } from '@/utils/exportUtils';
import { calculateRegionArea, formatArea } from '@/utils/treePlanting';

// Simple cache for environmental data
const environmentalDataCache = new Map<string, {
  soil: SoilData;
  climate: ClimateData;
  timestamp: number;
}>();

// Cache timeout: 30 minutes
const CACHE_TIMEOUT = 30 * 60 * 1000;

// Simple fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  value: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  value, 
  description, 
  isExpanded, 
  onToggle, 
  className = "" 
}) => {
  return (
    <div className={`bg-white rounded shadow p-4 ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded transition-colors"
      >
        <div className="flex-1">
          <div className="text-xs text-gray-900 font-bold mb-1">{title}</div>
          <div className="text-primary font-bold text-sm">{value}</div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
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
  plantingData?: {
    area: number;
    totalTrees: number;
    spacing: number;
    density: number;
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
  carbon: number | null;
  ph: number | null;
}

interface ClimateData {
  temperature: number | null;
  precipitation: number | null;
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
    
    console.log('Fetching soil data for:', lat, lon);
    
    // Use the ISRIC SoilGrids API endpoint with timeout
    const res = await fetchWithTimeout(
      `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=soc&property=phh2o&depth=0-5cm&value=mean`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ForestFuture/1.0'
        }
      }
    );
    
    if (!res.ok) {
      throw new Error(`Soil API error: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Soil API response received');
    
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
    
    console.log('Soil data extracted:', { carbon, ph });
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
    
    // Fetch current weather data with timeout
    const weatherRes = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation&timezone=auto`
    );
    
    if (!weatherRes.ok) {
      throw new Error(`Weather API error: ${weatherRes.status} ${weatherRes.statusText}`);
    }
    
    const weatherData = await weatherRes.json();
    console.log('Current weather data received');
    
    // Fetch historical data for climate trend analysis (reduced to 5 years for performance)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5); // Reduced from 11 to 5 years
    
    const historicalRes = await fetchWithTimeout(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`
    );
    
    let historicalData = undefined;
    if (historicalRes.ok) {
      const historicalWeatherData = await historicalRes.json();
      console.log('Historical weather data received');
      
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
    
    console.log('Climate data extracted:', { currentTemp, currentPrecip, historicalData });
    return {
      temperature: currentTemp,
      precipitation: currentPrecip,
      historicalData
    };
  } catch (error) {
    console.error('Error fetching climate data:', error);
    // Log more specific error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.message.includes('Rate limit')) {
        console.error('Rate limit exceeded - try again in a minute');
      } else if (error.message.includes('Weather API error')) {
        console.error('Weather API is temporarily unavailable');
      } else if (error.message.includes('Request timeout')) {
        console.error('API request timed out');
      }
    }
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

const ForestImpactCalculator: React.FC<ForestImpactCalculatorProps> = ({ latitude, longitude, years, selectedTreeType, selectedTrees, treePercentages, selectedRegion, plantingData, onYearsChange, onDataReady }) => {

  const [soil, setSoil] = useState<SoilData | null>(null);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [calculationMode, setCalculationMode] = useState<'perTree' | 'entireArea'>('entireArea');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [activeEnvTab, setActiveEnvTab] = useState<'environment' | 'economic' | 'social' | 'landuse'>('environment');

  // Use planting data if available, otherwise calculate fallback
  const totalTrees = plantingData?.totalTrees || (selectedRegion ? calculateRegionArea(selectedRegion) * 1111 : 1);
  const treeSpacing = plantingData?.spacing || 3.0;

  // Calculate social, economic, and land use impacts with useMemo
  const socialImpact = useMemo(() => {
    const baseSocialScore = 3.5; // Base social benefit score (1-5)
    const treeDiversityBonus = selectedTrees && selectedTrees.length > 1 ? Math.min(selectedTrees.length * 0.2, 1) : 0;
    const timeBonus = Math.min(years * 0.02, 1); // Benefits increase over time
    const areaBonus = selectedRegion ? Math.min(calculateRegionArea(selectedRegion) * 0.1, 1) : 0;
    
    return Math.min(baseSocialScore + treeDiversityBonus + timeBonus + areaBonus, 5);
  }, [selectedTrees, years, selectedRegion]);



  const landUseImpact = useMemo(() => {
    // Use planting data area if available, otherwise calculate from selected region
    const area = plantingData?.area || (selectedRegion ? calculateRegionArea(selectedRegion) : 0);
    const erosionReduction = Math.min(area * 0.5, 95); // Erosion reduction percentage
    const soilImprovement = Math.min(years * 1.5, 80); // Soil quality improvement
    const habitatCreation = Math.min(area * 2, 90); // Habitat creation percentage
    const waterQuality = Math.min(years * 1.2, 85); // Water quality improvement
    
    return {
      erosionReduction,
      soilImprovement,
      habitatCreation,
      waterQuality
    };
  }, [selectedRegion, years, plantingData]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Fetch soil and climate data for the selected location with caching
  useEffect(() => {
    if (latitude && longitude) {
      // Validate inputs
      if (!validateLatitude(latitude) || !validateLongitude(longitude)) {
        setError('Invalid coordinates provided.');
        return;
      }
      
      // Check cache first
      const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
      const cachedData = environmentalDataCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TIMEOUT)) {
        console.log('Using cached environmental data');
        setSoil(cachedData.soil);
        setClimate(cachedData.climate);
        setLoading(false);
        setError(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      console.log('Fetching environmental data for:', latitude, longitude);
      
      Promise.allSettled([
        fetchSoilData(latitude, longitude),
        fetchClimateData(latitude, longitude)
      ])
        .then((results) => {
          const [soilResult, climateResult] = results;
          
          let soilData: SoilData = { carbon: null, ph: null };
          let climateData: ClimateData = { temperature: null, precipitation: null };
          
          if (soilResult.status === 'fulfilled') {
            soilData = soilResult.value;
            setSoil(soilData);
          } else {
            console.log('Soil data failed:', soilResult.reason);
            setSoil(soilData);
          }
          
          if (climateResult.status === 'fulfilled') {
            climateData = climateResult.value;
            setClimate(climateData);
          } else {
            console.log('Climate data fetch failed:', climateResult.reason);
            setClimate(climateData);
            setError('Weather API temporarily unavailable - using regional climate estimates based on latitude');
          }
          
          // Cache the results
          environmentalDataCache.set(cacheKey, {
            soil: soilData,
            climate: climateData,
            timestamp: Date.now()
          });
          
          console.log('Environmental data cached for:', cacheKey);
        })
        .catch((error) => {
          console.error('Unexpected error fetching environmental data:', error);
          setError('Failed to load environmental data. Please try again.');
        })
        .finally(() => setLoading(false));
    } else {
      setSoil(null);
      setClimate(null);
    }
  }, [latitude, longitude]);

  const calculateImpact = useCallback((
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
    
    // Apply calculation mode multiplier
    const multiplier = calculationMode === 'entireArea' ? totalTrees : 1;
    const carbonSequestration = carbonBase * multiplier;
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
  }, [treePercentages, calculationMode, totalTrees, years]);

  // Calculate impact and all derived values BEFORE early returns to ensure consistent hook order
  const impact = useMemo(() => calculateImpact(
    latitude || 0,
    longitude || 0,
    soil || undefined,
    climate || undefined,
    selectedTreeType || undefined,
    selectedTrees || undefined
  ), [latitude, longitude, soil, climate, selectedTreeType, selectedTrees, calculateImpact]);
  
  // Calculate cumulative carbon with realistic growth model and climate predictions
  const calculateCumulativeCarbon = useCallback((annualRate: number, years: number): number => {
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
  }, [climate, latitude]);
  
  const totalCarbon = useMemo(() => calculateCumulativeCarbon(impact.carbonSequestration, years), [impact.carbonSequestration, years, calculateCumulativeCarbon]);
  
  // Calculate job creation based on project scale
  const economicImpact = useMemo(() => {
    // Get area in hectares for more realistic job calculation
    const areaHectares = plantingData?.area || (selectedRegion ? calculateRegionArea(selectedRegion) : 0);
    
    // Realistic job creation based on area and project scale
    let jobCreation;
    if (areaHectares < 1) {
      jobCreation = 1; // Small projects: 1 person
    } else if (areaHectares < 5) {
      jobCreation = 2; // Small projects: 2 people (planting, maintenance)
    } else if (areaHectares < 20) {
      jobCreation = 3; // Medium projects: 3 people (planting, maintenance, monitoring)
    } else if (areaHectares < 50) {
      jobCreation = 5; // Larger projects: 5 people (team)
    } else if (areaHectares < 100) {
      jobCreation = 8; // Large projects: 8 people (full team)
    } else {
      jobCreation = Math.floor(areaHectares / 10); // Very large projects: 1 job per 10 hectares
    }
    
    return {
      jobCreation
    };
  }, [plantingData, selectedRegion]);
  
  // Format total carbon based on calculation mode
  const formatTotalCarbon = (carbon: number) => {
    if (calculationMode === 'perTree') {
      return carbon.toFixed(1);
    } else {
      // For entire area, show in metric tons for better readability
      const tons = carbon / 1000;
      return tons > 1000 ? `${(tons / 1000).toFixed(1)}k` : tons.toFixed(1);
    }
  };
  
  const getTotalCarbonUnit = () => {
    if (calculationMode === 'perTree') {
      return 'kg CO₂';
    } else {
      const tons = totalCarbon / 1000;
      return tons > 1000 ? 'metric tons CO₂' : 'metric tons CO₂';
    }
  };
  
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
    
    // Add area-specific comparisons for entire area mode
    if (calculationMode === 'entireArea' && selectedRegion) {
      const area = calculateRegionArea(selectedRegion);
      if (area > 0) {
        // Carbon sequestration per hectare
        const carbonPerHectare = (totalCarbon / 1000) / area;
        comparisons.push(`${carbonPerHectare.toFixed(1)} metric tons CO₂ per hectare over ${years} years`);
      }
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
  }, [onDataReady, latitude, longitude, loading, error, selectedRegion, years, selectedTrees, selectedTreeType, treePercentages, soil, climate, impact, totalCarbon, averageBiodiversity, averageResilience]);

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
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading environmental data...</span>
        </div>
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
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      {selectedRegion && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Selected Region</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-900 font-bold">Area size:</span>
              <p className="font-medium">{formatArea(calculateRegionArea(selectedRegion))}</p>
            </div>
            <div>
              <span className="text-gray-900 font-bold">Coordinates:</span>
              <p className="font-medium text-xs">
                {selectedRegion.south.toFixed(4)}°S to {selectedRegion.north.toFixed(4)}°N<br />
                {selectedRegion.west.toFixed(4)}°W to {selectedRegion.east.toFixed(4)}°E
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-gray-900 font-bold text-xs">Analysis based on center point:</span>
            <p className="font-medium text-xs">{latitude?.toFixed(4)}, {longitude?.toFixed(4)}</p>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4">
        {/* Calculation Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calculation Mode
            </label>
            {calculationMode === 'perTree' ? (
              <p className="text-xs text-gray-500">
                Showing impact per individual tree
              </p>
            ) : (
              <div className="text-xs text-gray-500">
                <p className="font-bold">Showing impact for entire area:</p>
                <ul className="mt-1">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>{totalTrees.toLocaleString()} trees at {treeSpacing}m spacing ({treeSpacing * treeSpacing}m² per tree)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCalculationMode('perTree')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                calculationMode === 'perTree'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Per Tree
            </button>
            <button
              onClick={() => setCalculationMode('entireArea')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                calculationMode === 'entireArea'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Entire Area
            </button>
          </div>
        </div>

        {/* Simulation Duration */}
        <div>
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
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Impact Analysis</h4>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-3 overflow-x-auto">
          <button
            onClick={() => setActiveEnvTab('environment')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeEnvTab === 'environment'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Environment
          </button>
          <button
            onClick={() => setActiveEnvTab('economic')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeEnvTab === 'economic'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Economic
          </button>
          <button
            onClick={() => setActiveEnvTab('social')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeEnvTab === 'social'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Social
          </button>
          <button
            onClick={() => setActiveEnvTab('landuse')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeEnvTab === 'landuse'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Land Use
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[100px]">
          {activeEnvTab === 'environment' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2">
                  Soil Data
                </h5>
                <div className="space-y-2 text-xs text-green-700">
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
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="text-xs text-green-700">
                        <span className="font-semibold">Carbon Bonus:</span> +{(soil.carbon * 0.1).toFixed(1)} kg CO₂/year per tree
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2">
                  Climate Data
                </h5>
                <div className="space-y-2 text-xs text-green-700">
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
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="text-xs text-green-700">
                        <span className="font-semibold">Climate Trend:</span> {calculateLinearTrend(climate.historicalData.years, climate.historicalData.temperatures).toFixed(3)}°C/year
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>
          )}



          {activeEnvTab === 'social' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                  Community Benefits
                </h5>
                <div className="space-y-2 text-xs text-green-700">
                  <div className="flex justify-between">
                    <span>Social Impact Score:</span>
                    <span className="font-medium">
                      {socialImpact.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tree Diversity Bonus:</span>
                    <span className="font-medium">
                      {selectedTrees && selectedTrees.length > 1 ? `+${Math.min(selectedTrees.length * 0.2, 1).toFixed(1)}` : '+0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Investment Bonus:</span>
                    <span className="font-medium">
                      +{Math.min(years * 0.02, 1).toFixed(1)}
                    </span>
                  </div>
                  {selectedRegion && (
                    <div className="flex justify-between">
                      <span>Area Scale Bonus:</span>
                      <span className="font-medium">
                        +{Math.min(calculateRegionArea(selectedRegion) * 0.1, 1).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                  Social Benefits
                </h5>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Recreational opportunities and outdoor activities</li>
                  <li>• Educational value for environmental learning</li>
                  <li>• Community engagement and volunteer opportunities</li>
                  <li>• Mental health benefits from green spaces</li>
                  <li>• Cultural and spiritual significance</li>
                  <li>• Social cohesion and community building</li>
                </ul>
              </div>
              
              <div className="text-xs text-gray-500 italic">
                Social impact increases with tree diversity, time investment, and project scale
              </div>
            </div>
          )}

          {activeEnvTab === 'economic' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                  Employment Impact
                </h5>
                <div className="space-y-2 text-xs text-green-700">
                  <div className="flex justify-between">
                    <span className="font-semibold">Jobs Created:</span>
                    <span className="font-medium">
                      {economicImpact.jobCreation} jobs
                    </span>
                  </div>
                  <div className="text-xs text-green-700 mt-2">
                    Based on typical forest project staffing needs for planting, maintenance, and monitoring.
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                  Conservation Benefits
                </h5>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Conservation and restoration employment opportunities</li>
                  <li>• Ecosystem services (clean water, air quality improvement)</li>
                  <li>• Biodiversity protection and habitat creation</li>
                  <li>• Environmental education and research opportunities</li>
                  <li>• Climate resilience and adaptation benefits</li>
                  <li>• Community engagement and stewardship</li>
                </ul>
              </div>
              

            </div>
          )}

          {activeEnvTab === 'landuse' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                  Land Use Improvements
                </h5>
                <div className="space-y-2 text-xs text-green-700">
                  {selectedRegion && (
                    <div className="flex justify-between">
                      <span>Erosion Reduction:</span>
                      <span className="font-medium">
                        {landUseImpact.erosionReduction.toFixed(0)}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Soil Quality Improvement:</span>
                    <span className="font-medium">
                      {landUseImpact.soilImprovement.toFixed(0)}%
                    </span>
                  </div>
                  {selectedRegion && (
                    <div className="flex justify-between">
                      <span>Habitat Creation:</span>
                      <span className="font-medium">
                        {landUseImpact.habitatCreation.toFixed(0)}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Water Quality Improvement:</span>
                    <span className="font-medium">
                      {landUseImpact.waterQuality.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                  Land Use Benefits
                </h5>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Soil erosion prevention and stabilization</li>
                  <li>• Improved soil fertility and structure</li>
                  <li>• Wildlife habitat creation and connectivity</li>
                  <li>• Water filtration and quality improvement</li>
                  <li>• Microclimate regulation and temperature moderation</li>
                  <li>• Land restoration and ecosystem recovery</li>
                </ul>
              </div>
              
              <div className="text-xs text-gray-500 italic">
                Land use improvements increase over time as the forest develops and matures
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTrees && selectedTrees.length > 0 && (
        <div className="mb-4 flex flex-col bg-white rounded shadow p-4 max-w-3xl w-full">
          <span className="text-xs font-bold text-gray-700 mb-2">
            Selected Trees: {selectedTrees.length} species
            {calculationMode === 'entireArea' && selectedRegion && (
              <span className="text-green-600 ml-2">• {totalTrees.toLocaleString()} total trees in area</span>
            )}
          </span>
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
            {selectedTrees.length === 0 
              ? <><span className="font-semibold">No trees selected</span></>
              : selectedTrees.length > 1 && treePercentages && Object.values(treePercentages).reduce((sum, p) => sum + (p || 0), 0) === 100 
                ? <><span className="font-semibold">Weighted avg:</span> {calculationMode === 'perTree' ? `${impact.carbonSequestration.toFixed(1)} kg CO₂/year` : `${(impact.carbonSequestration / totalTrees).toFixed(1)} kg CO₂/year per tree`}</>
                : <><span className="font-semibold">Average:</span> {calculationMode === 'perTree' ? `${(selectedTrees.reduce((sum, tree) => sum + tree.carbonSequestration, 0) / selectedTrees.length).toFixed(1)} kg CO₂/year per tree` : `${(selectedTrees.reduce((sum, tree) => sum + tree.carbonSequestration, 0) / selectedTrees.length).toFixed(1)} kg CO₂/year per tree`}</>
            }
          </p>
        </div>
      )}

      {/* Horizontal separator line */}
      <div className="my-6 border-t border-gray-200"></div>

      {/* Carbon Calculation Explanation */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>💡 Carbon Calculation Note:</strong> &ldquo;Annual Carbon Sequestration&rdquo; shows the yearly rate, while &ldquo;Total Carbon&rdquo; shows the cumulative amount over the entire simulation period (accounting for tree growth from sapling to maturity).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 max-w-5xl w-full">
        <CollapsibleSection
          title="Annual Carbon Sequestration"
          value={calculationMode === 'perTree' 
            ? `${calculateAnnualCarbonWithGrowth(impact.carbonSequestration, years).toFixed(1)} kg CO₂/yr`
            : `${(calculateAnnualCarbonWithGrowth(impact.carbonSequestration, years) / 1000).toFixed(1)} metric ton CO₂/yr`
          }
          description={calculationMode === 'perTree' 
            ? "Current year's carbon sequestration per tree based on growth stage. Trees start with low sequestration and increase as they mature over 20+ years."
            : `Current year's carbon sequestration for all ${totalTrees.toLocaleString()} trees in the selected area, based on tree growth stage. This is the yearly rate, not cumulative.`
          }
          isExpanded={expandedSections['annual-carbon'] || false}
          onToggle={() => toggleSection('annual-carbon')}
        />
        
        <CollapsibleSection
          title="Total Carbon"
          value={`${formatTotalCarbon(totalCarbon)} ${getTotalCarbonUnit().replace('metric tons', 't').replace('kg CO₂', 'kg CO₂')}`}
          description={calculationMode === 'perTree' 
            ? (climate?.temperature !== null && climate?.temperature !== undefined && 
               climate?.precipitation !== null && climate?.precipitation !== undefined 
               ? "Total carbon sequestered per tree over the entire simulation period, accounting for tree growth and climate predictions"
               : "Total carbon sequestered per tree over the entire simulation period, accounting for tree growth (climate predictions excluded due to unavailable data)")
            : `Total carbon sequestered by all ${totalTrees.toLocaleString()} trees over the entire simulation period, accounting for tree growth and climate predictions`
          }
          isExpanded={expandedSections['total-carbon'] || false}
          onToggle={() => toggleSection('total-carbon')}
        />
        
        <CollapsibleSection
          title="Biodiversity Impact"
          value={`${averageBiodiversity.toFixed(1)}/5`}
          description="Measures ecosystem diversity and habitat quality. Higher values indicate better biodiversity support and wildlife habitat creation."
          isExpanded={expandedSections['biodiversity'] || false}
          onToggle={() => toggleSection('biodiversity')}
        />
        
        <CollapsibleSection
          title="Forest Resilience"
          value={`${averageResilience.toFixed(1)}/5`}
          description="Forest's ability to withstand climate change, pests, and disturbances. Higher values indicate more resilient ecosystems."
          isExpanded={expandedSections['resilience'] || false}
          onToggle={() => toggleSection('resilience')}
        />
        
        <CollapsibleSection
          title="Water Retention"
          value={`${impact.waterRetention.toFixed(0)}%`}
          description="Percentage of rainfall retained in soil and groundwater. Improves over time as tree roots develop and soil structure improves."
          isExpanded={expandedSections['water-retention'] || false}
          onToggle={() => toggleSection('water-retention')}
        />
        
        <CollapsibleSection
          title="Air Quality Improvement"
          value={`${impact.airQualityImprovement.toFixed(0)}%`}
          description="Reduction in air pollution through particle filtration and oxygen production. Improves as trees mature and canopy develops."
          isExpanded={expandedSections['air-quality'] || false}
          onToggle={() => toggleSection('air-quality')}
        />
      </div>

      {comparisons.length > 0 && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Real-world Impact Comparison</h4>
          <p className="text-xs text-green-700 mb-2 font-bold">
            This forest would sequester the equivalent of:
          </p>
          <ul className="text-xs text-green-700 space-y-1">
            {comparisons.map((comparison, index) => {
              // Make numbers bold, including both the first number and "X years"
              const formattedText = comparison.replace(/(\d+\.?\d*)/g, '<strong>$1</strong>');
              return (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span dangerouslySetInnerHTML={{ __html: formattedText }} />
                </li>
              );
            })}
          </ul>
        </div>
      )}


    </div>
  );
};

export default ForestImpactCalculator; 