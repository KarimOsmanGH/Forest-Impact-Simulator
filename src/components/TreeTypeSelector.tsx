"use client";

import React, { useState } from 'react';
import { TreeType, TREE_TYPES, getTreeTypesByClimate } from '@/types/treeTypes';

interface TreeTypeSelectorProps {
  selectedTrees: TreeType[];
  onTreeSelectionChange: (trees: TreeType[]) => void;
  treePercentages: { [key: string]: number };
  onTreePercentagesChange: (percentages: { [key: string]: number }) => void;
  climate?: string;
  latitude?: number;
}

const TreeTypeSelector: React.FC<TreeTypeSelectorProps> = ({ 
  selectedTrees, 
  onTreeSelectionChange, 
  treePercentages,
  onTreePercentagesChange,
  climate,
  latitude 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter trees based on climate and latitude
  const getSuitableTrees = () => {
    let suitableTrees = TREE_TYPES;
    
    // Filter by climate if available
    if (climate) {
      suitableTrees = getTreeTypesByClimate(climate);
    }
    
    // Additional filtering based on latitude
    if (latitude !== undefined) {
      suitableTrees = suitableTrees.filter(tree => {
        const absLat = Math.abs(latitude);
        if (absLat < 23.5) return tree.climateZones.includes('tropical');
        if (absLat < 45) return tree.climateZones.includes('temperate') || tree.climateZones.includes('mediterranean');
        return tree.climateZones.includes('boreal') || tree.climateZones.includes('temperate');
      });
    }
    
    return suitableTrees;
  };

  const suitableTrees = getSuitableTrees();

  // Filter by search term and category
  const filteredTrees = suitableTrees.filter(tree => {
    const matchesSearch = tree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tree.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tree.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tree.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'deciduous', 'coniferous', 'tropical', 'mediterranean', 'boreal'];

  const handleTreeToggle = (tree: TreeType) => {
    const isSelected = selectedTrees.some(t => t.id === tree.id);
    if (isSelected) {
      onTreeSelectionChange(selectedTrees.filter(t => t.id !== tree.id));
    } else {
      onTreeSelectionChange([...selectedTrees, tree]);
    }
  };

  const clearAll = () => {
    onTreeSelectionChange([]);
  };



  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 min-h-[450px]">
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={clearAll}
          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear All
        </button>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-3 space-y-2">
        <input
          type="text"
          placeholder="Search trees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? category === 'deciduous' ? 'bg-green-700 text-white' :
                    category === 'coniferous' ? 'bg-green-800 text-white' :
                    category === 'tropical' ? 'bg-green-600 text-white' :
                    category === 'mediterranean' ? 'bg-green-900 text-white' :
                    category === 'boreal' ? 'bg-green-950 text-white' :
                    'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Trees Summary */}
      {selectedTrees.length > 0 && (
        <div className="mb-3 p-2 bg-gray-100 border border-gray-200 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{selectedTrees.length}</span> tree{selectedTrees.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedTrees.map(tree => (
              <div
                key={tree.id}
                className="flex items-center gap-1 bg-white rounded px-2 py-1 text-xs border"
              >
                <span>🌳</span>
                <span className="text-gray-700">{tree.name}</span>
                <button
                  onClick={() => handleTreeToggle(tree)}
                  className="text-red-500 hover:text-red-700 ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Percentage Distribution */}
      {selectedTrees.length > 1 && (
        <div className="mb-3 p-3 bg-gray-100 border border-gray-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Tree Distribution</h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const equalPercentage = Math.round(100 / selectedTrees.length);
                  const newPercentages: { [key: string]: number } = {};
                  selectedTrees.forEach(tree => {
                    newPercentages[tree.id] = equalPercentage;
                  });
                  onTreePercentagesChange(newPercentages);
                }}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Equal Split
              </button>
              <button
                onClick={() => {
                  // Clear all percentages and remove all trees from selection
                  onTreePercentagesChange({});
                  onTreeSelectionChange([]);
                }}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {selectedTrees.map(tree => (
              <div key={tree.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-700 w-16 truncate">{tree.name}</span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={treePercentages[tree.id] || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const newPercentages = { ...treePercentages };
                      
                      if (inputValue === '') {
                        // Allow empty field - just remove from percentages but keep tree selected
                        delete newPercentages[tree.id];
                      } else {
                        const value = parseInt(inputValue) || 0;
                        if (value > 0) {
                          newPercentages[tree.id] = value;
                        } else {
                          // If value is 0, just remove from percentages but keep tree selected
                          delete newPercentages[tree.id];
                        }
                      }
                      
                      onTreePercentagesChange(newPercentages);
                    }}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-xs text-gray-700">%</span>
                </div>
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-200 ${
                      tree.category === 'deciduous' ? 'bg-green-700' :
                      tree.category === 'coniferous' ? 'bg-green-800' :
                      tree.category === 'tropical' ? 'bg-green-600' :
                      tree.category === 'mediterranean' ? 'bg-green-900' :
                      tree.category === 'boreal' ? 'bg-green-950' :
                      'bg-green-700'
                    }`}
                    style={{ width: `${treePercentages[tree.id] || 0}%` }}
                  />
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-300">
              <span className="text-xs text-gray-700">Total:</span>
              <span className={`text-xs font-medium ${
                Object.values(treePercentages).reduce((sum, p) => sum + (p || 0), 0) === 100 
                  ? 'text-green-700' 
                  : 'text-red-400'
              }`}>
                {Object.values(treePercentages).reduce((sum, p) => sum + (p || 0), 0)}%
              </span>
            </div>
            
            {Object.values(treePercentages).reduce((sum, p) => sum + (p || 0), 0) !== 100 && (
                          <p className="text-xs text-red-400">
              Total should equal 100% for accurate calculations
            </p>
            )}
          </div>
        </div>
      )}

      {/* Tree Grid */}
      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {filteredTrees.map(tree => {
          const isSelected = selectedTrees.some(t => t.id === tree.id);
          return (
            <div
              key={tree.id}
              onClick={() => handleTreeToggle(tree)}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? tree.category === 'deciduous' ? 'border-green-700 bg-green-50' :
                    tree.category === 'coniferous' ? 'border-green-800 bg-green-50' :
                    tree.category === 'tropical' ? 'border-green-600 bg-green-50' :
                    tree.category === 'mediterranean' ? 'border-green-900 bg-green-50' :
                    tree.category === 'boreal' ? 'border-green-950 bg-green-50' :
                    'border-green-700 bg-green-50'
                  : 'border-gray-200 hover:border-green-500/50'
              }`}
            >
              {/* Tree Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{tree.name} <span className="font-normal text-gray-500">- {tree.scientificName}</span></h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className={`w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold ${
                        tree.category === 'deciduous' ? 'bg-green-700' :
                        tree.category === 'coniferous' ? 'bg-green-800' :
                        tree.category === 'tropical' ? 'bg-green-600' :
                        tree.category === 'mediterranean' ? 'bg-green-900' :
                        tree.category === 'boreal' ? 'bg-green-950' :
                        'bg-green-700'
                      }`}>
                        ✓
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                      tree.category === 'deciduous' ? 'bg-green-700 text-white' :
                      tree.category === 'coniferous' ? 'bg-green-800 text-white' :
                      tree.category === 'tropical' ? 'bg-green-600 text-white' :
                      tree.category === 'mediterranean' ? 'bg-green-900 text-white' :
                      tree.category === 'boreal' ? 'bg-green-950 text-white' :
                      'bg-green-700 text-white'
                    }`}>
                      {tree.category.charAt(0).toUpperCase() + tree.category.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500">Carbon</div>
                    <div className="text-xs font-medium">{tree.carbonSequestration} kg</div>
                  </div>
                  <div className="text-center border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500">Growth</div>
                    <div className="text-xs font-medium capitalize">{tree.growthRate}</div>
                  </div>
                  <div className="text-center border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500">Bio</div>
                    <div className="text-xs font-medium">{tree.biodiversityValue}</div>
                  </div>
                </div>


              </div>
            </div>
          );
        })}
      </div>

      {filteredTrees.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No trees found matching your criteria.</p>
          <p className="text-xs mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default TreeTypeSelector; 