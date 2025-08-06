"use client";

import React, { useEffect, useState } from 'react';
import { TreeType } from '@/types/treeTypes';
import { validateLatitude, validateLongitude, validateYears, apiRateLimiter } from '@/utils/security';

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
    
    console.log('Fetching soil data for:', lat, lon);
    
    // Use the ISRIC SoilGrids API endpoint with correct properties
    const res = await fetch(`https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=soc&property=phh2o&depth=0-5cm&value=mean`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ForestFuture/1.0'
      }
    });
    
    if (!res.ok) {
      console.log('Soil API response not ok:', res.status, res.statusText);
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
    console.log('Soil data fetch error:', error);
    // Return null values instead of throwing error to allow other data to load
    return { carbon: null, ph: null };
  }
};

const fetchClimateData = async (lat: number, lon: number): Promise<ClimateData> => {
  try {
    // Validate coordinates
    if (!validateLatitude(lat) || !validateLongitude(lon)) {
      throw new Error('Invalid coordinates');
    }
    
    // Rate limiting
    if (!apiRateLimiter.isAllowed('climate')) {
      console.log('Rate limit exceeded for climate API');
      throw new Error('Rate limit exceeded');
    }
    
    console.log('Fetching climate data for:', lat, lon);
    
    // Get current weather and daily precipitation
    const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=precipitation_sum&timezone=auto`;
    console.log('Current weather URL:', currentUrl);
    
    const currentRes = await fetch(currentUrl);
    
    console.log('Current weather response status:', currentRes.status, currentRes.statusText);
    console.log('Current weather response headers:', Object.fromEntries(currentRes.headers.entries()));
    
    if (!currentRes.ok) {
      console.log('Climate API response not ok:', currentRes.status, currentRes.statusText);
      throw new Error(`Climate API error: ${currentRes.status} ${currentRes.statusText}`);
    }
    
    const currentData = await currentRes.json();
    console.log('Current climate API response:', currentData);
    
    // Get current temperature and precipitation
    const temperature = currentData.current_weather?.temperature;
    let precipitation = null;
    if (currentData.daily?.precipitation_sum && currentData.daily.precipitation_sum.length > 0) {
      precipitation = currentData.daily.precipitation_sum[0]; // Today's precipitation
    }
    
    console.log('Extracted current climate data:', { temperature, precipitation });
    
    // Get historical climate data for the past 10 years to establish baseline and trends
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 10);
    
    console.log('Fetching historical data from:', startDate.toISOString().split('T')[0], 'to:', endDate.toISOString().split('T')[0]);
    
    const historicalUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
    console.log('Historical weather URL:', historicalUrl);
    
    const historicalRes = await fetch(historicalUrl);
    
    console.log('Historical weather response status:', historicalRes.status, historicalRes.statusText);
    
    let historicalData = undefined;
    if (historicalRes.ok) {
      const historicalDataResponse = await historicalRes.json();
      console.log('Historical climate data response:', historicalDataResponse);
      
      if (historicalDataResponse.daily) {
        // Calculate yearly averages from daily data
        const yearlyData = new Map<number, { temps: number[], preps: number[] }>();
        
        historicalDataResponse.daily.time.forEach((dateStr: string, index: number) => {
          const year = new Date(dateStr).getFullYear();
          const temp = historicalDataResponse.daily.temperature_2m_mean[index];
          const prep = historicalDataResponse.daily.precipitation_sum[index];
          
          if (!yearlyData.has(year)) {
            yearlyData.set(year, { temps: [], preps: [] });
          }
          yearlyData.get(year)!.temps.push(temp);
          yearlyData.get(year)!.preps.push(prep);
        });
        
        // Calculate yearly averages
        const years: number[] = [];
        const temperatures: number[] = [];
        const precipitations: number[] = [];
        
        yearlyData.forEach((data, year) => {
          years.push(year);
          temperatures.push(data.temps.reduce((a, b) => a + b, 0) / data.temps.length);
          precipitations.push(data.preps.reduce((a, b) => a + b, 0) / data.preps.length);
        });
        
        historicalData = { temperatures, precipitations, years };
        console.log('Processed historical data:', historicalData);
      }
    } else {
      console.log('Historical climate API failed:', historicalRes.status, historicalRes.statusText);
    }
    
    console.log('Final climate data:', { temperature, precipitation, historicalData });
    return { temperature, precipitation, historicalData };
  } catch (error) {
    console.log('Climate data fetch error:', error);
    console.log('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
};

// Predict future climate conditions based on historical trends
const predictFutureClimate = (
  currentTemp: number | null,
  currentPrecip: number | null,
  historicalData: { temperatures: number[]; precipitations: number[]; years: number[] } | undefined,
  year: number,
  latitude: number
): ClimatePrediction => {
  // If we have no current data, estimate based on latitude
  let temp = currentTemp;
  let precip = currentPrecip;
  
  if (temp === null || temp === undefined) {
    // Estimate temperature based on latitude (rough approximation)
    const absLat = Math.abs(latitude);
    if (absLat < 23.5) { // Tropical
      temp = 25 + (Math.random() - 0.5) * 10; // 20-30°C
    } else if (absLat < 45) { // Temperate
      temp = 15 + (Math.random() - 0.5) * 15; // 7.5-22.5°C
    } else if (absLat < 66.5) { // Boreal
      temp = 5 + (Math.random() - 0.5) * 10; // 0-10°C
    } else { // Arctic
      temp = -5 + (Math.random() - 0.5) * 10; // -10-0°C
    }
  }
  
  if (precip === null || precip === undefined) {
    // Estimate precipitation based on latitude and coastal proximity
    const absLat = Math.abs(latitude);
    if (absLat < 23.5) { // Tropical
      precip = 1500 + (Math.random() - 0.5) * 1000; // 1000-2000mm
    } else if (absLat < 45) { // Temperate
      precip = 800 + (Math.random() - 0.5) * 600; // 500-1100mm
    } else if (absLat < 66.5) { // Boreal
      precip = 400 + (Math.random() - 0.5) * 400; // 200-600mm
    } else { // Arctic
      precip = 200 + (Math.random() - 0.5) * 200; // 100-300mm
    }
  }
  
  if (!historicalData || historicalData.temperatures.length < 3) {
    // Not enough historical data, use current conditions with slight warming trend
    const tempTrend = 0.02; // 0.02°C per year warming (IPCC estimate)
    const precipTrend = 0.01; // 1% increase per year (varies by region)
    
    return {
      temperature: temp + (tempTrend * year),
      precipitation: precip * Math.pow(1 + precipTrend, year),
      growthModifier: 1.0
    };
  }
  
  // Calculate trends from historical data
  const tempTrend = calculateLinearTrend(historicalData.years, historicalData.temperatures);
  const precipTrend = calculateLinearTrend(historicalData.years, historicalData.precipitations);
  
  // Predict future conditions
  const predictedTemp = temp + (tempTrend * year);
  const predictedPrecip = precip * Math.pow(1 + precipTrend, year);
  
  // Calculate growth modifier based on predicted conditions
  const growthModifier = calculateGrowthModifier(predictedTemp, predictedPrecip, temp, precip);
  
  return {
    temperature: predictedTemp,
    precipitation: predictedPrecip,
    growthModifier
  };
};

// Calculate linear trend (slope) from time series data
const calculateLinearTrend = (years: number[], values: number[]): number => {
  const n = years.length;
  if (n < 2) return 0;
  
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = years.reduce((sum, year, i) => sum + year * values[i], 0);
  const sumXX = years.reduce((sum, year) => sum + year * year, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
};

// Calculate growth modifier based on climate conditions
const calculateGrowthModifier = (
  predictedTemp: number,
  predictedPrecip: number,
  currentTemp: number,
  currentPrecip: number
): number => {
  // Temperature effects on growth
  const tempChange = predictedTemp - currentTemp;
  const tempModifier = 1.0 + (tempChange * 0.02); // 2% change per degree
  
  // Precipitation effects on growth
  const precipChange = (predictedPrecip - currentPrecip) / currentPrecip;
  const precipModifier = 1.0 + (precipChange * 0.5); // 50% of precipitation change affects growth
  
  // Combined modifier (geometric mean)
  const combinedModifier = Math.sqrt(tempModifier * precipModifier);
  
  // Clamp to reasonable bounds (0.5 to 2.0)
  return Math.max(0.5, Math.min(2.0, combinedModifier));
};

// Calculate realistic annual carbon sequestration based on tree growth
const calculateAnnualCarbonWithGrowth = (matureRate: number, year: number): number => {
  // Tree growth curve: slow start, rapid growth, then plateau
  // Year 1-3: Establishment phase (5-15% of mature rate)
  // Year 4-10: Rapid growth phase (15-80% of mature rate)  
  // Year 11-20: Maturation phase (80-95% of mature rate)
  // Year 20+: Mature phase (95-100% of mature rate)
  
  if (year <= 3) {
    // Establishment phase - very low sequestration
    return matureRate * (0.05 + (year - 1) * 0.05); // 5%, 10%, 15%
  } else if (year <= 10) {
    // Rapid growth phase - exponential increase
    const growthPhase = (year - 3) / 7; // 0 to 1 over 7 years
    return matureRate * (0.15 + growthPhase * 0.65); // 15% to 80%
  } else if (year <= 20) {
    // Maturation phase - slowing growth
    const maturationPhase = (year - 10) / 10; // 0 to 1 over 10 years
    return matureRate * (0.80 + maturationPhase * 0.15); // 80% to 95%
  } else {
    // Mature phase - full sequestration
    return matureRate * (0.95 + Math.min((year - 20) / 10, 0.05)); // 95% to 100%
  }
};


const ForestImpactCalculator: React.FC<ForestImpactCalculatorProps> = ({ latitude, longitude, years, selectedTreeType, selectedTrees, treePercentages, selectedRegion, onYearsChange }) => {

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
  }, [latitude, longitude]);

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

    let waterBase = Math.abs(lat) < 30 ? 85 : Math.abs(lat) < 60 ? 75 : 70;
    if (climate?.precipitation) waterBase += climate.precipitation / 100;
    // Water retention improves over time as soil structure develops
    const waterRetention = Math.min(95, waterBase + (years * 0.3)); // Improves by ~0.3% per year, max 95%

    // Air quality improves over time as trees mature and grow larger
    const airQualityBase = 60;
    const airQualityImprovement = Math.min(95, airQualityBase + (years * 0.7)); // Improves by ~0.7% per year, max 95%

    return {
      carbonSequestration: Math.max(0, carbonSequestration),
      biodiversityImpact: Math.max(0, biodiversityImpact),
      forestResilience: Math.max(0, forestResilience),
      waterRetention: Math.max(0, waterRetention),
      airQualityImprovement: Math.max(0, airQualityImprovement)
    };
  };

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

  const impact = calculateImpact(
    latitude,
    longitude,
    soil || undefined,
    climate || undefined,
    selectedTreeType || undefined,
    selectedTrees || undefined
  );
  
  // Calculate cumulative carbon with realistic growth model and climate predictions
  const calculateCumulativeCarbon = (annualRate: number, years: number): number => {
    let total = 0;
    const currentTemp = climate?.temperature || 15; // Default to 15°C if no data
    const currentPrecip = climate?.precipitation || 1000; // Default to 1000mm if no data
    
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
      
      // Apply climate prediction for this year
      const climatePrediction = predictFutureClimate(
        currentTemp,
        currentPrecip,
        climate?.historicalData,
        year,
        latitude
      );
      
      // Combine tree growth factor with climate modifier
      const combinedGrowthFactor = growthFactor * climatePrediction.growthModifier;
      
      total += annualRate * combinedGrowthFactor;
    }
    return total;
  };
  
  const totalCarbon = calculateCumulativeCarbon(impact.carbonSequestration, years);
  const totalCarbonLabel = years === 1 ? 'Total Carbon (1 year)' : `Total Carbon (${years} years)`;
  
  // Calculate cumulative biodiversity and resilience with growth model and climate predictions
  const calculateCumulativeImpact = (annualRate: number, years: number): number => {
    let total = 0;
    const currentTemp = climate?.temperature || 15; // Default to 15°C if no data
    const currentPrecip = climate?.precipitation || 1000; // Default to 1000mm if no data
    
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
      
      // Apply climate prediction for this year
      const climatePrediction = predictFutureClimate(
        currentTemp,
        currentPrecip,
        climate?.historicalData,
        year,
        latitude
      );
      
      // Combine tree growth factor with climate modifier
      const combinedGrowthFactor = growthFactor * climatePrediction.growthModifier;
      
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
        {years > 1 && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            <strong>🌡️ Climate Prediction Active:</strong> Tree growth calculations include predicted temperature and precipitation changes over {years} years based on historical trends.
          </div>
        )}
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
        <div className="flex flex-col bg-white rounded shadow p-4">
          <span 
            className="text-xs text-gray-500 mb-1 cursor-help"
            title="Current year's carbon sequestration based on tree growth stage. Trees start with low sequestration and increase as they mature over 20+ years."
          >
            Annual Carbon Sequestration (Year {years})
          </span>
          <span className="text-primary font-bold text-lg">{calculateAnnualCarbonWithGrowth(impact.carbonSequestration, years).toFixed(1)} kg CO₂/year</span>
        </div>
        <div className="flex flex-col bg-white rounded shadow p-4">
          <span 
            className="text-xs text-gray-500 mb-1 cursor-help"
            title="Total carbon sequestered over the entire simulation period, accounting for tree growth and climate predictions"
          >
            {totalCarbonLabel}
          </span>
          <span className="text-primary font-bold text-lg">{totalCarbon.toFixed(1)} kg CO₂</span>
        </div>
        <div className="flex flex-col bg-white rounded shadow p-4">
          <span 
            className="text-xs text-gray-500 mb-1 cursor-help"
            title="Measures ecosystem diversity and habitat quality. Higher values indicate better biodiversity support and wildlife habitat creation."
          >
            Biodiversity Impact (avg over {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{averageBiodiversity.toFixed(1)}/5</span>
        </div>
        <div className="flex flex-col bg-white rounded shadow p-4">
          <span 
            className="text-xs text-gray-500 mb-1 cursor-help"
            title="Forest's ability to withstand climate change, pests, and disturbances. Higher values indicate more resilient ecosystems."
          >
            Forest Resilience (avg over {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{averageResilience.toFixed(1)}/5</span>
        </div>
        <div className="flex flex-col bg-white rounded shadow p-4">
          <span 
            className="text-xs text-gray-500 mb-1 cursor-help"
            title="Percentage of rainfall retained in soil and groundwater. Improves over time as tree roots develop and soil structure improves."
          >
            Water Retention (after {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{impact.waterRetention.toFixed(0)}%</span>
        </div>
        <div className="flex flex-col bg-white rounded shadow p-4">
          <span 
            className="text-xs text-gray-500 mb-1 cursor-help"
            title="Reduction in air pollution through particle filtration and oxygen production. Improves as trees mature and canopy develops."
          >
            Air Quality Improvement (after {years} year{years !== 1 ? 's' : ''})
          </span>
          <span className="text-primary font-bold text-lg">{impact.airQualityImprovement.toFixed(0)}%</span>
        </div>
      </div>

      <div className="mt-6 p-3 bg-green-800 border border-green-800 rounded">
        <p className="text-sm text-white">
          Planting a forest at this location could sequester approximately{' '}
          <strong>{totalCarbon.toFixed(0)} kg of CO₂</strong> over {years} year{years !== 1 ? '' : 's'},
          helping to combat climate change and improve local biodiversity!
        </p>
                 {comparisons.length > 0 && (
           <p className="text-sm text-white mt-2">
             This equals {comparisons.slice(0, 2).join(' or ')}.
           </p>
         )}
      </div>


    </div>
  );
};

export default ForestImpactCalculator; 