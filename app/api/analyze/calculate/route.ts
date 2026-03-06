import { NextRequest, NextResponse } from "next/server";
import { calculateFoodFromImageAndAnswers } from "@/lib/gemini-food";
import type { MealAnalysis } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = body?.image as string | undefined;
    const clarifications = body?.clarifications as string | undefined;

    if (!image) {
      return NextResponse.json(
        { success: false, message: "Image is required" },
        { status: 400 },
      );
    }

    if (!clarifications?.trim()) {
      return NextResponse.json(
        { success: false, message: "Clarifications are required" },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: "API key missing" },
        { status: 500 },
      );
    }

    const parsed = await calculateFoodFromImageAndAnswers(image, clarifications);

    const analysis: MealAnalysis = {
      name: parsed.dish_name || "Analyzed Meal",
      calories: Math.max(0, Math.round(parsed.total_calories)),
      protein: Math.max(0, Math.round(parsed.total_protein)),
      carbs: Math.max(0, Math.round(parsed.total_carbs)),
      fat: Math.max(0, Math.round(parsed.total_fat)),
      fiber: Math.max(0, Math.round(parsed.total_fiber)),
      items: (parsed.items || []).map((item) => ({
        name: item.name,
        portion: `${Math.max(0, Math.round(item.weight_g))}g`,
        calories: Math.max(0, Math.round(item.calories)),
        protein: Math.max(0, Math.round(item.protein)),
        carbs: Math.max(0, Math.round(item.carbs)),
        fat: Math.max(0, Math.round(item.fat)),
      })),
    };

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("[API Route] Calculate Failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to calculate meal",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
