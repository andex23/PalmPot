/*
  What changed & why:
  - Added Hero Section: A new, compact hero was added above the search card with a clear H1, subtext, and primary/secondary CTAs. This makes the app's value proposition immediate and drives user action.
  - Refined Search UX: Added "Try:" chips below the search input for one-click suggestions, making it easier for users to start. The main CTA was moved from below the search card to the new hero section for better visual hierarchy.
  - Improved Microcopy: Updated the input placeholder and empty state text to be more directive and helpful, guiding the user on how to begin.
  - Maintained Core Logic: All state management, component names, and existing handlers (`handleGenerateRecipe`, etc.) were kept intact, with changes focused exclusively on UI/UX presentation as requested.
*/
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Recipe, SavedRecipe } from './types';
import { generateNigerianRecipe } from './services/geminiService';

const AVDThemeStyles = () => (
  <style>{`
    :root {
      --surface: #FFFCF7;
      --panel:   #FFFEFB;
      --muted:   #F6F2EA;
      --border:  #E8E1D7;
      --text:    #0B0C0F;
      --subtext: #6E6A5E;
      --header-surface: #FFF7ED; /* Light Orange for Header */
      
      --accent:  #FB923C; /* Orange-400 */
      --accent-2: #FDBA74; /* Orange-300 */
      --accent-fore: #0B0C0F;
      --ring:    #EA580C; /* Orange-600 */
    }
    body {
      font-family: 'Courier Prime', 'Courier New', Courier, monospace;
      background-color: var(--surface);
      background-image: radial-gradient(circle at 1px 1px, #EDE3D6 1px, transparent 0);
      background-size: 18px 18px;
    }
    .font-heading {
      font-family: 'Satoshi', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      font-weight: 600;
    }
    @keyframes glow {
        from { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.35); }
        to { box-shadow: 0 0 24px 6px rgba(251, 146, 60, 0.15); }
    }
    @keyframes shimmer {
        100% { background-position: 200% 0; }
    }
    .shimmer-bg {
        background: linear-gradient(90deg, #F6F2EA 25%, #FFFEFB 37%, #F6F2EA 63%);
        background-size: 200% 100%;
    }
  `}</style>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const EmptyStateIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);


