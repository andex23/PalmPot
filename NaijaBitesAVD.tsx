
/*
  What changed & why:
  - Added "Chef's Take" Feature: Introduced a tabbed interface in the RecipeResultCard to switch between the standard recipe and "Chef Editions".
  - Chef Cards: Created a specialized card layout for chef variations, displaying the chef's name, their unique twist, and a generated YouTube search link.
  - Visual Refinement: Switched the body font to 'Inter' (sans-serif) for better readability of long text, while keeping the 'Satoshi' (heading) and 'Courier' (technical) fonts for the theme identity.
  - Improved Layout: Added better spacing, new icons (Youtube, Chef Hat), and subtle distinct styling for the chef section to make it feel premium.
  - UPDATED: Now displays FULL ingredients and instructions for chef variations, allowing selection between chefs.
  - UPDATED (Latest): Optimized for 5 variations. Mobile view now uses a horizontal scroll for chef selection to save vertical space. Visual design of chef cards enhanced with distinct "Twist" sections.
  - UPDATED (Latest+): Added Prep Time and Cook Time display. Updated Chef Video logic to only show the link if a specific video title is provided by the API, ensuring accuracy.
  - UPDATED (Video Logic): Now supports direct `youtubeUrl` and enhanced search queries (Chef + Recipe + Title) to ensure users land on the correct video.
  - NEW: Integrated Veo video generation to create short, cinematic recipe summaries. Added API key selection flow required for video generation.
*/
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Recipe, SavedRecipe, ChefVariation } from './types';
import { generateNigerianRecipe, generateRecipeVideo } from './services/geminiService';

const AVDThemeStyles = () => (
  <style>{`
    :root {
      --surface: #FFFCF7;
      --panel:   #FFFFFF;
      --muted:   #F3F0E8;
      --border:  #E6E0D4;
      --text:    #1A1916;
      --subtext: #706B60;
      --header-surface: rgba(255, 252, 247, 0.95);
      
      --accent:  #F97316; /* Orange-500 */
      --accent-soft: #FFF7ED; /* Orange-50 */
      --ring:    #EA580C; /* Orange-600 */
      
      --font-mono: 'Courier Prime', 'Courier New', monospace;
      --font-body: 'Inter', system-ui, -apple-system, sans-serif;
      --font-heading: 'Satoshi', system-ui, sans-serif;
    }
    body {
      font-family: var(--font-body);
      color: var(--text);
      background-color: var(--surface);
      background-image: radial-gradient(circle at 1px 1px, #E8E1D7 1px, transparent 0);
      background-size: 24px 24px;
    }
    .font-mono { font-family: var(--font-mono); }
    .font-heading { font-family: var(--font-heading); font-weight: 700; letter-spacing: -0.02em; }
    
    @keyframes glow {
        from { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.2); }
        to { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
    }
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
    
    .shimmer-bg {
        background: linear-gradient(90deg, #F3F0E8 25%, #FFFFFF 37%, #F3F0E8 63%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 100% { background-position: 200% 0; } }
    
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #E6E0D4; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #D1C9BC; }
    
    /* Hide scrollbar for clean horizontal scroll on mobile */
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
  `}</style>
);

// --- ICONS ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const ChefHatIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S13.632 5 10.5 5c-2.791 0-5.257 3.537-5.257 8s2.015 8 5.257 8z" />
    </svg>
);
const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);
const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
    </svg>
);

