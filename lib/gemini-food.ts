import {
  dataUrlToInlineData,
  generateWithGemini,
  parseJsonResponse,
} from "@/lib/gemini";
import type { ScanResult } from "@/lib/types";

export type FoodImageItem = {
  name: string;
  weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type FoodImageAnalysis = {
  dish_name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  items: FoodImageItem[];
};

const FOOD_SYSTEM_PROMPT =
  'You are an expert nutritionist. Analyze this image and identify the visible food items, estimating their weight in grams. Calculate the calories and macros. You MUST return ONLY a valid JSON object with the exact structure: { "dish_name": "string", "total_calories": number, "total_protein": number, "total_carbs": number, "total_fat": number, "total_fiber": number, "items": [ { "name": "string", "weight_g": number, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number } ] }. Do not include any markdown formatting.';

const SCAN_SYSTEM_PROMPT =
  'Analyze the image. If it is not food, set is_food to false. If it is food, generate 1 to 3 multiple-choice questions to determine missing context (like portion sizes or cooking methods: e.g., "How was the chicken cooked?"). For each question, provide 2 to 4 highly plausible options. Do not include an "Other" option; the frontend will add that automatically.';

const CALCULATE_SYSTEM_PROMPT =
  "You are an expert dietitian. Using the image AND the user's specific answers to the clarifying questions, calculate the exact nutritional breakdown. Strictly use the 4-4-9 mathematical rule.";

function normalizeToInlineData(imageBase64OrDataUrl: string): {
  mimeType: string;
  data: string;
} {
  if (imageBase64OrDataUrl.startsWith("data:")) {
    return dataUrlToInlineData(imageBase64OrDataUrl);
  }

  // Assume plain base64 JPEG if client sends raw base64 without data URL header.
  return {
    mimeType: "image/jpeg",
    data: imageBase64OrDataUrl,
  };
}

export async function analyzeFoodImageBase64(
  imageBase64OrDataUrl: string,
): Promise<FoodImageAnalysis> {
  const inlineData = normalizeToInlineData(imageBase64OrDataUrl);

  // Required debug signal: verify a fresh image payload is being sent.
  console.log(`[Gemini] outgoing base64 length: ${inlineData.data.length}`);

  const raw = await generateWithGemini(
    [
      {
        role: "user",
        parts: [
          {
            text: "Analyze this food image and return the required JSON object.",
          },
          { inlineData: inlineData },
        ],
      },
    ],
    {
      responseMimeType: "application/json",
      systemPrompt: FOOD_SYSTEM_PROMPT,
    },
  );

  const parsed = parseJsonResponse<FoodImageAnalysis>(raw);
  return {
    dish_name: parsed.dish_name,
    total_calories: Number(parsed.total_calories) || 0,
    total_protein: Number(parsed.total_protein) || 0,
    total_carbs: Number(parsed.total_carbs) || 0,
    total_fat: Number(parsed.total_fat) || 0,
    total_fiber: Number(parsed.total_fiber) || 0,
    items: (parsed.items || []).map((item) => ({
      name: item.name,
      weight_g: Number(item.weight_g) || 0,
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      fiber: Number(item.fiber) || 0,
    })),
  };
}

export async function scanFoodImageBase64(
  imageBase64OrDataUrl: string,
): Promise<ScanResult> {
  const inlineData = normalizeToInlineData(imageBase64OrDataUrl);
  console.log(`[Gemini][scan] outgoing base64 length: ${inlineData.data.length}`);

  const raw = await generateWithGemini(
    [
      {
        role: "user",
        parts: [
          {
            text: "Scan this image and return only the scan JSON result.",
          },
          { inlineData: inlineData },
        ],
      },
    ],
    {
      responseMimeType: "application/json",
      systemPrompt: SCAN_SYSTEM_PROMPT,
      responseSchema: {
        type: "OBJECT",
        properties: {
          is_food: { type: "BOOLEAN" },
          questions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                text: { type: "STRING" },
                options: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
              },
              required: ["id", "text", "options"],
            },
          },
        },
        required: ["is_food", "questions"],
      },
    },
  );

  const parsed = parseJsonResponse<ScanResult>(raw);
  return {
    is_food: Boolean(parsed.is_food),
    questions: Array.isArray(parsed.questions)
      ? parsed.questions.slice(0, 3).map((q, index) => ({
          id: q.id?.trim() || `q_${index + 1}`,
          text: q.text?.trim() || `Question ${index + 1}`,
          options: Array.isArray(q.options)
            ? q.options
                .map((option) => String(option || "").trim())
                .filter(Boolean)
                .slice(0, 4)
            : [],
        }))
      : [],
  };
}

export async function calculateFoodFromImageAndAnswers(
  imageBase64OrDataUrl: string,
  clarifications: string,
): Promise<FoodImageAnalysis> {
  const inlineData = normalizeToInlineData(imageBase64OrDataUrl);
  console.log(
    `[Gemini][calculate] outgoing base64 length: ${inlineData.data.length}`,
  );

  const raw = await generateWithGemini(
    [
      {
        role: "user",
        parts: [
          {
            text: `User clarifications:\n${clarifications}`,
          },
          { inlineData: inlineData },
        ],
      },
    ],
    {
      responseMimeType: "application/json",
      systemPrompt: `${CALCULATE_SYSTEM_PROMPT}\nReturn only valid JSON with this exact structure: { "dish_name": "string", "total_calories": number, "total_protein": number, "total_carbs": number, "total_fat": number, "total_fiber": number, "items": [ { "name": "string", "weight_g": number, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number } ] }.`,
      responseSchema: {
        type: "OBJECT",
        properties: {
          dish_name: { type: "STRING" },
          total_calories: { type: "NUMBER" },
          total_protein: { type: "NUMBER" },
          total_carbs: { type: "NUMBER" },
          total_fat: { type: "NUMBER" },
          total_fiber: { type: "NUMBER" },
          items: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                weight_g: { type: "NUMBER" },
                calories: { type: "NUMBER" },
                protein: { type: "NUMBER" },
                carbs: { type: "NUMBER" },
                fat: { type: "NUMBER" },
                fiber: { type: "NUMBER" },
              },
              required: [
                "name",
                "weight_g",
                "calories",
                "protein",
                "carbs",
                "fat",
                "fiber",
              ],
            },
          },
        },
        required: [
          "dish_name",
          "total_calories",
          "total_protein",
          "total_carbs",
          "total_fat",
          "total_fiber",
          "items",
        ],
      },
    },
  );

  const parsed = parseJsonResponse<FoodImageAnalysis>(raw);
  return {
    dish_name: parsed.dish_name,
    total_calories: Number(parsed.total_calories) || 0,
    total_protein: Number(parsed.total_protein) || 0,
    total_carbs: Number(parsed.total_carbs) || 0,
    total_fat: Number(parsed.total_fat) || 0,
    total_fiber: Number(parsed.total_fiber) || 0,
    items: (parsed.items || []).map((item) => ({
      name: item.name,
      weight_g: Number(item.weight_g) || 0,
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      fiber: Number(item.fiber) || 0,
    })),
  };
}
