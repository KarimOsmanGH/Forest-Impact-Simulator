/**
 * Tree category color utility functions
 * Provides consistent color styling across the application
 */

export type TreeCategory = 
  | 'deciduous' 
  | 'coniferous' 
  | 'tropical' 
  | 'mediterranean' 
  | 'boreal' 
  | 'arid' 
  | 'subtropical'
  | 'all';

/**
 * Get Tailwind CSS classes for tree category colors
 * @param category - The tree category
 * @param variant - The style variant (bg, text, border)
 * @returns Tailwind CSS class string
 */
export const getTreeCategoryColor = (
  category: TreeCategory,
  variant: 'bg' | 'text' | 'border' | 'bg-light' = 'bg'
): string => {
  // All categories use the primary color
  const colorMap = {
    bg: 'bg-primary text-white',
    'bg-light': 'bg-primary/10 border-primary',
    text: 'text-primary',
    border: 'border-primary'
  };
  
  return colorMap[variant];
};

/**
 * Check if a category is a valid tree category
 */
export const isValidTreeCategory = (category: string): category is TreeCategory => {
  return ['deciduous', 'coniferous', 'tropical', 'mediterranean', 'boreal', 'arid', 'subtropical', 'all'].includes(category);
};