const PalmPotAVD: React.FC = () => {
    // --- STATE ---
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
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- EFFECTS & HANDLERS ---
    useEffect(() => {
        try {
            const saved = localStorage.getItem('palmPotRecipes');
            if (saved) setSavedRecipes(JSON.parse(saved));
        } catch (error) { console.error("Could not load saved recipes:", error); }
    }, []);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSaveRecipe = (recipeToSave: Recipe, imageUrlToSave: string) => {
        if (!recipeToSave || !imageUrlToSave || savedRecipes.some(r => r.recipeName === recipeToSave.recipeName)) return;
        const newSavedRecipe: SavedRecipe = { ...recipeToSave, imageUrl: imageUrlToSave };
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
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [cuisine, mealType, searchQuery]);
    
    const handleSurpriseMe = useCallback(async () => {
        setSearchQuery('');
        setIsLoading(true);
        setError(null);
        setRecipe(null);
        setImageUrl(null);
        try {
            const result = await generateNigerianRecipe(cuisine, mealType, ''); 
            setRecipe(result.recipe);
            setImageUrl(result.imageUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [cuisine, mealType]);

    const cuisineOptions = ['Any', 'Yoruba', 'Igbo', 'Hausa', 'Efik/Ibibio', 'Edo', 'Delta'];
    const mealTypeOptions = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const quickPicks = ['Jollof Rice', 'Egusi Soup', 'Suya', 'Ofada Rice'];

    // --- RENDER ---
    return (
        <>
            <AVDThemeStyles />
            <div className="min-h-screen pb-12">
                {/* HEADER */}
                <header className="sticky top-0 z-30 bg-[--header-surface] backdrop-blur-md border-b border-[--border] shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setView('generator')} className="flex items-center gap-2 group focus:outline-none">
                                    <div className="w-8 h-8 bg-[--accent] rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                        <ChefHatIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-heading text-xl font-bold tracking-tight text-[--text]">PalmPot</span>
                                </button>
                            </div>
                            <button 
                                onClick={() => setView('saved')}
                                className="relative flex items-center gap-2 text-sm font-medium text-[--subtext] hover:text-[--text] bg-white border border-[--border] hover:border-[--accent] px-3 py-1.5 rounded-full transition-all duration-200 shadow-sm"
                            >
                                <span>Saved Recipes</span>
                                {savedRecipes.length > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[--accent] text-[10px] font-bold text-white">
                                        {savedRecipes.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                     {/* HERO SECTION */}
                    <div className="text-center max-w-2xl mx-auto pt-4 md:pt-8 pb-10">
                        <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-[--text] mb-4 tracking-tight">
                            The Taste of <span className="text-[--accent]">Naija</span>
                        </h1>
                        <p className="text-[--subtext] text-lg font-light leading-relaxed">
                            Generate authentic Nigerian recipes, discover chef variations, and master the kitchen with AI.
                        </p>
                    </div>

                    {/* SEARCH INTERFACE */}
                     <div className="max-w-3xl mx-auto">
                        <div className="bg-[--panel] border border-[--border] rounded-3xl p-2 shadow-lg ring-4 ring-[--muted]">
                            <div className="relative flex items-center">
                                <div className="absolute left-4 text-[--subtext]">
                                   <SearchIcon className="h-5 w-5" />
                                </div>
                                 <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe()}
                                    placeholder="What are you craving? (e.g. Seafood Okro)"
                                    disabled={isLoading}
                                    className="w-full bg-transparent border-none rounded-2xl py-4 pl-12 pr-4 text-lg text-[--text] placeholder:text-[--subtext]/50 focus:ring-0 font-medium"
                                />
                                <button
                                    onClick={handleGenerateRecipe}
                                    disabled={isLoading}
                                    className="hidden sm:block absolute right-2 bg-[--accent] hover:bg-[--ring] text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Cooking...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                        
                        {/* MOBILE BUTTON */}
                        <div className="mt-3 sm:hidden">
                             <button
                                onClick={handleGenerateRecipe}
                                disabled={isLoading}
                                className="w-full bg-[--accent] hover:bg-[--ring] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md disabled:opacity-50"
                            >
                                {isLoading ? 'Cooking...' : 'Generate Recipe'}
                            </button>
                        </div>

                        {/* FILTERS & QUICK PICKS */}
                        <div className="mt-6 bg-[--panel] border border-[--border] rounded-2xl p-5 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[--subtext]">Quick Picks:</span>
                                    {quickPicks.map(pick => (
                                        <button key={pick} onClick={() => setSearchQuery(pick)} className="px-3 py-1 text-xs font-medium rounded-full bg-[--muted] text-[--subtext] hover:bg-[--accent-soft] hover:text-[--accent] transition-colors">
                                            {pick}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setIsOptionsVisible(!isOptionsVisible)}
                                    className="text-xs font-bold uppercase tracking-wider text-[--accent] hover:text-[--ring] flex items-center gap-1 transition-colors"
                                >
                                    {isOptionsVisible ? 'Hide Filters' : 'Show Filters'}
                                    <svg className={`w-4 h-4 transition-transform ${isOptionsVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </div>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOptionsVisible ? 'max-h-60 opacity-100 mt-4 pt-4 border-t border-[--border]' : 'max-h-0 opacity-0'}`}>
                                <div className="grid gap-4">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <h3 className="text-sm font-semibold text-[--text] w-20 shrink-0">Cuisine:</h3>
                                        {cuisineOptions.map(c => <Chip key={c} label={c} isSelected={cuisine === c} onClick={() => setCuisine(c)} disabled={isLoading} />)}
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <h3 className="text-sm font-semibold text-[--text] w-20 shrink-0">Meal Type:</h3>
                                        {mealTypeOptions.map(m => <Chip key={m} label={m} isSelected={mealType === m} onClick={() => setMealType(m)} disabled={isLoading} />)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SURPRISE BUTTON */}
                        <div className="mt-4 text-center">
                             <button onClick={handleSurpriseMe} disabled={isLoading} className="text-sm text-[--subtext] hover:text-[--accent] transition-colors underline decoration-dotted underline-offset-4">
                                Not sure? Surprise me with a random dish
                            </button>
                        </div>
                     </div>
                        
                    {/* RESULTS AREA */}
                    <div className="mt-12 max-w-4xl mx-auto">
                        {isLoading ? <RecipeSkeleton /> :
                            error ? <ErrorMessage message={error} /> :
                            recipe ? (
                                <RecipeResultCard 
                                    recipe={recipe} 
                                    imageUrl={imageUrl!} 
                                    onSave={() => handleSaveRecipe(recipe, imageUrl!)} 
                                    isSaved={savedRecipes.some(r => r.recipeName === recipe.recipeName)} 
                                />
                            ) : null
                        }
                    </div>
                </main>

                {/* SAVED RECIPES MODAL/VIEW */}
                 {view === 'saved' && (
                    <div className="fixed inset-0 bg-[--surface] z-40 overflow-y-auto animate-slide-in">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                             <div className="flex items-center gap-4 mb-8">
                                <button 
                                    onClick={() => setView('generator')}
                                    className="p-2 rounded-full border border-[--border] hover:bg-[--muted] transition-colors"
                                >
                                    <svg className="w-6 h-6 text-[--subtext]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </button>
                                <h2 className="font-heading text-3xl font-bold text-[--text]">My Cookbook</h2>
                            </div>

                            <div className="max-w-3xl mx-auto">
                                {savedRecipes.length > 0 ? (
                                    <div className="grid gap-12">
                                        {savedRecipes.map(r => (
                                            <RecipeResultCard key={r.recipeName} recipe={r} imageUrl={r.imageUrl} onDelete={() => handleDeleteRecipe(r.recipeName)} isSaved={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 border-2 border-dashed border-[--border] rounded-3xl">
                                        <div className="w-16 h-16 bg-[--muted] rounded-full flex items-center justify-center mx-auto mb-4 text-[--subtext]">
                                            <BookOpenIcon className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-medium text-[--text]">Your cookbook is empty.</p>
                                        <p className="text-[--subtext] mt-2">Go generate some delicious recipes to save them here.</p>
                                        <button onClick={() => setView('generator')} className="mt-6 text-[--accent] font-bold hover:underline">
                                            Go to Generator
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// --- COMPONENTS ---

const Chip: React.FC<{ label: string; isSelected: boolean; onClick: () => void; disabled: boolean; }> = ({ label, isSelected, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1 text-sm rounded-lg border transition-all duration-200 font-medium
            ${isSelected 
                ? 'bg-[--accent] text-white border-[--accent] shadow-md' 
                : 'bg-white text-[--subtext] border-[--border] hover:border-[--accent] hover:text-[--text]'
            } disabled:opacity-50`}
    >
        {label}
    </button>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl shadow-sm text-center">
        <p className="font-heading font-bold text-lg mb-2">Oops! The kitchen is closed momentarily.</p>
        <p className="text-sm opacity-80">{message}</p>
    </div>
);

const RecipeSkeleton = () => (
    <div className="bg-[--panel] border border-[--border] rounded-3xl overflow-hidden shadow-xl">
        <div className="h-64 w-full shimmer-bg"></div>
        <div className="p-8">
            <div className="h-10 w-2/3 shimmer-bg rounded-lg mb-6"></div>
            <div className="h-4 w-full shimmer-bg rounded-lg mb-3"></div>
            <div className="h-4 w-5/6 shimmer-bg rounded-lg mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="space-y-4">
                     <div className="h-8 w-1/3 shimmer-bg rounded-lg mb-4"></div>
                     <div className="h-4 w-full shimmer-bg rounded-lg"></div>
                     <div className="h-4 w-full shimmer-bg rounded-lg"></div>
                     <div className="h-4 w-full shimmer-bg rounded-lg"></div>
                </div>
                <div className="space-y-4">
                     <div className="h-8 w-1/3 shimmer-bg rounded-lg mb-4"></div>
                     <div className="h-4 w-full shimmer-bg rounded-lg"></div>
                     <div className="h-4 w-full shimmer-bg rounded-lg"></div>
                     <div className="h-4 w-full shimmer-bg rounded-lg"></div>
                </div>
            </div>
        </div>
    </div>
);

interface RecipeCardProps {
    recipe: Recipe;
    imageUrl: string;
    onSave?: () => void;
    onDelete?: () => void;
    isSaved: boolean;
}

const RecipeResultCard: React.FC<RecipeCardProps> = ({ recipe, imageUrl, onSave, onDelete, isSaved }) => {
    const [activeTab, setActiveTab] = useState<'classic' | 'chef' | 'video'>('classic');
    const [copyText, setCopyText] = useState('Copy Recipe');
    const [selectedChefIndex, setSelectedChefIndex] = useState(0);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(recipe.videoUrl || null);
    const [videoError, setVideoError] = useState<string | null>(null);

    const handleCopy = useCallback(async (textToCopy?: string) => {
        let fullText = "";
        
        if (textToCopy) {
            fullText = textToCopy;
        } else if (activeTab === 'classic') {
            const ingredientsText = recipe.ingredients.map(i => `- ${i}`).join('\n');
            const instructionsText = recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n');
            fullText = `PalmPot Recipe: ${recipe.recipeName}\n\n${recipe.description}\n\nPrep: ${recipe.prepTime} | Cook: ${recipe.cookTime}\n\nIngredients:\n${ingredientsText}\n\nInstructions:\n${instructionsText}`;
        } else if (activeTab === 'chef' && recipe.chefVariations?.[selectedChefIndex]) {
             const variation = recipe.chefVariations[selectedChefIndex];
             const ingredientsText = variation.ingredients?.map(i => `- ${i}`).join('\n') || "Ingredients not listed";
             const instructionsText = variation.instructions?.map((step, i) => `${i + 1}. ${step}`).join('\n') || "Instructions not listed";
             fullText = `PalmPot Chef Recipe: ${variation.chefName}'s ${recipe.recipeName}\nTwist: ${variation.specialTwist}\n\nIngredients:\n${ingredientsText}\n\nInstructions:\n${instructionsText}`;
        }

        try {
            await navigator.clipboard.writeText(fullText);
            setCopyText('Copied!');
            setTimeout(() => setCopyText(activeTab === 'chef' ? 'Copy Chef Recipe' : 'Copy Recipe'), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }, [recipe, activeTab, selectedChefIndex]);
    
    // Reset chef index when switching tabs or recipe changes
    useEffect(() => {
        setSelectedChefIndex(0);
    }, [recipe]);

    const getYoutubeLink = (variation: ChefVariation) => {
        if (variation.youtubeUrl) return variation.youtubeUrl;
        const searchQuery = `${variation.chefName} ${recipe.recipeName} ${variation.videoTitle || 'recipe'}`;
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    };

    const triggerVideoGeneration = async () => {
        setIsGeneratingVideo(true);
        setVideoError(null);
        setActiveTab('video');
        
        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
                // Proceed assuming selection was successful per guidelines
            }

            const videoUrl = await generateRecipeVideo(recipe.recipeName, recipe.description, imageUrl);
            setGeneratedVideoUrl(videoUrl);
            recipe.videoUrl = videoUrl; // Persist in current object
        } catch (err: any) {
            console.error("Video error:", err);
            if (err.message === "API_KEY_ERROR") {
                setVideoError("A paid API key is required for video generation. Please select a valid key.");
                await (window as any).aistudio.openSelectKey();
            } else {
                setVideoError("Failed to generate cinematic video. Please try again later.");
            }
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    return (
        <div className="bg-[--panel] border border-[--border] rounded-3xl overflow-hidden shadow-xl animate-slide-in">
            {/* IMAGE */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden group">
                <img src={imageUrl} alt={recipe.recipeName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white flex justify-between items-end">
                    <div>
                         <h2 className="font-heading text-3xl md:text-5xl font-bold mb-2 shadow-sm">{recipe.recipeName}</h2>
                         <p className="text-white/80 text-sm hidden md:block">Authentic Nigerian Cuisine</p>
                    </div>
                    {activeTab !== 'video' && !generatedVideoUrl && !isGeneratingVideo && (
                        <button 
                            onClick={triggerVideoGeneration}
                            className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/30"
                            title="Generate Cinematic Video Summary"
                        >
                            <PlayIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* ACTION BAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 md:px-8 py-4 border-b border-[--border] bg-[--muted]/30">
                <div className="flex bg-[--muted] p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('classic')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'classic' ? 'bg-white text-[--text] shadow-sm' : 'text-[--subtext] hover:text-[--text]'}`}
                    >
                        Classic Recipe
                    </button>
                    <button
                        onClick={() => setActiveTab('chef')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chef' ? 'bg-white text-[--accent] shadow-sm' : 'text-[--subtext] hover:text-[--text]'}`}
                    >
                        Chef Editions
                        {recipe.chefVariations && recipe.chefVariations.length > 0 && (
                             <span className="bg-[--accent] text-white text-[10px] px-1.5 py-0.5 rounded-full">{recipe.chefVariations.length}</span>
                        )}
                    </button>
                    {(generatedVideoUrl || isGeneratingVideo) && (
                         <button
                            onClick={() => setActiveTab('video')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'video' ? 'bg-white text-[--accent] shadow-sm' : 'text-[--subtext] hover:text-[--text]'}`}
                        >
                            <PlayIcon className="w-4 h-4" />
                            Cinematic Summary
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                     <button
                        onClick={() => handleCopy()}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-[--border] bg-white hover:bg-[--muted] text-[--subtext] hover:text-[--text] transition-colors"
                    >
                        {copyText}
                    </button>
                    {onDelete ? (
                        <button
                            onClick={onDelete}
                            className="px-4 py-2 text-sm font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                            Delete
                        </button>
                    ) : onSave && (
                        <button
                            onClick={onSave}
                            disabled={isSaved}
                            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${isSaved ? 'bg-[--muted] text-[--subtext] cursor-default' : 'bg-[--accent] text-white hover:bg-[--ring] shadow-md'}`}
                        >
                            {isSaved ? 'Saved' : 'Save to Cookbook'}
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="p-6 md:p-10 min-h-[400px]">
                {activeTab === 'classic' && (
                    <div className="animate-slide-in">
                        <div className="flex gap-6 mb-8 text-[--subtext]">
                            <div className="flex items-center gap-2 bg-[--muted] px-3 py-1.5 rounded-lg">
                                <ClockIcon className="w-5 h-5 text-[--accent]" />
                                <span className="font-bold text-sm">Prep: {recipe.prepTime}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[--muted] px-3 py-1.5 rounded-lg">
                                <ClockIcon className="w-5 h-5 text-[--accent]" />
                                <span className="font-bold text-sm">Cook: {recipe.cookTime}</span>
                            </div>
                        </div>

                        <p className="text-lg text-[--subtext] italic mb-10 leading-relaxed max-w-3xl border-l-4 border-[--accent] pl-4 bg-[--accent-soft] py-4 rounded-r-lg">
                            {recipe.description}
                        </p>
                        
                        <div className="grid md:grid-cols-12 gap-10">
                            <div className="md:col-span-4">
                                <h3 className="font-heading text-xl font-bold text-[--text] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-1 bg-[--accent]"></span> Ingredients
                                </h3>
                                <ul className="space-y-3">
                                    {recipe.ingredients.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3 text-[--text] text-base">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[--accent]/60 shrink-0"></span>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="md:col-span-8">
                                <h3 className="font-heading text-xl font-bold text-[--text] mb-6 flex items-center gap-2">
                                     <span className="w-8 h-1 bg-[--accent]"></span> Instructions
                                </h3>
                                <div className="space-y-6">
                                    {recipe.instructions.map((step, index) => (
                                        <div key={index} className="flex gap-4 group">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full border border-[--border] text-[--subtext] font-mono text-sm flex items-center justify-center mt-0.5 group-hover:border-[--accent] group-hover:text-[--accent] transition-colors">
                                                {index + 1}
                                            </span>
                                            <p className="text-[--text] leading-relaxed mt-1">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'chef' && (
                    <div className="animate-slide-in">
                        <div className="mb-6 flex items-center justify-between">
                             <div>
                                <h3 className="font-heading text-2xl font-bold text-[--text]">Chef Variations</h3>
                                <p className="text-[--subtext] text-sm">Discover unique takes from top Nigerian creators.</p>
                             </div>
                        </div>
                        
                        {!recipe.chefVariations || recipe.chefVariations.length === 0 ? (
                            <div className="text-center py-10 text-[--subtext] bg-[--muted] rounded-2xl">
                                No specific chef variations found for this dish, but it's a classic!
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
                                <div className="w-full md:w-64 flex-shrink-0 flex overflow-x-auto md:flex-col gap-3 pb-4 md:pb-0 no-scrollbar snap-x">
                                    {recipe.chefVariations.map((variation, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedChefIndex(idx)}
                                            className={`flex-shrink-0 w-48 md:w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group snap-start
                                                ${selectedChefIndex === idx 
                                                    ? 'bg-white border-[--accent] shadow-md ring-1 ring-[--accent]' 
                                                    : 'bg-[--muted]/50 border-transparent hover:bg-white hover:border-[--border]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <ChefHatIcon className={`w-4 h-4 ${selectedChefIndex === idx ? 'text-[--accent]' : 'text-[--subtext]'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedChefIndex === idx ? 'text-[--accent]' : 'text-[--subtext]'}`}>Variation {idx + 1}</span>
                                            </div>
                                            <div className={`font-heading font-bold text-lg mb-1 leading-tight group-hover:text-[--accent] transition-colors ${selectedChefIndex === idx ? 'text-[--text]' : 'text-[--subtext]'}`}>{variation.chefName}</div>
                                            <div className="text-xs text-[--subtext] truncate">{variation.variationName}</div>
                                        </button>
                                    ))}
                                    <div className="hidden md:block pt-4 border-t border-[--border] mt-4">
                                        {(recipe.chefVariations[selectedChefIndex].videoTitle || recipe.chefVariations[selectedChefIndex].youtubeUrl) ? (
                                            <a 
                                                href={getYoutubeLink(recipe.chefVariations[selectedChefIndex])}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm group"
                                            >
                                                <YoutubeIcon className="w-5 h-5 group-hover:animate-pulse" />
                                                Watch Video
                                            </a>
                                        ) : (
                                            <div className="text-center py-2 px-3 bg-[--muted] rounded-lg text-xs text-[--subtext] italic">
                                                No video available for this specific variation.
                                            </div>
                                        )}
                                     </div>
                                </div>
                                <div className="flex-1 bg-white border border-[--border] rounded-2xl p-6 md:p-8 relative shadow-sm">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-[--accent-soft] rounded-bl-full opacity-60 pointer-events-none"></div>
                                    <div className="mb-8 relative z-10">
                                        <div className="flex flex-col gap-2 mb-4">
                                            <h4 className="font-heading text-3xl font-bold text-[--text]">{recipe.chefVariations[selectedChefIndex].variationName}</h4>
                                            <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full bg-[--text] text-white text-xs font-bold tracking-wide">
                                                By {recipe.chefVariations[selectedChefIndex].chefName}
                                            </span>
                                        </div>
                                        <div className="bg-[--accent-soft] border-l-4 border-[--accent] p-4 rounded-r-xl my-6">
                                             <p className="text-[--ring] font-medium leading-relaxed">
                                                <span className="uppercase text-xs font-black tracking-widest text-[--accent] block mb-1">The Special Twist</span> 
                                                {recipe.chefVariations[selectedChefIndex].specialTwist}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-8 relative z-10">
                                        <div>
                                            <h5 className="font-heading text-lg font-bold text-[--text] mb-4 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[--accent]"></span>
                                                Chef's Ingredients
                                            </h5>
                                            <ul className="space-y-2.5 text-sm border-l border-[--border] pl-4">
                                                {recipe.chefVariations[selectedChefIndex].ingredients ? (
                                                     recipe.chefVariations[selectedChefIndex].ingredients.map((item, i) => (
                                                        <li key={i} className="text-[--text] leading-snug">
                                                            {item}
                                                        </li>
                                                    ))
                                                ) : <li className="text-[--subtext] italic">No specific ingredients listed.</li>}
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="font-heading text-lg font-bold text-[--text] mb-4 flex items-center gap-2">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-[--accent]"></span>
                                                 Chef's Method
                                            </h5>
                                             <ol className="space-y-4 text-sm">
                                                {recipe.chefVariations[selectedChefIndex].instructions ? (
                                                    recipe.chefVariations[selectedChefIndex].instructions.map((step, i) => (
                                                        <li key={i} className="flex gap-3 text-[--text]">
                                                            <span className="flex-shrink-0 font-mono text-xs font-bold text-[--subtext] bg-[--muted] w-5 h-5 flex items-center justify-center rounded-full mt-0.5">{i + 1}</span>
                                                            <span className="leading-relaxed">{step}</span>
                                                        </li>
                                                    ))
                                                ) : <li className="text-[--subtext] italic">No specific instructions listed.</li>}
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'video' && (
                    <div className="animate-slide-in flex flex-col items-center justify-center min-h-[400px]">
                        {isGeneratingVideo ? (
                            <div className="text-center space-y-6">
                                <div className="relative w-24 h-24 mx-auto">
                                    <div className="absolute inset-0 border-4 border-[--accent] border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-4 bg-[--accent-soft] rounded-full flex items-center justify-center text-[--accent]">
                                        <PlayIcon className="w-8 h-8" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-heading text-xl font-bold text-[--text]">Cinematic Studio Active</h4>
                                    <p className="text-[--subtext] mt-2 max-w-sm mx-auto">We're rendering a mouth-watering cinematic summary of {recipe.recipeName}. This usually takes 1-2 minutes. Stay tuned!</p>
                                </div>
                                <div className="flex justify-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-[--accent] animate-bounce" style={{animationDelay: '0ms'}}></span>
                                    <span className="w-2 h-2 rounded-full bg-[--accent] animate-bounce" style={{animationDelay: '150ms'}}></span>
                                    <span className="w-2 h-2 rounded-full bg-[--accent] animate-bounce" style={{animationDelay: '300ms'}}></span>
                                </div>
                            </div>
                        ) : videoError ? (
                            <div className="text-center p-8 bg-red-50 border border-red-100 rounded-3xl max-w-md">
                                <p className="text-red-700 font-bold mb-4">{videoError}</p>
                                <button 
                                    onClick={triggerVideoGeneration}
                                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : generatedVideoUrl ? (
                            <div className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-white">
                                <video 
                                    src={generatedVideoUrl} 
                                    controls 
                                    autoPlay 
                                    className="w-full aspect-video"
                                />
                            </div>
                        ) : (
                             <div className="text-center">
                                <p className="text-[--subtext] mb-4">No video summary generated yet.</p>
                                <button 
                                    onClick={triggerVideoGeneration}
                                    className="px-6 py-3 bg-[--accent] text-white rounded-xl font-bold shadow-lg hover:bg-[--ring] transition-all"
                                >
                                    Generate Cinematic Summary
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PalmPotAVD;
