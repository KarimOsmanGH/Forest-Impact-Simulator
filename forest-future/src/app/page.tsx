"use client";

import { useState, useEffect, useMemo } from "react";
import ForestryForm from "@/components/ForestryForm";
import ForestCanvas from "@/components/ForestCanvas";
import ResultsDisplay from "@/components/ResultsDisplay";
import { calculateMetrics } from "@/lib/calculations";

export interface ForestConfiguration {
  selectedTrees: number[];
  plantingPattern: string;
  climate: string;
  soil: string;
}

interface Tree {
  id: number;
  name: string;
  scientific_name: string;
  description: string;
  carbon_sequestration: number;
  biodiversity_impact: number;
  resilience: number;
  image: string;
}


export default function Home() {
  const [config, setConfig] = useState<ForestConfiguration>({
    selectedTrees: [],
    plantingPattern: "grid",
    climate: "temperate",
    soil: "loam",
  });
  const [year, setYear] = useState(2024);
  const [treesData, setTreesData] = useState<Tree[]>([]);

  useEffect(() => {
    fetch('/data/trees.json')
      .then((response) => response.json())
      .then((data) => setTreesData(data))
      .catch((error) => console.error('Error fetching tree data:', error));
  }, []);

  const metrics = useMemo(() => {
    if (treesData.length === 0) {
      return { carbonSequestration: 0, biodiversityImpact: 0, forestResilience: 0 };
    }
    return calculateMetrics(config, treesData, year);
  }, [config, treesData, year]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Design Your Virtual Forest
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ForestryForm config={config} setConfig={setConfig} />
            <div className="mt-8">
              <ResultsDisplay {...metrics} />
            </div>
          </div>
          <div>
            <ForestCanvas config={config} year={year} setYear={setYear} />
          </div>
        </div>
      </div>
    </main>
  );
}
