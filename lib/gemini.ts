type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type GeminiContent = {
  role: "user";
  parts: GeminiPart[];
};

export async function generateWithGemini(
  contents: GeminiContent[],
  options?: {
    model?: string;
    responseMimeType?: string;
    systemPrompt?: string;
    responseSchema?: Record<string, unknown>;
  },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const model =
    options?.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(options?.systemPrompt
          ? { system_instruction: { parts: [{ text: options.systemPrompt }] } }
          : {}),
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: options?.responseMimeType,
          ...(options?.responseSchema
            ? { responseSchema: options.responseSchema }
            : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.find(
    (p: any) => typeof p?.text === "string",
  )?.text;
  if (!text) {
    throw new Error("Gemini returned empty content.");
  }

  return text;
}

export function parseJsonResponse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");
    return JSON.parse(cleaned) as T;
  }
}

export function dataUrlToInlineData(imageDataUrl: string): {
  mimeType: string;
  data: string;
} {
  const match = imageDataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format. Expected data URL.");
  }
  return { mimeType: match[1], data: match[2] };
}
