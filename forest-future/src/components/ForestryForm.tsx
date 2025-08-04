"use client";

import React, { useState, useEffect } from 'react';
import { ForestConfiguration } from '../app/page';

// Define types for our data
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

interface ForestryFormProps {
  config: ForestConfiguration;
  setConfig: (config: ForestConfiguration) => void;
}

const ForestryForm: React.FC<ForestryFormProps> = ({ config, setConfig }) => {
  const [trees, setTrees] = useState<Tree[]>([]);

  useEffect(() => {
    // Fetch tree data from the JSON file
    fetch('/data/trees.json')
      .then((response) => response.json())
      .then((data) => setTrees(data))
      .catch((error) => console.error('Error fetching tree data:', error));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The state is already updated on every change, so we can just log it
    console.log(config);
  };

  const handleTreeSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const treeId = parseInt(e.target.value);
    const isSelected = e.target.checked;
    const selectedTrees = isSelected
      ? [...config.selectedTrees, treeId]
      : config.selectedTrees.filter((id) => id !== treeId);
    setConfig({ ...config, selectedTrees });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-background rounded-lg shadow-md text-foreground">
      <div>
        <h3 className="text-lg font-semibold">Tree Species</h3>
        <p className="text-sm text-gray-600">Select the types of trees to plant.</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {trees.map((tree) => (
            <div key={tree.id}>
              <input
                type="checkbox"
                id={`tree-${tree.id}`}
                value={tree.id}
                checked={config.selectedTrees.includes(tree.id)}
                onChange={handleTreeSelection}
                className="accent-primary"
              />
              <label htmlFor={`tree-${tree.id}`} className="ml-2">{tree.name}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="planting-pattern" className="block text-sm font-medium">Planting Pattern</label>
        <select
          id="planting-pattern"
          value={config.plantingPattern}
          onChange={(e) => setConfig({ ...config, plantingPattern: e.target.value })}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white text-gray-900"
        >
          <option value="grid">Grid</option>
          <option value="random">Random</option>
          <option value="clusters">Clusters</option>
        </select>
      </div>

      <div>
        <label htmlFor="climate" className="block text-sm font-medium">Climate</label>
        <select
          id="climate"
          value={config.climate}
          onChange={(e) => setConfig({ ...config, climate: e.target.value })}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white text-gray-900"
        >
          <option value="temperate">Temperate</option>
          <option value="tropical">Tropical</option>
          <option value="arid">Arid</option>
        </select>
      </div>

      <div>
        <label htmlFor="soil" className="block text-sm font-medium">Soil Type</label>
        <select
          id="soil"
          value={config.soil}
          onChange={(e) => setConfig({ ...config, soil: e.target.value })}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white text-gray-900"
        >
          <option value="loam">Loam</option>
          <option value="clay">Clay</option>
          <option value="sand">Sand</option>
        </select>
      </div>

      <button type="submit" className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-green-700">
        Design My Forest
      </button>
    </form>
  );
};

export default ForestryForm;
