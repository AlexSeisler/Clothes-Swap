import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Build new FormData with remapped field names
    const forwardData = new FormData();

    const sourceImage = formData.get("source_image");
    if (sourceImage && sourceImage instanceof File) {
      forwardData.append("human_image", sourceImage, sourceImage.name);
    }

    const referenceGarment = formData.get("reference_garment");
    if (referenceGarment && referenceGarment instanceof File) {
      forwardData.append("garment_image", referenceGarment, referenceGarment.name);
    }

    const prompt = formData.get("prompt");
    if (prompt && typeof prompt === "string") {
      forwardData.append("prompt", prompt);
    }

    // Forward to n8n webhook
    const n8nUrl = process.env.N8N_WEBHOOK_URL || "https://1caade28f2a1.ngrok-free.app/webhook/clothswap";
    const res = await fetch(n8nUrl, {
      method: "POST",
      body: forwardData
    });

    const data = await res.json();
    console.log("n8n raw response:", data);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error forwarding to n8n:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
