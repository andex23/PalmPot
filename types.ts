
export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
}

export interface SavedRecipe extends Recipe {
  imageUrl: string;
}
