
export interface ChefVariation {
  chefName: string;
  variationName: string;
  specialTwist: string;
  ingredients: string[];
  instructions: string[];
  videoTitle?: string;
  youtubeUrl?: string;
}

export interface Recipe {
  recipeName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  chefVariations?: ChefVariation[];
  videoUrl?: string;
}

export interface SavedRecipe extends Recipe {
  imageUrl: string;
}
