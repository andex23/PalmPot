import React, { useState, useCallback, useEffect } from 'react';
import type { Recipe, SavedRecipe } from './types';
import { generateNigerianRecipe } from './services/geminiService';
import Header from './components/Header';
import RecipeCard from './components/RecipeCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const App: React.FC = () => {
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [cuisine, setCuisine] = useState<string>('Any');
    const [mealType, setMealType] = useState<string>('Any');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isOptionsVisible, setIsOptionsVisible] = useState<boolean>(false);

    const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
    const [view, setView] = useState<'generator' | 'saved'>('generator');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('palmPotRecipes');
            if (saved) {
                setSavedRecipes(JSON.parse(saved));
            }
        } catch (error) {
            console.error("Could not load saved recipes:", error);
        }
    }, []);

    const handleSaveRecipe = (recipeToSave: Recipe, imageUrlToSave: string) => {
        if (!recipeToSave || !imageUrlToSave) return;
        const newSavedRecipe: SavedRecipe = { ...recipeToSave, imageUrl: imageUrlToSave };
        
        if (savedRecipes.some(r => r.recipeName === newSavedRecipe.recipeName)) {
            return; // Avoid duplicates
        }

        const updatedRecipes = [...savedRecipes, newSavedRecipe];
        setSavedRecipes(updatedRecipes);
        localStorage.setItem('palmPotRecipes', JSON.stringify(updatedRecipes));
    };

    const handleDeleteRecipe = (recipeName: string) => {
        const updatedRecipes = savedRecipes.filter(r => r.recipeName !== recipeName);
        setSavedRecipes(updatedRecipes);
        localStorage.setItem('palmPotRecipes', JSON.stringify(updatedRecipes));
    };

    const handleGenerateRecipe = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setRecipe(null);
        setImageUrl(null);

        try {
            const result = await generateNigerianRecipe(cuisine, mealType, searchQuery);
            setRecipe(result.recipe);
            setImageUrl(result.imageUrl);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [cuisine, mealType, searchQuery]);

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col items-center">
            <Header />
            <main className="flex flex-col items-center justify-center p-4 md:p-8 w-full flex-grow">
                <div className="w-full max-w-4xl flex justify-end mb-4">
                    <button
                        onClick={() => setView(view === 'generator' ? 'saved' : 'generator')}
                        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm flex items-center gap-2 transition-colors duration-200"
                        aria-label={`Switch to ${view === 'generator' ? 'saved recipes' : 'recipe generator'} view`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                        </svg>
                        <span>{view === 'generator' ? `View Saved (${savedRecipes.length})` : 'Recipe Generator'}</span>
                    </button>
                </div>

                {view === 'generator' ? (
                    <div className="w-full max-w-4xl flex flex-col items-center">
                        <div className="bg-white p-6 rounded-xl shadow-md mb-8 w-full">
                            <div className="w-full">
                                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">Search for a Dish (or leave blank for a random one)</label>
                                <input
                                    id="search-input"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="e.g., Jollof Rice, Egusi Soup"
                                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-lg"
                                    disabled={isLoading}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe()}
                                />
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => setIsOptionsVisible(!isOptionsVisible)}
                                    className="flex items-center justify-between w-full text-left text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-md hover:bg-gray-50"
                                    aria-expanded={isOptionsVisible}
                                    aria-controls="filter-options"
                                >
                                    <span className="font-medium">Filters (Cuisine & Meal Type)</span>
                                    <svg
                                        className={`w-5 h-5 transition-transform duration-300 ${isOptionsVisible ? 'transform rotate-180' : ''}`}
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <div
                                id="filter-options"
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOptionsVisible ? 'max-h-40 mt-4' : 'max-h-0'}`}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                                    <div>
                                        <label htmlFor="cuisine-select" className="block text-sm font-medium text-gray-700 mb-1">Cuisine / Region</label>
                                        <select
                                            id="cuisine-select"
                                            value={cuisine}
                                            onChange={(e) => setCuisine(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                            disabled={isLoading}
                                        >
                                            <option>Any</option>
                                            <option>Yoruba</option>
                                            <option>Igbo</option>
                                            <option>Hausa</option>
                                            <option>Efik/Ibibio</option>
                                            <option>Edo</option>
                                            <option>Delta</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="meal-type-select" className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                                        <select
                                            id="meal-type-select"
                                            value={mealType}
                                            onChange={(e) => setMealType(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                                            disabled={isLoading}
                                        >
                                            <option>Any</option>
                                            <option>Breakfast</option>
                                            <option>Lunch</option>
                                            <option>Dinner</option>
                                            <option>Snack</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateRecipe}
                            disabled={isLoading}
                            className="bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isLoading ? 'Generating...' : 'Generate Recipe'}
                        </button>
                        <div className="mt-8 w-full">
                            {isLoading && <LoadingSpinner />}
                            {error && <ErrorMessage message={error} />}
                            {!isLoading && !error && (
                                <RecipeCard 
                                    recipe={recipe} 
                                    imageUrl={imageUrl} 
                                    onSave={() => recipe && imageUrl && handleSaveRecipe(recipe, imageUrl)}
                                    isSaved={recipe ? savedRecipes.some(r => r.recipeName === recipe.recipeName) : false}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl">
                        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">My Saved Recipes</h2>
                        {savedRecipes.length > 0 ? (
                            <div className="grid gap-8">
                                {savedRecipes.map((savedRecipe) => (
                                    <RecipeCard
                                        key={savedRecipe.recipeName}
                                        recipe={savedRecipe}
                                        imageUrl={savedRecipe.imageUrl}
                                        onDelete={handleDeleteRecipe}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                                <p className="text-xl">You haven't saved any recipes yet.</p>
                                <p className="mt-2">Go back to the generator to find and save your favorites!</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <footer className="text-center py-4 text-gray-500 text-sm w-full bg-white shadow-inner">
                <p>Powered by Google Gemini. © 2024 PalmPot.</p>
            </footer>
        </div>
    );
};

export default App;