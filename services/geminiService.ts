import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: {
            type: Type.STRING,
            description: "The name of the Nigerian dish."
        },
        description: {
            type: Type.STRING,
            description: "A short, enticing description of the dish."
        },
        ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of ingredients with quantities."
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Step-by-step cooking instructions, made very simple for beginners."
        }
    },
    required: ["recipeName", "description", "ingredients", "instructions"],
};

export const generateNigerianRecipe = async (cuisine: string, mealType: string, searchQuery: string): Promise<{ recipe: Recipe; imageUrl: string }> => {
    try {
        console.log(`Generating recipe for Search: "${searchQuery}", Cuisine: ${cuisine}, Meal Type: ${mealType}`);

        let prompt = "";
        if (searchQuery) {
            prompt = `Generate a recipe for the Nigerian dish: "${searchQuery}".`;
        } else {
            prompt = "Generate a recipe for a popular and delicious Nigerian food.";
        }
        
        prompt += " Provide a short, enticing description, a list of ingredients with quantities, and simple, easy-to-follow, step-by-step cooking instructions. The instructions should be beginner-friendly.";

        if (cuisine && cuisine !== 'Any') {
            prompt += ` The recipe should be a classic dish from the ${cuisine} cuisine of Nigeria.`;
        }
        if (mealType && mealType !== 'Any') {
            prompt += ` It should be suitable for ${mealType}.`;
        }


        const recipeResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 1,
            },
        });
        
        const recipeText = recipeResponse.text.trim();
        const recipe: Recipe = JSON.parse(recipeText);

        console.log(`Recipe for ${recipe.recipeName} generated. Now generating image...`);
        let imageUrl: string;
        try {
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A delicious, mouth-watering plate of Nigerian ${recipe.recipeName}, professionally photographed with vibrant colors, served hot.`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });
            const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
            imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            console.log("Image generated successfully.");
        } catch (imgError) {
            console.warn("Image generation failed, using Unsplash fallback instead.", imgError);
            const query = encodeURIComponent(`${recipe.recipeName} nigerian food`);
            // Deterministic signature based on dish name to stabilize image across sessions
            let hash = 0;
            for (let i = 0; i < recipe.recipeName.length; i++) {
                hash = ((hash << 5) - hash) + recipe.recipeName.charCodeAt(i);
                hash |= 0;
            }
            const sig = Math.abs(hash);
            imageUrl = `https://source.unsplash.com/1280x720/?${query}&sig=${sig}`;
        }

        return { recipe, imageUrl };

    } catch (error) {
        console.error("Error generating recipe or image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate recipe. Please try again. Details: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the recipe.");
    }
};