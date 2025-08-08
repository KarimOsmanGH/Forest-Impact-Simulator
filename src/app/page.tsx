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
  const [selectedLatitude, setSelectedLatitude] = useState<number | null>(null);
  const [selectedLongitude, setSelectedLongitude] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [years, setYears] = useState<number>(50);
  const [selectedTrees, setSelectedTrees] = useState<TreeType[]>([]);
  const [treePercentages, setTreePercentages] = useState<{ [key: string]: number }>({});

  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false
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
  };

  const handleTreeSelectionChange = (trees: TreeType[]) => {
    setSelectedTrees(trees);
    // Clear percentages when trees change
    const newPercentages: { [key: string]: number } = {};
    trees.forEach(tree => {
      newPercentages[tree.id] = 0;
    });
    setTreePercentages(newPercentages);
  };

  const handleTreePercentagesChange = (percentages: { [key: string]: number }) => {
    setTreePercentages(percentages);
  };

  const handleImpactDataReady = (data: Partial<ExportData>) => {
    setExportData(prev => prev ? { ...prev, ...data } : data as ExportData);
  };

  const handlePlantingDataReady = (data: Partial<ExportData>) => {
    setExportData(prev => prev ? { ...prev, ...data } : data as ExportData);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="container mx-auto max-w-7xl">
        <section className="text-center mb-8" aria-labelledby="main-heading">
          <h1 id="main-heading" className="text-4xl font-bold text-center mb-2">
            Analyze the Impact of Forest Planting
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
            Select a region on the map to analyze the environmental impact of planting a forest there. The simulator uses real-time soil, climate, and biodiversity data to estimate carbon sequestration, ecosystem benefits, and local species diversity.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-green-100">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              <span className="font-medium">Real-time environmental data</span>
            </div>
            <div className="flex items-center text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              <span className="font-medium">60+ tree species database</span>
            </div>
            <div className="flex items-center text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-purple-100">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              <span className="font-medium">Climate prediction modeling</span>
            </div>
          </div>
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full text-lg">📍</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Select Location</h2>
                <p className="text-sm text-gray-600">
                  <strong>Desktop:</strong> Press CTRL + mouse click and drag.<br />
                  <strong>Mobile:</strong> Tap to create a selection square, then drag to resize.
                </p>
              </div>
            </div>
            <div className="flex-1">
              <LocationMap 
                onLocationSelect={handleLocationSelect}
                onRegionSelect={handleRegionSelect}
                onSearchLocation={handleSearchLocation}
              />
            </div>
          </div>
          
          <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full text-lg">🌳</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Choose Tree Species</h2>
                <p className="text-sm text-gray-600">Select one or multiple tree types and set their distribution</p>
              </div>
            </div>
            <div className="flex-1">
              <TreeTypeSelector
                selectedTrees={selectedTrees}
                onTreeSelectionChange={handleTreeSelectionChange}
                treePercentages={treePercentages}
                onTreePercentagesChange={handleTreePercentagesChange}
                latitude={selectedLatitude || undefined}
              />
            </div>
          </div>
        </div>
        
        {/* Environmental Impact Results and Tree Planting Calculator - Side by Side */}
        <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-lg">📊</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Environmental Impact Results</h2>
                <p className="text-sm text-gray-600">See carbon sequestration, biodiversity, and environmental benefits</p>
              </div>
            </div>
            {selectedTrees.length > 0 ? (
              <ForestImpactCalculator 
                latitude={selectedLatitude || (selectedRegion ? (selectedRegion.north + selectedRegion.south) / 2 : null)} 
                longitude={selectedLongitude || (selectedRegion ? (selectedRegion.east + selectedRegion.west) / 2 : null)} 
                years={years}
                selectedTreeType={selectedTrees.length === 1 ? selectedTrees[0] : null}
                selectedTrees={selectedTrees.length > 1 ? selectedTrees : undefined}
                treePercentages={treePercentages}
                selectedRegion={selectedRegion}
                onYearsChange={setYears}
                onDataReady={handleImpactDataReady}
              />
            ) : (
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-600">Select tree types to see the potential impact of planting a forest at this location.</p>
              </div>
            )}
          </div>
          
          <div className="bg-white border border-green-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-600 text-white rounded-full text-lg">🌱</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Tree Planting Calculator</h2>
                <p className="text-sm text-gray-600">Calculate planting density, spacing, and timeline for your selected region</p>
              </div>
            </div>
            {(selectedRegion || (selectedLatitude && selectedLongitude)) && selectedTrees.length > 0 ? (
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
              />
            ) : (
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-600">Select a region and tree types to see planting calculations.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Export Results Section */}
        <div className="mt-12 bg-white border border-green-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full text-lg">📤</div>
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
          <span className="flex items-center justify-center w-8 h-8 bg-green-800 text-white rounded-full text-lg font-semibold">?</span>
          Frequently Asked Questions
        </h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {/* FAQ Item 1 - Combined Carbon Sequestration & Growth Model */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 1: !prev[1] }))}
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
                    Our estimates are based on <a href="https://www.ipcc.ch/report/ar4/wg1/" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 underline">IPCC Fourth Assessment Report</a> data, with species-specific rates ranging from 15-30 kg CO₂/year for mature trees. We apply realistic growth curves that account for the fact that young trees sequester much less carbon than mature ones.
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
                    Single tree selection uses the specific carbon sequestration rate of that species. Multiple tree selection allows you to create a mixed forest with custom percentage distributions. You can either use the &quot;Equal Split&quot; option for balanced distribution or manually set percentages for each species to reflect your planting strategy.
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
                    <strong>Environmental Data Sources:</strong> The simulator uses real-time data from multiple sources: Soil carbon content from <a href="https://soilgrids.org/" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 underline">ISRIC SoilGrids</a> (adds 0.1 kg CO₂/year per g/kg of soil carbon), climate data from <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 underline">Open-Meteo</a> (precipitation affects forest resilience), and biodiversity data from <a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 underline">GBIF</a> (Global Biodiversity Information Facility). When climate data is unavailable, the simulator uses geographic fallbacks to ensure calculations remain accurate.
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
                    The simulator is perfect for planning reforestation projects, urban tree planting initiatives, and carbon offset programs. Use it to compare different tree species for your climate zone, estimate long-term environmental benefits, and communicate the impact of your projects to stakeholders. The region-specific data ensures your calculations are relevant to your actual planting area.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-green-800 font-medium">
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
                        <code className="block bg-white p-2 rounded">Final Carbon = Base Carbon + Soil Bonus</code>
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
                    Our comprehensive tree database includes 60 species from around the world, covering diverse ecosystems and climate zones:
                  </p>
                  <ul className="text-gray-900 mb-3 space-y-1">
                    <li><strong>European Trees:</strong> Oak, Beech, Ash, Rowan, Juniper, and more</li>
                    <li><strong>North American Trees:</strong> Coast Redwood, Tulip Poplar, Sugar Maple, and others</li>
                    <li><strong>Mediterranean Trees:</strong> Olive, Cork Oak, Aleppo Pine, and Mediterranean species</li>
                    <li><strong>Tropical Trees:</strong> Mahogany, Teak, Mango, and tropical hardwoods</li>
                    <li><strong>African Trees:</strong> Baobab, Acacia, and African native species</li>
                    <li><strong>Asian Trees:</strong> Bamboo, Ginkgo, Cherry, and Asian varieties</li>
                    <li><strong>Boreal Trees:</strong> Black Spruce, White Spruce, Balsam Fir, Tamarack, Jack Pine, and northern forest species</li>
                    <li><strong>Coniferous Trees:</strong> Pine, Spruce, Cedar, and other evergreens</li>
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
                    <li><strong>GeoJSON:</strong> Perfect for GIS professionals and mapping tools. Includes point features (analysis location) and polygon features (planting region) with all environmental metrics as properties.</li>
                    <li><strong>JSON:</strong> Complete data export for developers and data analysis. Contains all simulation parameters, environmental data, impact results, and planting specifications in structured format.</li>
                    <li><strong>CSV:</strong> Spreadsheet-friendly format organized by sections (metadata, trees, environmental data, results, planting data) for reporting and analysis.</li>
                  </ul>
                  <p className="text-gray-900 mb-3">
                    All exports include timestamps and are automatically generated once you complete your analysis. Files are downloaded directly to your browser with descriptive filenames.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 9 - Who Made This & How to Contribute */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setFaqOpen(prev => ({ ...prev, 9: !prev[9] }))}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800">Who made this tool and how can I contribute?</h3>
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
                    The Forest Impact Simulator was created by <a href="https://kar.im" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 underline">Karim Osman</a> to simulate and analyze the environmental impact of forest planting. This tool is completely <a href="https://github.com/KarimOsmanGH/forest-impact-simulator" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-800 underline">open-source</a> and available on GitHub. We welcome contributions from the community! Whether you&apos;re a developer, environmental scientist, or forestry expert, there are many ways to help improve this simulator.
                  </p>
                  <p className="text-gray-900 mt-4">

                  </p>
                  <p className="text-gray-900 mt-4">
                    The goal is to create the most accurate and user-friendly forest impact simulation tool available. Your contributions help make this vision a reality and support global reforestation efforts.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
