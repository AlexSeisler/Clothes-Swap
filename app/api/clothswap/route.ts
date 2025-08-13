import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const dynamic = "force-dynamic";

// Configure FAL credentials from env
fal.config({
  credentials: process.env.FAL_KEY || ""
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const sourceImage = formData.get("source_image");
    const referenceGarment = formData.get("reference_garment");
    const prompt = formData.get("prompt");

    if (!(sourceImage instanceof File)) {
      return NextResponse.json({ error: "source_image file is required" }, { status: 400 });
    }
    if (!(referenceGarment instanceof File)) {
      return NextResponse.json({ error: "reference_garment file is required" }, { status: 400 });
    }

    // Upload files to FAL storage
    const humanImageUrl = await fal.storage.upload(sourceImage);
    const garmentImageUrl = await fal.storage.upload(referenceGarment);

    // Prepare data for n8n webhook
    const forwardData = new FormData();
    forwardData.append("human_image_url", humanImageUrl);
    forwardData.append("garment_image_url", garmentImageUrl);

    if (prompt && typeof prompt === "string" && prompt.trim()) {
      forwardData.append("prompt", prompt.trim());
    }

    // Forward to n8n webhook URL
    const n8nUrl =
      process.env.N8N_WEBHOOK_URL ||
      "https://1caade28f2a1.ngrok-free.app/webhook/clothswap";

    const res = await fetch(n8nUrl, {
      method: "POST",
      body: forwardData
    });

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("Error in ClothSwap API route:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
