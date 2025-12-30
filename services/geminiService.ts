
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

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
        prepTime: {
            type: Type.STRING,
            description: "Preparation time (e.g., '20 mins')."
        },
        cookTime: {
            type: Type.STRING,
            description: "Cooking time (e.g., '45 mins')."
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
        },
        chefVariations: {
            type: Type.ARRAY,
            description: "Exactly 5 distinct Nigerian chef interpretations. Prioritize accuracy and diversity.",
            items: {
                type: Type.OBJECT,
                properties: {
                    chefName: { type: Type.STRING, description: "Name of the popular chef or food content creator." },
                    variationName: { type: Type.STRING, description: "Name of their style (e.g. 'Party Jollof', 'Native Style', 'Coconut Twist')." },
                    specialTwist: { type: Type.STRING, description: "Description of the unique ingredient or technique they use." },
                    ingredients: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "The specific list of ingredients used by this chef for this variation." 
                    },
                    instructions: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "The specific step-by-step instructions for this chef's version." 
                    },
                    videoTitle: {
                        type: Type.STRING,
                        description: "The EXACT title of the chef's YouTube video for this dish. If you are not 100% sure they have a video, leave empty."
                    },
                    youtubeUrl: {
                        type: Type.STRING,
                        description: "The direct YouTube URL (e.g., https://www.youtube.com/watch?v=...) if known. Leave empty if unsure."
                    }
                }
            }
        }
    },
    required: ["recipeName", "description", "prepTime", "cookTime", "ingredients", "instructions", "chefVariations"],
};

export const generateNigerianRecipe = async (cuisine: string, mealType: string, searchQuery: string): Promise<{ recipe: Recipe; imageUrl: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        console.log(`Generating recipe for Search: "${searchQuery}", Cuisine: ${cuisine}, Meal Type: ${mealType}`);

        let prompt = "";
        if (searchQuery) {
            prompt = `Generate a recipe for the Nigerian dish: "${searchQuery}".`;
        } else {
            prompt = "Generate a recipe for a popular and delicious Nigerian food.";
        }
        
        prompt += " Provide a short description, prep time, cook time, ingredients, and simple instructions.";
        prompt += " IMPORTANT - CHEF VARIATIONS: Provide exactly 5 distinct 'Chef Variations'.";
        prompt += " CHEF SELECTION RULES: 1. ACCURACY IS PARAMOUNT. Only include a chef if they actually have a recipe for this dish. 2. DIVERSITY. Do not simply list the top 3 every time. Select from a wide pool including: Sisi Yemmie, Ify's Kitchen, Diary of a Kitchen Lover, Zeelicious, Chef Fregz, Hilda Baci, 9jafoodie, Sisi Jemimah, Kikifoodies, Flo Chinyere, Winifred Emmanuel, Kitchen Muse, Tspices Kitchen, Yammy's Kitchen, The Nittie Gritties. 3. If a specific chef is famous for this dish, include them.";
        prompt += " VIDEO LINKS: For each chef, if they have a YouTube video for this dish, provide the 'videoTitle'. If you know the direct link, provide 'youtubeUrl'. If no video exists, leave both fields empty. DO NOT GUESS.";

        if (cuisine && cuisine !== 'Any') {
            prompt += ` The recipe should be a classic dish from the ${cuisine} cuisine of Nigeria.`;
        }
        if (mealType && mealType !== 'Any') {
            prompt += ` It should be suitable for ${mealType}.`;
        }


        const recipeResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.6,
            },
        });
        
        const recipeText = recipeResponse.text.trim();
        const recipe: Recipe = JSON.parse(recipeText);

        console.log(`Recipe for ${recipe.recipeName} generated. Now generating image...`);
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A delicious, mouth-watering plate of Nigerian ${recipe.recipeName}, professionally photographed with vibrant colors, served hot. High quality food photography.`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });
        
        const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        console.log("Image generated successfully.");

        return { recipe, imageUrl };

    } catch (error) {
        console.error("Error generating recipe or image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate recipe. Please try again. Details: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the recipe.");
    }
};

export const generateRecipeVideo = async (recipeName: string, description: string, base64Image?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        console.log(`Generating cinematic video summary for: ${recipeName}`);
        
        const prompt = `A short, mouth-watering cinematic food video summary of the Nigerian dish ${recipeName}. ${description}. The video should show the vibrant colors of the food, steam rising, and a professional plating. Cinematic lighting.`;
        
        const videoParams: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        };

        if (base64Image) {
            // Remove data:image/...;base64, prefix
            const cleanBase64 = base64Image.split(',')[1] || base64Image;
            videoParams.image = {
                imageBytes: cleanBase64,
                mimeType: 'image/jpeg'
            };
        }

        let operation = await ai.models.generateVideos(videoParams);

        while (!operation.done) {
            console.log("Video generation in progress... checking again in 10s");
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Failed to retrieve video download link.");
        }

        // Return the link with the current API key appended for fetching
        return `${downloadLink}&key=${process.env.API_KEY}`;
    } catch (error) {
        console.error("Error generating video:", error);
        if (error instanceof Error && error.message.includes("Requested entity was not found")) {
            throw new Error("API_KEY_ERROR");
        }
        throw error;
    }
};
