"use client";

import React, { useState } from 'react';
import LocationMap from '@/components/LocationMap';
import ForestImpactCalculator from '@/components/ForestImpactCalculator';
import TreeTypeSelector from '@/components/TreeTypeSelector';
import TreePlantingCalculator from '@/components/TreePlantingCalculator';
import ExportResults from '@/components/ExportResults';
import { TreeType } from '@/types/treeTypes';
import { ExportData } from '@/utils/exportUtils';

export default function Home() {
  const [simulationMode, setSimulationMode] = useState<'planting' | 'clear-cutting'>('planting');
  const [selectedLatitude, setSelectedLatitude] = useState<number | null>(null);
  const [selectedLongitude, setSelectedLongitude] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [years, setYears] = useState<number>(50);
  const [calculationMode, setCalculationMode] = useState<'perTree' | 'perArea'>('perArea');
  const [averageTreeAge, setAverageTreeAge] = useState<number>(20);
  const [selectedTrees, setSelectedTrees] = useState<TreeType[]>([]);
  const [treePercentages, setTreePercentages] = useState<{ [key: string]: number }>({});
  const [plantingData, setPlantingData] = useState<{
    area: number;
    totalTrees: number;
    spacing: number;
    density: number;
  } | null>(null);
  
  // Soil and climate data state
  const [soilData, setSoilData] = useState<{ carbon: number; ph: number } | null>(null);
  const [climateData, setClimateData] = useState<{ temperature: number; precipitation: number; historicalData?: { years: number[]; temperatures: number[] } } | null>(null);

  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false
  });
  const [exportData, setExportData] = useState<ExportData | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLatitude(lat);
    setSelectedLongitude(lng);
    // Clear any existing region selection when point is selected
    setSelectedRegion(null);
  };

  const handleSearchLocation = (lat: number, lng: number, name: string) => {
    setSelectedLatitude(lat);
    setSelectedLongitude(lng);
    // Clear any existing region selection when location is searched
    setSelectedRegion(null);
    // You could add a toast notification here to show the searched location
    console.log(`Searched for: ${name} at ${lat}, ${lng}`);
  };

  const handleRegionSelect = (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    setSelectedRegion(bounds);
    // Clear any existing point selection when region is selected
    setSelectedLatitude(null);
    setSelectedLongitude(null);
    // Clear planting data as it needs to be recalculated
    setPlantingData(null);
  };

  const handleTreeSelectionChange = (trees: TreeType[]) => {
    setSelectedTrees(trees);
    // Clear percentages when trees change
    const newPercentages: { [key: string]: number } = {};
    trees.forEach(tree => {
      newPercentages[tree.id] = 0;
    });
    setTreePercentages(newPercentages);
    // Clear planting data as it needs to be recalculated
    setPlantingData(null);
  };

  const handleTreePercentagesChange = (percentages: { [key: string]: number }) => {
    setTreePercentages(percentages);
    // Clear planting data as it needs to be recalculated
    setPlantingData(null);
  };

  const handleImpactDataReady = (data: Partial<ExportData>) => {
    try {
      setExportData(prev => prev ? { ...prev, ...data } : data as ExportData);
    } catch (error) {
      console.warn('Error updating impact data:', error);
    }
  };

  const handlePlantingDataReady = (data: Partial<ExportData>) => {
    try {
      setExportData(prev => prev ? { ...prev, ...data } : data as ExportData);
      // Store planting data for ForestImpactCalculator
      if (data.plantingData) {
        setPlantingData(data.plantingData);
      }
    } catch (error) {
      console.warn('Error updating planting data:', error);
    }
  };

  const handleSoilClimateDataReady = (soil: { carbon: number; ph: number } | null, climate: { temperature: number; precipitation: number; historicalData?: { years: number[]; temperatures: number[] } } | null) => {
    setSoilData(soil);
    setClimateData(climate);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="container mx-auto max-w-7xl">
        <section className="text-center mb-8" aria-labelledby="main-heading">
          <h1 id="main-heading" className="text-4xl font-bold text-center mb-2">
            Simulate the Impact of Forest Management
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto text-center">
            Use real-time data to analyze the impacts of forest planting and clear-cutting on carbon storage, biodiversity, economic value, social outcomes, and land use.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-primary/20">
              <span className="w-3 h-3 bg-primary rounded-full mr-3"></span>
              <span className="font-medium">Real-time environmental data</span>
            </div>
            <div className="flex items-center text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-primary/20">
              <span className="w-3 h-3 bg-primary rounded-full mr-3"></span>
              <span className="font-medium">Climate prediction modeling</span>
            </div>
            <div className="flex items-center text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-primary/20">
              <span className="w-3 h-3 bg-primary rounded-full mr-3"></span>
              <span className="font-medium"><a href="https://github.com/KarimOsmanGH/forest-impact-simulator" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">TypeScript</a>, <a href="https://github.com/KarimOsmanGH/forest-impact-simulator-python" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">Python</a>, <a href="https://github.com/KarimOsmanGH/forest-impact-simulator-r" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">R</a></span>
            </div>
          </div>
        </section>
        
        {/* Simulation Mode Selector */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="bg-white border border-primary/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Simulation Mode:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSimulationMode('planting')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      simulationMode === 'planting'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🌱 Planting
                  </button>
                  <button
                    onClick={() => setSimulationMode('clear-cutting')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      simulationMode === 'clear-cutting'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🪓 Clear-cutting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white border border-primary/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full text-lg">📍</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Select Location</h2>
                <p className="text-sm text-gray-600">
                  <strong>Desktop:</strong> Press CTRL + mouse click and drag.<br />
                  <strong>Mobile:</strong> Tap to create a selection square, then drag to resize.
                </p>
              </div>
            </div>
            <LocationMap 
              onLocationSelect={handleLocationSelect}
              onRegionSelect={handleRegionSelect}
              onSearchLocation={handleSearchLocation}
            />
          </div>
          
          <div className="bg-white border border-primary/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full text-lg">🌳</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {simulationMode === 'planting' ? 'Choose Tree Species' : 'Select Tree Species'}
                </h2>
                <p className="text-sm text-gray-600">
                  {simulationMode === 'planting' 
                    ? 'Select one or multiple tree types and set their distribution'
                    : 'Select the tree species to be removed and their composition'
                  }
                </p>
              </div>
            </div>
            <div className="flex-1">
              <TreeTypeSelector
                selectedTrees={selectedTrees}
                onTreeSelectionChange={handleTreeSelectionChange}
                treePercentages={treePercentages}
                onTreePercentagesChange={handleTreePercentagesChange}
                latitude={selectedLatitude || undefined}
                selectedRegion={selectedRegion}
                simulationMode={simulationMode}
              />
            </div>
          </div>
        </div>
        
        {/* Combined Calculator and Impact Results - Full Width */}
        <div className="mt-24">
          <div className="bg-white border border-primary/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full text-lg">
                {simulationMode === 'planting' ? '🌱' : '🪓'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Impact Results</h2>
                <p className="text-sm text-gray-600">
                  {simulationMode === 'planting' 
                    ? 'Calculate planting details and see environmental benefits'
                    : 'Calculate removal details and see environmental impacts'
                  }
                </p>
              </div>
            </div>
            
            {(selectedRegion || (selectedLatitude && selectedLongitude)) && selectedTrees.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calculator Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {simulationMode === 'planting' ? 'Planting Calculations' : 'Removal Configuration'}
                  </h3>
                  <TreePlantingCalculator
                    selectedRegion={selectedRegion || (selectedLatitude && selectedLongitude ? {
                      north: selectedLatitude + 0.01,
                      south: selectedLatitude - 0.01,
                      east: selectedLongitude + 0.01,
                      west: selectedLongitude - 0.01
                    } : null)}
                    selectedTreeType={selectedTrees.length === 1 ? selectedTrees[0] : null}
                    selectedTrees={selectedTrees}
                    treePercentages={treePercentages}
                    onDataReady={handlePlantingDataReady}
                    simulationMode={simulationMode}
                    years={years}
                    onYearsChange={setYears}
                    onCalculationModeChange={setCalculationMode}
                    onTreeAgeChange={setAverageTreeAge}
                    soil={soilData}
                    climate={climateData}
                  />
                </div>
                
                {/* Impact Results Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Impact Analysis</h3>
                  <ForestImpactCalculator 
                    latitude={selectedLatitude || (selectedRegion ? (selectedRegion.north + selectedRegion.south) / 2 : null)}
                    longitude={selectedLongitude || (selectedRegion ? (selectedRegion.east + selectedRegion.west) / 2 : null)}
                    years={years}
                    selectedTreeType={selectedTrees.length === 1 ? selectedTrees[0] : null}
                    selectedTrees={selectedTrees.length > 1 ? selectedTrees : undefined}
                    treePercentages={treePercentages}
                    selectedRegion={selectedRegion}
                    plantingData={plantingData}
                    onYearsChange={setYears}
                    onDataReady={handleImpactDataReady}
                    simulationMode={simulationMode}
                    calculationMode={calculationMode}
                    averageTreeAge={averageTreeAge}
                    onSoilClimateDataReady={handleSoilClimateDataReady}
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  {simulationMode === 'planting' 
                    ? 'Select a region and tree types to see planting calculations and environmental impact analysis.'
                    : 'Select a region and forest type to see removal calculations and environmental impact analysis.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Export Results Section */}
        <div className="mt-12 bg-white border border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-primary text-white rounded-full text-lg">📤</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Export Results</h2>
              <p className="text-sm text-gray-600">Download your analysis in GeoJSON, JSON, or CSV format</p>
            </div>
          </div>
          <ExportResults 
            exportData={exportData || {
              metadata: {
                timestamp: new Date().toISOString(),
                simulatorVersion: "1.0.0",
                location: {
                  latitude: selectedLatitude,
                  longitude: selectedLongitude,
                  region: selectedRegion
                },
                simulation: {
                  years,
                  selectedTrees,
                  treePercentages
                }
              },
              environmentalData: {},
              impactResults: {
                carbonSequestration: 0,
                biodiversityImpact: 0,
                forestResilience: 0,
                waterRetention: 0,
                airQualityImprovement: 0,
                totalCarbon: 0,
                averageBiodiversity: 0,
                averageResilience: 0
              }
            }}
            disabled={!selectedTrees.length || (!selectedLatitude && !selectedLongitude && !selectedRegion)}
          />
        </div>
        



        
                  {/* FAQ Section */}
          <div className="mt-24">
          <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-lg font-semibold">?</span>
          Frequently Asked Questions
        </h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {/* FAQ Item 1 - Who made this tool and how can I contribute? */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 1: !prev[1] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">Who made this tool and how can I contribute?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[1] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[1] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    The Forest Impact Simulator was created by <a href="https://kar.im" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">Karim Osman</a> to simulate and analyze the environmental impact of forest planting and clear-cutting operations. This tool is completely open-source and available on GitHub. The simulator is available as a <a href="https://github.com/KarimOsmanGH/forest-impact-simulator" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">TypeScript (web)</a>, <a href="https://github.com/KarimOsmanGH/forest-impact-simulator-python" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">Python notebook</a>, and <a href="https://github.com/KarimOsmanGH/forest-impact-simulator-r" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">R notebook</a>. We welcome contributions from the community! Whether you&apos;re a developer, environmental scientist, or forestry expert, there are many ways to help improve this simulator.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 2 - What is planting mode and how does it work? */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 2: !prev[2] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What is planting mode and how does it work?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[2] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[2] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    Planting mode allows you to analyze the environmental benefits of forest restoration and tree planting operations. This mode is useful for:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-2">
                    <li><strong>Reforestation Projects:</strong> Planning and quantifying the benefits of tree planting initiatives</li>
                    <li><strong>Carbon Offset Planning:</strong> Calculating potential carbon sequestration from new forests</li>
                    <li><strong>Biodiversity Restoration:</strong> Understanding how tree planting can enhance local ecosystems</li>
                    <li><strong>Environmental Planning:</strong> Evaluating the long-term environmental benefits of forest restoration</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    In planting mode, the simulator shows carbon sequestration (positive values) representing the carbon that would be absorbed from the atmosphere as trees grow and mature. The interface shows "recommended species for this region" and displays planting configurations with timelines for project completion.
                  </p>
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-3">
                    <p className="text-sm text-primary">
                      <strong>Note:</strong> This tool is for educational and planning purposes. Always consult with forestry professionals and environmental experts before making real-world decisions about forest management.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Item 3 - What is clear-cutting mode and how does it work? */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 3: !prev[3] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What is clear-cutting mode and how does it work?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[3] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[3] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    Clear-cutting mode allows you to analyze the environmental impacts of forest removal operations. This mode is useful for:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-2">
                    <li><strong>Environmental Impact Assessment:</strong> Understanding the carbon emissions and biodiversity loss from forest removal</li>
                    <li><strong>Land Use Planning:</strong> Evaluating the trade-offs of converting forested areas to other uses</li>
                    <li><strong>Policy Analysis:</strong> Quantifying the environmental costs of deforestation</li>
                    <li><strong>Educational Purposes:</strong> Demonstrating the value of existing forests</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    In clear-cutting mode, the simulator shows carbon emissions (positive values) representing the carbon that would be released into the atmosphere, including both immediate emissions from tree removal and the lost future sequestration capacity. You can specify the average age of trees in the forest area to get more accurate calculations. The interface adapts to show "forest types present in this region" instead of "recommended species" and displays removal configurations with tree age settings.
                  </p>
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-3">
                    <p className="text-sm text-primary">
                      <strong>Note:</strong> This tool is for educational and planning purposes. Always consult with forestry professionals and environmental experts before making real-world decisions about forest management.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Item 4 - What do the different impact analysis tabs show? */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 3: !prev[3] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What do the different impact analysis tabs show?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[3] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[3] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    The impact analysis is organized into four comprehensive tabs, each focusing on different aspects of forest impact:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-2">
                    <li><strong>Environment Tab:</strong> Core environmental metrics including soil data, climate information, carbon sequestration/emissions, biodiversity impact, forest resilience, water retention, and air quality improvement. This is the most detailed tab with real-time environmental data integration.</li>
                    <li><strong>Economic Tab:</strong> Economic benefits such as job creation estimates, conservation value, and economic impact calculations based on forest size and type.</li>
                    <li><strong>Social Tab:</strong> Community benefits, social impact scores, and societal value of forest restoration or the social costs of forest removal.</li>
                    <li><strong>Land Use Tab:</strong> Land management impacts including erosion reduction, soil improvement, habitat creation, and land use change effects.</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    Each tab provides detailed metrics, real-world comparisons, and context-specific information to help you understand the full scope of forest impact in your selected region.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 4 - Combined Carbon Sequestration & Growth Model */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 4: !prev[4] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">How accurate are the carbon sequestration estimates?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[1] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[1] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    Our estimates are based on <a href="https://www.ipcc.ch/report/ar4/wg1/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">IPCC Fourth Assessment Report</a> data, with species-specific rates ranging from 15-30 kg CO₂/year for mature trees. We apply realistic growth curves that account for the fact that young trees sequester much less carbon than mature ones.
                  </p>
                  <p className="text-gray-900 mb-3">
                    <strong>Growth Model:</strong> Trees don&apos;t reach full capacity immediately. Our realistic model shows: Year 1-3 (5-15% of mature rate), Year 4-10 (15-80% of mature rate), Year 11-20 (80-95% of mature rate), and Year 20+ (95-100% of mature rate). This reflects real-world tree growth patterns and provides more accurate long-term projections.
                  </p>
                  <p className="text-gray-900 mb-3">
                    The simulator also factors in local soil conditions and climate data for more accurate predictions.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 2 - Tree Selection */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 2: !prev[2] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What&apos;s the difference between single and multiple tree selection?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[2] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[2] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    Single tree selection uses the specific carbon sequestration rate of that species. Multiple tree selection allows you to create a mixed forest with custom percentage distributions. You can either use the &quot;Equal Split&quot; option for balanced distribution or manually set percentages for each species to reflect your forest management strategy.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 3 - Combined Environmental Factors & Benefits */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 3: !prev[3] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">How are environmental factors calculated and what benefits do they provide?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[3] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[3] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    <strong>Environmental Data Sources:</strong> The simulator uses real-time data from multiple sources: Soil carbon content from <a href="https://soilgrids.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">ISRIC SoilGrids</a> (adds 0.1 kg CO₂/year per g/kg of soil carbon), climate data from <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">Open-Meteo</a> (precipitation affects forest resilience), and biodiversity data from <a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">GBIF</a> (Global Biodiversity Information Facility). When climate data is unavailable, the simulator uses geographic fallbacks to ensure calculations remain accurate.
                  </p>
                  <p className="text-gray-900 mb-3">
                    <strong>Environmental Benefits Calculated:</strong> Beyond carbon sequestration, the simulator calculates biodiversity impact (how well the forest supports wildlife), forest resilience (ability to withstand climate stresses), water retention (improved soil moisture and reduced runoff), and air quality improvement (pollution filtration). These metrics provide a comprehensive view of the forest&apos;s environmental contribution.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 4 - Time Periods */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 4: !prev[4] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">Why should I simulate different time periods?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[4] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[4] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    Different time periods show how forest impact compounds over time. Short-term simulations (1-5 years) show immediate benefits like soil stabilization and initial carbon capture. Long-term simulations (10-100 years) reveal the full potential for carbon sequestration, biodiversity enhancement, and ecosystem restoration. This helps in planning both immediate and long-term environmental strategies.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 5 - Real-world Applications */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 5: !prev[5] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">How can I use this simulator for real-world projects?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[5] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[5] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    The simulator is perfect for planning reforestation projects, urban tree planting initiatives, carbon offset programs, and environmental impact assessments. Use it to compare different tree species for your climate zone, estimate long-term environmental benefits, analyze the impacts of forest removal, and communicate the impact of your projects to stakeholders. The region-specific data ensures your calculations are relevant to your actual forest management area.
                  </p>
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-3">
                    <p className="text-sm text-primary font-medium">
                      ⚠️ <strong>Disclaimer:</strong> This simulator is for educational and planning purposes only. Use at your own risk. Always consult with forestry professionals, environmental experts, and local authorities before implementing any real-world projects.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Item 6 - Formulas & Calculations */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 6: !prev[6] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What formulas and calculations does the simulator use?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[6] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[6] && (
                <div className="px-6 pb-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-black mb-2">Carbon Sequestration</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-black">
                        <p className="mb-2"><strong>Weighted Average Formula:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2">Carbon = Σ(Tree_i × Percentage_i) / 100</code>
                        <p className="mb-2"><strong>Environmental Modifiers:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2">Soil Bonus = Soil Carbon (g/kg) × 0.1 kg CO₂/year</code>
                        <code className="block bg-white p-2 rounded mb-2">Final Carbon = Base Carbon + Soil Bonus</code>
                        <p className="mt-2 text-sm text-black"><strong>Display Values:</strong></p>
                        <code className="block bg-white p-2 rounded text-black">Annual Carbon = Yearly sequestration rate</code>
                        <code className="block bg-white p-2 rounded text-black">Total Carbon = Cumulative over entire simulation period</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Tree Growth Model</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-black">
                        <p className="mb-2"><strong>4-Phase Growth Model:</strong></p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-black">
                          <div><strong>Years 1-3:</strong> Establishment phase (5-15% of mature rate)</div>
                          <div><strong>Years 4-10:</strong> Rapid growth phase (15-80% of mature rate)</div>
                          <div><strong>Years 11-20:</strong> Maturation phase (80-95% of mature rate)</div>
                          <div><strong>Years 20+:</strong> Mature phase (95-100% of mature rate)</div>
                        </div>
                        <p className="mt-2 text-sm text-black"><strong>Annual Carbon Calculation:</strong></p>
                        <code className="block bg-white p-2 rounded text-black">Annual Carbon = Mature Rate × Growth Factor (based on year)</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Climate Prediction</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-black">
                        <p className="mb-2"><strong>Temperature Trend Analysis:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Historical Data = 11 years of temperature records</code>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Linear Regression = Calculate temperature trend (°C/year)</code>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Future Temperature = Current + (Trend × Years)</code>
                        <p className="mt-2 mb-2 text-sm text-black"><strong>Growth Modifier:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Temperature Change = Future Temp - Current Temp</code>
                        <code className="block bg-white p-2 rounded text-black">Growth Modifier = 1 + (Temperature Change × 0.02)</code>
                        <p className="mt-2 text-sm text-black"><strong>Regional Estimates (fallback):</strong></p>
                        <code className="block bg-white p-2 rounded text-black">Tropical: 25°C, Temperate: 15°C, Boreal: 5°C, Arctic: -5°C</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Biodiversity Impact</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-black">
                        <p className="mb-2"><strong>Species Diversity Score:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Base Score = Average biodiversity value (1-5)</code>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Multiplier = 1 + (Number of species - 1) × 0.1</code>
                        <code className="block bg-white p-2 rounded text-black">Final Score = min(Base Score × Multiplier, 5)</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Forest Resilience</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-black">
                        <p className="mb-2"><strong>Resilience Calculation:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Base Resilience = Average resilience score (1-5)</code>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Climate Bonus = Precipitation (mm) × 0.001</code>
                        <code className="block bg-white p-2 rounded text-black">Final Resilience = min(Base + Climate Bonus, 5)</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Water Retention</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-black">
                        <p className="mb-2"><strong>Progressive Enhancement:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Base Retention = 70-85% (based on latitude)</code>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Annual Improvement = 0.3% per year</code>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Precipitation Bonus = Annual Precipitation (mm) × 0.01</code>
                        <code className="block bg-white p-2 rounded text-black">Water Retention = min(Base + (Years × 0.3) + Bonus, 95%)</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Air Quality Improvement</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm text-black">
                        <p className="mb-2"><strong>Progressive Enhancement:</strong></p>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Base Quality = 60%</code>
                        <code className="block bg-white p-2 rounded mb-2 text-black">Annual Improvement = 0.7% per year</code>
                        <code className="block bg-white p-2 rounded text-black">Air Quality = min(Base + (Years × 0.7), 95%)</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-black mb-2">Mathematical Notation</h4>
                      <div className="bg-gray-50 p-3 rounded text-base text-black">
                        <ul className="space-y-2">
                          <li><strong>Σ:</strong> Summation across all selected tree species</li>
                          <li><strong>Tree_i:</strong> Carbon sequestration rate of tree species i</li>
                          <li><strong>Percentage_i:</strong> User-specified percentage for tree species i</li>
                          <li><strong>n:</strong> Number of selected tree species</li>
                          <li><strong>Years:</strong> Simulation duration in years</li>
                          <li><strong>min():</strong> Function returning the minimum value (capping at maximum)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Item 7 - Tree Database */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 7: !prev[7] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What tree species are included in the database?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[7] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[7] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    Our comprehensive tree database includes 80 species from around the world, covering diverse ecosystems and 7 major climate zones:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-1">
                    <li><strong>Temperate Trees:</strong> Oak, Beech, Ash, Maple, Birch, and European/North American species</li>
                    <li><strong>Coniferous Trees:</strong> Pine, Spruce, Cedar, Redwood, and other evergreens</li>
                    <li><strong>Tropical Trees:</strong> Mahogany, Teak, Mango, Mangrove, and tropical hardwoods</li>
                    <li><strong>Mediterranean Trees:</strong> Olive, Cork Oak, Aleppo Pine, and Mediterranean climate species</li>
                    <li><strong>Boreal Trees:</strong> Black Spruce, White Spruce, Balsam Fir, Tamarack, Jack Pine, and northern forest species</li>
                    <li><strong>Arid Zone Trees:</strong> Mesquite, Palo Verde, Desert Ironwood, Joshua Tree, and drought-resistant species</li>
                    <li><strong>Subtropical Trees:</strong> Live Oak, Bald Cypress, Southern Magnolia, Pecan, and warm climate species</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    Each tree species includes detailed data on carbon sequestration rates, growth characteristics, biodiversity value, climate preferences, and environmental impact factors. The database is continuously updated with new species and improved data.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 8 - Export Features */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 8: !prev[8] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What export formats are available and how can I use them?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[8] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[8] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    The simulator offers three export formats to suit different use cases:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-2">
                    <li><strong>GeoJSON:</strong> Perfect for GIS professionals and mapping tools. Includes point features (analysis location) and polygon features (forest region) with all environmental metrics as properties.</li>
                    <li><strong>JSON:</strong> Complete data export for developers and data analysis. Contains all simulation parameters, environmental data, impact results, and forest management specifications in structured format.</li>
                    <li><strong>CSV:</strong> Spreadsheet-friendly format organized by sections (metadata, trees, environmental data, results, forest data) for reporting and analysis.</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    All exports include timestamps and are automatically generated once you complete your analysis. Files are downloaded directly to your browser with descriptive filenames.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 9 - Impact Analysis Tabs */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 9: !prev[9] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What do the different impact analysis tabs show?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[9] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[9] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    The simulator provides comprehensive impact analysis across four specialized tabs:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-2">
                    <li><strong>Environment:</strong> Soil data, climate information, carbon sequestration rates, biodiversity impact, forest resilience, water retention, and air quality improvement. Shows both current environmental conditions and projected benefits.</li>
                    <li><strong>Economic:</strong> Job creation estimates based on project scale and conservation benefits. Focuses on employment opportunities and ecosystem services rather than monetary values.</li>
                    <li><strong>Social:</strong> Community benefits, social impact scores, and factors like tree diversity bonuses, time investment, and area scale. Highlights recreational, educational, and community engagement opportunities.</li>
                    <li><strong>Land Use:</strong> Erosion reduction, soil quality improvement, habitat creation, and water quality enhancement. Shows how the forest improves land management and ecosystem health.</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    Each tab provides detailed metrics and qualitative benefits, helping you understand the full scope of your forest planting project&apos;s impact.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 10 - Who Made This & How to Contribute */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 10: !prev[10] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">What is clear-cutting mode and how does it work?</h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen[10] ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {faqOpen[10] && (
                <div className="px-6 pb-6">
                  <p className="text-gray-900 mb-3">
                    Clear-cutting mode allows you to analyze the environmental impacts of forest removal operations. This mode is useful for:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-2">
                    <li><strong>Environmental Impact Assessment:</strong> Understanding the carbon emissions and biodiversity loss from forest removal</li>
                    <li><strong>Land Use Planning:</strong> Evaluating the trade-offs of converting forested areas to other uses</li>
                    <li><strong>Policy Analysis:</strong> Quantifying the environmental costs of deforestation</li>
                    <li><strong>Educational Purposes:</strong> Demonstrating the value of existing forests</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    In clear-cutting mode, the simulator shows carbon emissions (positive values) representing the carbon that would be released into the atmosphere, including both immediate emissions from tree removal and the lost future sequestration capacity. The interface adapts to show "forest types present in this region" instead of "recommended species" and displays removal configurations instead of planting timelines.
                  </p>
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-3">
                    <p className="text-sm text-primary">
                      <strong>Note:</strong> This tool is for educational and planning purposes. Always consult with forestry professionals and environmental experts before making real-world decisions about forest management.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
