import { NextRequest, NextResponse } from "next/server";
import { scanFoodImageBase64 } from "@/lib/gemini-food";
import type { ScanResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = body?.image as string | undefined;

    if (!image) {
      return NextResponse.json(
        { success: false, message: "Image is required" },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: "API key missing" },
        { status: 500 },
      );
    }

    const scan = await scanFoodImageBase64(image);
    const result: ScanResult = {
      is_food: Boolean(scan.is_food),
      questions: Array.isArray(scan.questions) ? scan.questions : [],
    };

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[API Route] Scan Failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to scan meal image",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
