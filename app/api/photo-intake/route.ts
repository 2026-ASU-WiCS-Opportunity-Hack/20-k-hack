import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `This is a client intake form. Extract all visible fields and return ONLY a JSON object with these exact keys, no other text:
{
  "name": "",
  "date_of_birth": "",
  "phone": "",
  "email": "",
  "gender": "",
  "language": "",
  "household_size": "",
  "notes": ""
}
Fill in whatever is visible. Leave empty string if not found.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const extracted = JSON.parse(clean);

    return NextResponse.json({ success: true, data: extracted });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to process image" },
      { status: 500 }
    );
  }
}