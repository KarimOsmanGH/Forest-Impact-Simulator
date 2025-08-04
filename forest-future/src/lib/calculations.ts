import { ForestConfiguration } from "@/app/page";

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

export const calculateMetrics = (
  config: ForestConfiguration,
  treesData: Tree[],
  year: number
) => {
  const selectedTreesData = treesData.filter((tree) =>
    config.selectedTrees.includes(tree.id)
  );

  if (selectedTreesData.length === 0) {
    return {
      carbonSequestration: 0,
      biodiversityImpact: 0,
      forestResilience: 0,
    };
  }

  // Carbon Sequestration Calculation
  const totalSequestrationRate = selectedTreesData.reduce(
    (acc, tree) => acc + tree.carbon_sequestration,
    0
  );
  const carbonSequestration = totalSequestrationRate * (year - 1900);

  // Biodiversity Impact Calculation (average score)
  const totalBiodiversityImpact = selectedTreesData.reduce(
    (acc, tree) => acc + tree.biodiversity_impact,
    0
  );
  const biodiversityImpact =
    totalBiodiversityImpact / selectedTreesData.length;

  // Forest Resilience Calculation (average score)
  const totalResilience = selectedTreesData.reduce(
    (acc, tree) => acc + tree.resilience,
    0
  );
  const forestResilience = totalResilience / selectedTreesData.length;

  return {
    carbonSequestration,
    biodiversityImpact,
    forestResilience,
  };
};
