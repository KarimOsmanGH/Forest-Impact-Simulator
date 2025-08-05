/**
 * Tree mortality calculations and statistics
 */

export interface MortalityConfig {
  enabled: boolean;
  rate: number; // Annual mortality rate as percentage
  description: string;
  source: string;
}

// Tree mortality rates by category (annual %)
export const TREE_MORTALITY_RATES = {
  // Young trees (first 5 years) - higher mortality
  young: {
    rate: 15, // 15% annual mortality for young trees
    description: "Young trees (0-5 years) - High establishment mortality",
    source: "Forest Ecology and Management"
  },
  // Mature trees - lower mortality
  mature: {
    rate: 2, // 2% annual mortality for mature trees
    description: "Mature trees (5+ years) - Natural mortality",
    source: "Global Forest Resources Assessment"
  },
  // Fast-growing species - higher mortality
  fastGrowing: {
    rate: 8, // 8% annual mortality for fast-growing species
    description: "Fast-growing species - Higher stress mortality",
    source: "Forest Science"
  },
  // Slow-growing species - lower mortality
  slowGrowing: {
    rate: 1.5, // 1.5% annual mortality for slow-growing species
    description: "Slow-growing species - Lower stress mortality",
    source: "Forest Ecology and Management"
  }
};

// Get mortality rate based on tree type and age
export const getMortalityRate = (treeType: string, years: number): number => {
  const treeTypeLower = treeType.toLowerCase();
  
  // Young trees (first 5 years) have higher mortality
  if (years <= 5) {
    return TREE_MORTALITY_RATES.young.rate;
  }
  
  // Fast-growing species have higher mortality
  if (treeTypeLower.includes('eucalyptus') || 
      treeTypeLower.includes('willow') || 
      treeTypeLower.includes('poplar') ||
      treeTypeLower.includes('bamboo')) {
    return TREE_MORTALITY_RATES.fastGrowing.rate;
  }
  
  // Slow-growing species have lower mortality
  if (treeTypeLower.includes('oak') || 
      treeTypeLower.includes('sequoia') || 
      treeTypeLower.includes('redwood') ||
      treeTypeLower.includes('cedar')) {
    return TREE_MORTALITY_RATES.slowGrowing.rate;
  }
  
  // Default to mature tree rate
  return TREE_MORTALITY_RATES.mature.rate;
};

// Calculate surviving trees after mortality
export const calculateSurvivingTrees = (
  initialTrees: number,
  mortalityRate: number,
  years: number
): number => {
  const annualSurvivalRate = (100 - mortalityRate) / 100;
  const totalSurvivalRate = Math.pow(annualSurvivalRate, years);
  return Math.floor(initialTrees * totalSurvivalRate);
};

// Calculate cumulative mortality over time
export const calculateCumulativeMortality = (
  initialTrees: number,
  mortalityRate: number,
  years: number
): {
  survivingTrees: number;
  deadTrees: number;
  survivalRate: number;
  annualBreakdown: Array<{ year: number; surviving: number; dead: number }>;
} => {
  const annualSurvivalRate = (100 - mortalityRate) / 100;
  const annualBreakdown = [];
  
  let currentTrees = initialTrees;
  
  for (let year = 1; year <= years; year++) {
    const previousTrees = currentTrees;
    currentTrees = Math.floor(previousTrees * annualSurvivalRate);
    const deadThisYear = previousTrees - currentTrees;
    
    annualBreakdown.push({
      year,
      surviving: currentTrees,
      dead: deadThisYear
    });
  }
  
  const totalDead = initialTrees - currentTrees;
  const survivalRate = (currentTrees / initialTrees) * 100;
  
  return {
    survivingTrees: currentTrees,
    deadTrees: totalDead,
    survivalRate,
    annualBreakdown
  };
};

// Get mortality description for display
export const getMortalityDescription = (treeType: string, years: number): string => {
  const rate = getMortalityRate(treeType, years);
  
  if (years <= 5) {
    return TREE_MORTALITY_RATES.young.description;
  }
  
  if (rate >= 5) {
    return TREE_MORTALITY_RATES.fastGrowing.description;
  }
  
  if (rate <= 2) {
    return TREE_MORTALITY_RATES.slowGrowing.description;
  }
  
  return TREE_MORTALITY_RATES.mature.description;
};

// Calculate adjusted carbon sequestration with mortality
export const calculateAdjustedCarbonSequestration = (
  initialTrees: number,
  carbonPerTree: number,
  mortalityRate: number,
  years: number
): {
  totalCarbon: number;
  averageAnnualCarbon: number;
  survivingTrees: number;
  deadTrees: number;
} => {
  const mortality = calculateCumulativeMortality(initialTrees, mortalityRate, years);
  
  // Calculate carbon sequestration year by year
  let totalCarbon = 0;
  let previousTrees = initialTrees;
  
  for (let year = 1; year <= years; year++) {
    const currentTrees = Math.floor(previousTrees * ((100 - mortalityRate) / 100));
    const carbonThisYear = currentTrees * carbonPerTree;
    totalCarbon += carbonThisYear;
    previousTrees = currentTrees;
  }
  
  const averageAnnualCarbon = totalCarbon / years;
  
  return {
    totalCarbon,
    averageAnnualCarbon,
    survivingTrees: mortality.survivingTrees,
    deadTrees: mortality.deadTrees
  };
}; 