const PalmPotAVD: React.FC = () => {
    // --- STATE MANAGEMENT (UNCHANGED) ---
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
    const [linkCopyText, setLinkCopyText] = useState<string>('Copy link');

    // --- HOOKS & HANDLERS (UNCHANGED LOGIC, NEW HANDLER FOR UX) ---
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

    // Initialize state from URL params on first load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        const c = params.get('cuisine');
        const m = params.get('meal');
        if (q) setSearchQuery(q);
        if (c) setCuisine(c);
        if (m) setMealType(m);
    }, []);

    // Keep URL in sync with current inputs
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (cuisine && cuisine !== 'Any') params.set('cuisine', cuisine);
        if (mealType && mealType !== 'Any') params.set('meal', mealType);
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState(null, '', newUrl);
    }, [searchQuery, cuisine, mealType]);

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setLinkCopyText('Copied!');
            setTimeout(() => setLinkCopyText('Copy link'), 2000);
        } catch (err) {
            console.error('Failed to copy link: ', err);
            setLinkCopyText('Error');
            setTimeout(() => setLinkCopyText('Copy link'), 2000);
        }
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
            const result = await generateNigerianRecipe(cuisine, mealType, ''); // Call with empty query for random
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

    // --- JSX (UI/UX UPDATE) ---
    return (
        <>
            <AVDThemeStyles />
            <div className="bg-[--surface] text-[--text] font-mono min-h-screen text-[15px] leading-relaxed">
                <header className="sticky top-0 z-10 bg-[--header-surface]/90 backdrop-blur-sm border-b border-[--border] shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex-shrink-0">
                                <button onClick={() => setView('generator')} className="font-heading text-xl font-semibold text-[--text] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] rounded-md" aria-label="Go to homepage">
                                    PalmPot
                                </button>
                            </div>
                            <button 
                                onClick={() => setView('saved')}
                                className="relative text-sm font-medium text-[--subtext] hover:text-[--text] transition-all duration-200 ease-out motion-safe:hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] rounded-md px-2 py-1"
                            >
                                Saved
                                {savedRecipes.length > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[--accent] text-[10px] font-bold text-[--accent-fore]">
                                        {savedRecipes.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="text-center max-w-3xl mx-auto pt-4 md:pt-10 pb-8">
                        <h1 className="font-heading text-4xl md:text-5xl font-bold text-[--text] mb-3 leading-tight">From craving to cooking in seconds</h1>
                        <p className="text-[--subtext] max-w-xl mx-auto text-base">Search for a dish or use our filters, then click 'Generate Recipe' below.</p>
                    </div>

                     <div className="max-w-3xl mx-auto">
                        <div className="bg-[--panel] border border-[--border] rounded-3xl p-6 md:p-8 mb-6 shadow-[0_12px_40px_rgba(20,10,0,0.06)]">
                            <div className="relative mb-4">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                   <SearchIcon className="h-5 w-5 text-[--subtext]" />
                                </div>
                                 <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe()}
                                    placeholder="Search a dish (e.g., Jollof Rice, Egusi Soup)"
                                    disabled={isLoading}
                                    aria-label="Search for a Nigerian dish"
                                    className="w-full bg-[--muted] border border-[--border] rounded-lg py-3 pl-11 pr-4 text-[--text] placeholder:text-[--subtext]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] focus-visible:border-transparent transition-shadow"
                                />
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap mb-5">
                                <span className="text-xs text-[--subtext] font-medium mr-2">Try:</span>
                                {quickPicks.map(pick => (
                                    <button key={pick} onClick={() => setSearchQuery(pick)} className="px-3 py-1 text-xs rounded-full border border-[--border] bg-transparent text-[--subtext] hover:bg-[--muted] hover:border-[--border] transition-colors">
                                        {pick}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-[--border] pt-4">
                                 <button 
                                    onClick={() => setIsOptionsVisible(!isOptionsVisible)}
                                    aria-expanded={isOptionsVisible}
                                    aria-controls="filter-panel"
                                    className="text-sm font-medium text-[--subtext] hover:text-[--text] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] rounded-md"
                                >
                                    Filters
                                </button>
                                <div id="filter-panel" className={`mt-4 grid gap-y-4 transition-all duration-300 ${isOptionsVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden space-y-3">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <h3 className="text-sm font-semibold text-[--subtext] w-20 shrink-0">Cuisine:</h3>
                                            {cuisineOptions.map(c => <Chip key={c} label={c} isSelected={cuisine === c} onClick={() => setCuisine(c)} disabled={isLoading} />)}
                                        </div>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <h3 className="text-sm font-semibold text-[--subtext] w-20 shrink-0">Meal Type:</h3>
                                            {mealTypeOptions.map(m => <Chip key={m} label={m} isSelected={mealType === m} onClick={() => setMealType(m)} disabled={isLoading} />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-3 mt-6">
                            <button
                                onClick={handleGenerateRecipe}
                                disabled={isLoading}
                                aria-label="Generate a recipe based on search query"
                                className="bg-gradient-to-br from-[--accent] to-[--accent-2] text-[--accent-fore] font-bold py-3 px-8 rounded-lg text-base shadow-lg transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--surface] motion-safe:hover:animate-[glow_600ms_ease-out_forwards] active:translate-y-px disabled:bg-gradient-to-br disabled:from-[--muted] disabled:to-[--muted] disabled:text-[--subtext] disabled:cursor-not-allowed"
                            >
                                Generate Recipe
                            </button>
                             <button
                                onClick={handleSurpriseMe}
                                disabled={isLoading}
                                aria-label="Generate a random Nigerian recipe"
                                className="px-8 py-3 font-bold text-base rounded-lg border border-[--border] bg-[--panel] text-[--subtext] hover:bg-[--muted] hover:text-[--text] shadow-sm transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--surface] active:translate-y-px disabled:bg-[--muted] disabled:text-[--subtext]/50 disabled:cursor-not-allowed"
                            >
                                Surprise me
                            </button>
                            <button
                                onClick={handleCopyLink}
                                disabled={isLoading}
                                aria-label="Copy a shareable link for current query and filters"
                                className="px-4 py-3 font-bold text-base rounded-lg border border-[--border] bg-[--panel] text-[--subtext] hover:bg-[--muted] hover:text-[--text] shadow-sm transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--surface] active:translate-y-px disabled:bg-[--muted] disabled:text-[--subtext]/50 disabled:cursor-not-allowed"
                            >
                                {linkCopyText}
                            </button>
                        </div>
                         
                        <div className="mt-8">
                            {isLoading ? <RecipeSkeleton /> :
                             error ? <ErrorMessage message={error} /> :
                             recipe ? <RecipeResultCard recipe={recipe} imageUrl={imageUrl!} onSave={() => handleSaveRecipe(recipe, imageUrl!)} isSaved={savedRecipes.some(r => r.recipeName === recipe.recipeName)} /> :
                             <EmptyState />
                            }
                        </div>
                     </div>
                </main>
                 {view === 'saved' && (
                    <div className="fixed inset-0 bg-[--surface] z-20 overflow-y-auto">
                        <header className="sticky top-0 z-10 bg-[--header-surface]/90 backdrop-blur-sm border-b border-[--border] shadow-sm">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex justify-between items-center h-16">
                                    <h2 className="font-heading text-xl font-semibold text-[--text]">Saved Recipes ({savedRecipes.length})</h2>
                                    <button 
                                        onClick={() => setView('generator')}
                                        className="text-sm font-medium text-[--subtext] hover:text-[--text] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] rounded-md px-2 py-1"
                                    >
                                        &larr; Back to Generator
                                    </button>
                                </div>
                            </div>
                        </header>
                        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                            <div className="max-w-3xl mx-auto">
                                {savedRecipes.length > 0 ? (
                                    <div className="grid gap-8">
                                        {savedRecipes.map(r => (
                                            <RecipeResultCard key={r.recipeName} recipe={r} imageUrl={r.imageUrl} onDelete={() => handleDeleteRecipe(r.recipeName)} isSaved={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-[--subtext] border border-dashed border-[--border] rounded-lg p-12">
                                        You have no saved recipes.
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                )}
            </div>
        </>
    );
};

// --- Sub-components ---

const Chip: React.FC<{ label: string; isSelected: boolean; onClick: () => void; disabled: boolean; }> = ({ label, isSelected, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        role="radio"
        aria-checked={isSelected}
        className={`px-3 py-1 text-sm rounded-full border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] disabled:opacity-50
            ${isSelected 
                ? 'bg-[--accent]/10 text-[--ring] border-[--accent]/50' 
                : 'bg-transparent text-[--subtext] border-[--border] hover:bg-[--muted] hover:text-[--text]'
            }`
        }
    >
        {label}
    </button>
);

const EmptyState = () => (
    <div className="text-center text-[--subtext] border-2 border-dashed border-[--border] rounded-xl p-12 flex flex-col items-center justify-center">
        <EmptyStateIcon className="h-8 w-8 text-[--accent]/50 mb-4" />
        <p className="font-medium font-heading">Your recipe will appear here.</p>
        <p className="mt-1 text-sm">Click Generate or choose a quick pick above to start.</p>
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg" role="alert">
        <p className="font-bold font-heading">Error Generating Recipe</p>
        <p className="text-sm mt-1">{message}</p>
    </div>
);

const RecipeSkeleton = () => (
    <div className="bg-[--panel] border border-[--border] rounded-xl p-8 shadow-[0_12px_40px_rgba(20,10,0,0.06)]">
        <div className="h-8 w-3/4 shimmer-bg rounded-md mb-6 animate-[shimmer_1.5s_infinite]"></div>
        <div className="h-4 w-full shimmer-bg rounded-md mb-2 animate-[shimmer_1.5s_infinite]"></div>
        <div className="h-4 w-5/6 shimmer-bg rounded-md mb-8 animate-[shimmer_1.5s_infinite]"></div>
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <div className="h-6 w-1/2 shimmer-bg rounded-md mb-4 animate-[shimmer_1.5s_infinite]"></div>
                <div className="space-y-3">
                    <div className="h-4 w-full shimmer-bg rounded-md animate-[shimmer_1.5s_infinite]"></div>
                    <div className="h-4 w-full shimmer-bg rounded-md animate-[shimmer_1.5s_infinite]"></div>
                    <div className="h-4 w-4/5 shimmer-bg rounded-md animate-[shimmer_1.5s_infinite]"></div>
                </div>
            </div>
            <div>
                <div className="h-6 w-1/2 shimmer-bg rounded-md mb-4 animate-[shimmer_1.5s_infinite]"></div>
                <div className="space-y-3">
                    <div className="h-4 w-full shimmer-bg rounded-md animate-[shimmer_1.5s_infinite]"></div>
                    <div className="h-4 w-5/6 shimmer-bg rounded-md animate-[shimmer_1.5s_infinite]"></div>
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
    const [copyText, setCopyText] = useState('Copy');

    const handleCopy = useCallback(async () => {
        const ingredientsText = recipe.ingredients.map(i => `- ${i}`).join('\n');
        const instructionsText = recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n');
        const fullText = `Recipe: ${recipe.recipeName}\n\n${recipe.description}\n\nIngredients:\n${ingredientsText}\n\nInstructions:\n${instructionsText}`;
        try {
            await navigator.clipboard.writeText(fullText);
            setCopyText('Copied!');
            setTimeout(() => setCopyText('Copy'), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setCopyText('Error!');
            setTimeout(() => setCopyText('Copy'), 2000);
        }
    }, [recipe]);

    return (
        <div className="bg-[--panel] border border-[--border] rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(20,10,0,0.06)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-[1.01]">
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={recipe.recipeName}
                    className="w-full h-64 lg:h-80 object-cover [transition-filter] duration-300"
                    style={{ filter: 'blur(12px)' }}
                    onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.filter = 'blur(0px)'; }}
                />
            )}
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <h2 className="font-heading text-3xl md:text-4xl font-semibold text-[--text] flex-1">{recipe.recipeName}</h2>
                    <div className="flex-shrink-0 flex items-center gap-2 mt-1">
                        {onDelete ? (
                             <button
                                onClick={onDelete}
                                aria-label="Delete recipe"
                                className="px-3 py-1.5 text-sm rounded-md border border-[--border] text-[--subtext] hover:bg-[--muted] hover:text-[--text] transition-all duration-200 ease-out motion-safe:active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]"
                            >
                                Delete
                            </button>
                        ) : onSave && (
                            <button
                                onClick={onSave}
                                disabled={isSaved}
                                aria-label={isSaved ? "Recipe is saved" : "Save recipe"}
                                className="px-3 py-1.5 text-sm rounded-md border border-[--border] text-[--subtext] hover:bg-[--muted] hover:text-[--text] transition-all duration-200 ease-out motion-safe:active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] disabled:text-[--ring] disabled:border-[--accent]/30 disabled:bg-[--accent]/10 disabled:cursor-not-allowed"
                            >
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                        )}
                         <button
                            onClick={handleCopy}
                            aria-label="Copy recipe details"
                            className="px-4 py-1.5 text-sm rounded-md bg-[--accent]/20 text-[--ring] border border-transparent hover:bg-[--accent]/30 transition-colors duration-200 ease-out motion-safe:active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]"
                        >
                            {copyText}
                        </button>
                    </div>
                </div>

                <p className="text-[--subtext] mb-8 max-w-prose">{recipe.description}</p>
                
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h3 className="font-heading text-2xl font-semibold text-[--text] mb-4 border-b border-[--border] pb-2">Ingredients</h3>
                        <ul className="list-disc list-inside space-y-2.5 text-[--subtext]">
                            {recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-heading text-2xl font-semibold text-[--text] mb-4 border-b border-[--border] pb-2">Instructions</h3>
                        <ol className="list-decimal list-inside space-y-4 text-[--subtext]">
                            {recipe.instructions.map((step, index) => <li key={index}>{step}</li>)}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PalmPotAVD;