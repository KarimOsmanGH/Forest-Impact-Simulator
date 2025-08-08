/**
 * Export utilities for Forest Impact Simulator
 */

import { TreeType } from '@/types/treeTypes';

export interface ExportData {
  metadata: {
    timestamp: string;
    simulatorVersion: string;
    location: {
      latitude: number | null;
      longitude: number | null;
      region?: {
        north: number;
        south: number;
        east: number;
        west: number;
      } | null;
    };
    simulation: {
      years: number;
      selectedTrees: TreeType[];
      treePercentages: { [key: string]: number };
    };
  };
  environmentalData: {
    soil?: {
      carbon?: number | null;
      ph?: number | null;
      texture?: string;
    } | null;
    climate?: {
      temperature?: number | null;
      precipitation?: number | null;
      historicalData?: {
        temperatures: number[];
        precipitations: number[];
        years: number[];
      };
    } | null;
  };
  impactResults: {
    carbonSequestration: number;
    biodiversityImpact: number;
    forestResilience: number;
    waterRetention: number;
    airQualityImprovement: number;
    totalCarbon: number;
    averageBiodiversity: number;
    averageResilience: number;
  };
  plantingData?: {
    area: number;
    totalTrees: number;
    spacing: number;
    density: number;
    timeline: {
      yearsToComplete: number;
      treesPerSeason: number;
    };
  } | null;
}

export const generateGeoJSON = (data: ExportData): string => {
  const features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: number[] | number[][][];
    };
    properties: Record<string, string | number | null>;
  }> = [];
  
  // Add point feature for the selected location
  if (data.metadata.location.latitude && data.metadata.location.longitude) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [data.metadata.location.longitude, data.metadata.location.latitude]
      },
      properties: {
        name: "Forest Impact Analysis Point",
        carbonSequestration: data.impactResults.carbonSequestration,
        totalCarbon: data.impactResults.totalCarbon,
        biodiversityImpact: data.impactResults.biodiversityImpact,
        forestResilience: data.impactResults.forestResilience,
        waterRetention: data.impactResults.waterRetention,
        airQualityImprovement: data.impactResults.airQualityImprovement,
        simulationYears: data.metadata.simulation.years,
        selectedTreeCount: data.metadata.simulation.selectedTrees.length,
        treeSpecies: data.metadata.simulation.selectedTrees.map(t => t.name).join(", "),
        soilCarbon: data.environmentalData.soil?.carbon || null,
        temperature: data.environmentalData.climate?.temperature || null,
        precipitation: data.environmentalData.climate?.precipitation || null
      }
    });
  }
  
  // Add polygon feature for the selected region
  if (data.metadata.location.region) {
    const { north, south, east, west } = data.metadata.location.region;
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south]
        ]]
      },
      properties: {
        name: "Forest Planting Region",
        area: data.plantingData?.area || null,
        totalTrees: data.plantingData?.totalTrees || null,
        spacing: data.plantingData?.spacing || null,
        density: data.plantingData?.density || null,
        yearsToComplete: data.plantingData?.timeline.yearsToComplete || null,
        treesPerSeason: data.plantingData?.timeline.treesPerSeason || null
      }
    });
  }
  
  const geojson = {
    type: "FeatureCollection",
    features: features,
    properties: {
      title: "Forest Impact Simulator Export",
      description: `Forest impact analysis for ${data.metadata.simulation.years} years`,
      timestamp: data.metadata.timestamp,
      simulatorVersion: data.metadata.simulatorVersion
    }
  };
  
  return JSON.stringify(geojson, null, 2);
};

export const generateJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const generateCSV = (data: ExportData): string => {
  const csvRows: string[] = [];
  
  // Metadata section
  csvRows.push("METADATA");
  csvRows.push("Timestamp," + data.metadata.timestamp);
  csvRows.push("Simulator Version," + data.metadata.simulatorVersion);
  csvRows.push("Simulation Years," + data.metadata.simulation.years);
  
  // Location information - show both point and region if available
  if (data.metadata.location.latitude && data.metadata.location.longitude) {
    csvRows.push("Location Type,Point");
    csvRows.push("Latitude," + data.metadata.location.latitude);
    csvRows.push("Longitude," + data.metadata.location.longitude);
  }
  
  if (data.metadata.location.region) {
    csvRows.push("Location Type,Region");
    csvRows.push("Region North," + data.metadata.location.region.north);
    csvRows.push("Region South," + data.metadata.location.region.south);
    csvRows.push("Region East," + data.metadata.location.region.east);
    csvRows.push("Region West," + data.metadata.location.region.west);
  }
  
  csvRows.push("");
  
  // Selected Trees section
  csvRows.push("SELECTED TREES");
  csvRows.push("Name,Scientific Name,Carbon Sequestration (kg CO2/year),Percentage");
  data.metadata.simulation.selectedTrees.forEach(tree => {
    const percentage = data.metadata.simulation.treePercentages[tree.id] || 0;
    csvRows.push(`"${tree.name}","${tree.scientificName}",${tree.carbonSequestration},${percentage}%`);
  });
  csvRows.push("");
  
  // Environmental Data section
  csvRows.push("ENVIRONMENTAL DATA");
  csvRows.push("Metric,Value");
  if (data.environmentalData.soil) {
    csvRows.push(`Soil Carbon (g/kg),${data.environmentalData.soil.carbon || ""}`);
    csvRows.push(`Soil pH,${data.environmentalData.soil.ph || ""}`);
  }
  if (data.environmentalData.climate) {
    csvRows.push(`Temperature (°C),${data.environmentalData.climate.temperature || ""}`);
    csvRows.push(`Precipitation (mm),${data.environmentalData.climate.precipitation || ""}`);
  }
  csvRows.push("");
  
  // Impact Results section
  csvRows.push("IMPACT RESULTS");
  csvRows.push("Metric,Value");
  csvRows.push(`Annual Carbon Sequestration (kg CO2/year),${data.impactResults.carbonSequestration.toFixed(1)}`);
  csvRows.push(`Total Carbon (${data.metadata.simulation.years} years) (kg CO2),${data.impactResults.totalCarbon.toFixed(1)}`);
  csvRows.push(`Biodiversity Impact (avg),${data.impactResults.averageBiodiversity.toFixed(1)}/5`);
  csvRows.push(`Forest Resilience (avg),${data.impactResults.averageResilience.toFixed(1)}/5`);
  csvRows.push(`Water Retention (%),${data.impactResults.waterRetention.toFixed(0)}`);
  csvRows.push(`Air Quality Improvement (%),${data.impactResults.airQualityImprovement.toFixed(0)}`);
  csvRows.push("");
  
  // Planting Data section (if available)
  if (data.plantingData) {
    csvRows.push("PLANTING DATA");
    csvRows.push("Metric,Value");
    csvRows.push(`Area (hectares),${data.plantingData.area.toFixed(2)}`);
    csvRows.push(`Total Trees,${data.plantingData.totalTrees}`);
    csvRows.push(`Spacing (meters),${data.plantingData.spacing}`);
    csvRows.push(`Density (trees/hectare),${data.plantingData.density.toFixed(0)}`);
    csvRows.push(`Years to Complete,${data.plantingData.timeline.yearsToComplete}`);
    csvRows.push(`Trees per Season,${data.plantingData.timeline.treesPerSeason}`);
  }
  
  return csvRows.join("\n");
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatTimestamp = (): string => {
  return new Date().toISOString().replace(/[:.]/g, '-');
}; 