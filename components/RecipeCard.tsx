import React, { useState } from 'react';
import type { Recipe } from '../types';

interface RecipeCardProps {
    recipe: Recipe | null;
    imageUrl: string | null;
    onSave?: () => void;
    onDelete?: (recipeName: string) => void;
    isSaved?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, imageUrl, onSave, onDelete, isSaved }) => {
    const [shareText, setShareText] = useState('Share');

    const handleShare = async () => {
        if (!recipe) return;

        const shareData = {
            title: `Naija Bites Recipe: ${recipe.recipeName}`,
            text: `Check out this delicious Nigerian recipe for ${recipe.recipeName}!\n\n${recipe.description}`,
            url: window.location.origin,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                const recipeDetails = `Recipe for ${recipe.recipeName}\n\n${recipe.description}\n\nFind more at ${window.location.origin}`;
                await navigator.clipboard.writeText(recipeDetails);
                setShareText('Copied!');
                setTimeout(() => setShareText('Share'), 2000);
            }
        } catch (error) {
            console.error("Couldn't share or copy recipe:", error);
            setShareText('Error');
            setTimeout(() => setShareText('Share'), 2000);
        }
    };
    
    if (!recipe || !imageUrl) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500 max-w-4xl w-full">
                <p className="text-xl">Your delicious Nigerian recipe will appear here.</p>
                <p className="mt-2">Click the button above to get started!</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden my-8 max-w-4xl w-full transition-all duration-500 ease-in-out transform hover:scale-[1.02]">
            <img src={imageUrl} alt={recipe.recipeName} className="w-full h-64 object-cover" />
            <div className="p-8">
                <div className="flex justify-between items-start mb-3 gap-2">
                    <h2 className="text-4xl font-extrabold text-gray-900 flex-1 pr-4">{recipe.recipeName}</h2>
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            aria-label="Share recipe"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                               <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                            </svg>
                            <span>{shareText}</span>
                        </button>
                        {onDelete && (
                            <button
                                onClick={() => onDelete(recipe.recipeName)}
                                className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                aria-label="Delete recipe"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                </svg>
                                <span>Delete</span>
                            </button>
                        )}
                        {onSave && (
                             <button
                                onClick={onSave}
                                disabled={isSaved}
                                className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    isSaved 
                                    ? 'bg-green-100 text-green-800 cursor-not-allowed' 
                                    : 'bg-green-100 hover:bg-green-200 text-green-700 focus:ring-green-500'
                                }`}
                                aria-label={isSaved ? "Recipe saved" : "Save recipe"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                                </svg>
                                <span>{isSaved ? 'Saved' : 'Save'}</span>
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-gray-600 mb-8 italic">{recipe.description}</p>
                
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold text-green-700 mb-4 border-b-2 border-green-200 pb-2">Ingredients</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {recipe.ingredients.map((ingredient, index) => (
                                <li key={index}>{ingredient}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-green-700 mb-4 border-b-2 border-green-200 pb-2">Instructions</h3>
                        <ol className="list-decimal list-inside space-y-4 text-gray-700">
                            {recipe.instructions.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
