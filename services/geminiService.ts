
import { GoogleGenAI } from "@google/genai";
import { DesignMode, ReferenceImage, GenerationFormat, LinkItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// "Nano Banana Pro 2" mapping
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const REASONING_MODEL = 'gemini-3-pro-preview';

export const analyzeExternalLink = async (url: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `I have this URL for a furniture piece or design element: ${url}. 
      Please search for it, find its dimensions, style, color, and key characteristics. 
      Summarize this in a concise visual description I can use for an image generation prompt.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let groundText = "";
    if (grounding) {
        groundText = " (Verified via Google Search)";
    }
    
    return (response.text || "Could not analyze link.") + groundText;
  } catch (error) {
    console.error("Link analysis failed:", error);
    return "A modern furniture piece found online.";
  }
};

export const generateDesignAdvice = async (
  conversationHistory: { role: string; text: string }[],
  currentImage?: string | null
): Promise<string> => {
  try {
    const parts: any[] = [];
    
    if (currentImage) {
      parts.push({
        inlineData: {
          data: currentImage.split(',')[1],
          mimeType: 'image/jpeg' 
        }
      });
    }

    // Pass last few messages for context
    const recentContext = conversationHistory.slice(-5);
    recentContext.forEach(msg => {
        parts.push({ text: `${msg.role === 'user' ? 'Client' : 'Aura'}: ${msg.text}` });
    });

    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: { parts },
      config: {
        systemInstruction: `You are Aura, an elite Design Intelligence.
        
        TONE & FORMATTING:
        1. Professional, concise, visionary. 
        2. Use **Bold** for mini-headers.
        3. Use *Italics* for emphasis.
        4. Keep responses short (max 3-4 sentences).

        GOAL:
        Help the user refine their vision. If they talk about budget, suggest cost-effective changes.
        `,
      }
    });

    return response.text || "Analyzing spatial potential...";
  } catch (error) {
    console.error("Chat error:", error);
    return "I am currently recalibrating my design sensors. Please try again.";
  }
};

export const generateReportText = async (
    baseImage: string,
    generatedImage: string,
    mode: string,
    budget: string,
    location: string,
    prompt: string
): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: {
                parts: [
                    { text: `I have transformed a room. 
                      Mode: ${mode}
                      Budget Constraint: ${budget}
                      Location: ${location || "Global/Universal"}
                      Prompt: ${prompt}
                      
                      Write a "Design Strategy Blueprint" for the client.
                      Include:
                      1. **The Vision**: Psychological shift of the new design.
                      2. **Execution Plan**: What changed (flooring, lighting, etc).
                      3. **Item List**: Generic list of 3-5 key items suitable for this budget.
                      
                      Format with HTML tags <h3>, <p>, <ul>, <li>.` 
                    },
                    { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/jpeg' } },
                    { inlineData: { data: generatedImage.split(',')[1], mimeType: 'image/jpeg' } }
                ]
            }
        });
        return response.text || "<p>Report generation unavailable.</p>";
    } catch (e) {
        return "<p>Could not generate report text.</p>";
    }
}

export const generateRoomViz = async (
  baseImage: string,
  mode: DesignMode,
  userPrompt: string,
  referenceImages: ReferenceImage[] = [],
  budgetDescription: string,
  location: string = "",
  externalItems: LinkItem[] = [],
  format: GenerationFormat = 'single',
  chatContext: string[] = [],
  structureLocked: boolean = true
): Promise<string | null> => {
  try {
    let promptText = "";
    
    // STRICT ASPECT RATIO ENFORCEMENT
    const styleSuffix = " Photorealistic, Architectural Digest style, 8k resolution, volumetric lighting. IMPERATIVE: The output image MUST have a 16:9 aspect ratio. ";
    
    // 1. FORMAT INSTRUCTIONS
    let formatInstruction = "";
    if (format === 'grid_angles') {
        formatInstruction = " OUTPUT FORMAT: Create a 2x2 grid collage. All 4 individual panels must be 16:9 cinematic aspect ratio. Show the room from different angles. ";
    } else if (format === 'grid_variants') {
        formatInstruction = " OUTPUT FORMAT: Create a 2x2 grid collage. All 4 individual panels must be 16:9 cinematic aspect ratio. Show 4 completely different design options. ";
    } else {
        formatInstruction = " OUTPUT FORMAT: Single high-quality 16:9 wide-angle shot. ";
    }

    // 2. BUDGET LOGIC - Parse the specific string
    let budgetInstruction = "";
    if (budgetDescription.includes("$0")) {
        budgetInstruction = " CONSTRAINT: STRICT ZERO BUDGET ($0). ABSOLUTELY NO NEW FURNITURE. Reuse existing items only. Rearrange, declutter, and clean only. Do not add anything that costs money. ";
    } else if (budgetDescription.includes("$200") || budgetDescription.includes("$500")) {
        budgetInstruction = ` CONSTRAINT: LOW BUDGET (${budgetDescription}). Focus on cost-effective updates: Paint, small plants, textiles, and inexpensive accessories. No new large furniture. `;
    } else if (budgetDescription.includes("$1,000") || budgetDescription.includes("$5,000")) {
        budgetInstruction = ` CONSTRAINT: MODERATE BUDGET (${budgetDescription}). You may replace key outdated pieces (rugs, coffee table, lighting) with standard retail items. Keep the most expensive furniture (sofa/bed) unless it ruins the design. `;
    } else if (budgetDescription.includes("Unlimited")) {
        budgetInstruction = " CONSTRAINT: UNLIMITED BUDGET. No financial constraints. Use the finest materials and design pieces. Dream big. ";
    } else {
        // High budget ($10k+)
        budgetInstruction = ` CONSTRAINT: HIGH BUDGET (${budgetDescription}). High-end renovation. New designer furniture, luxury lighting, premium materials. `;
    }

    // 3. STRUCTURAL INTEGRITY LOGIC
    const STRICT_LOCK = " CRITICAL: ARCHITECTURAL LOCK IS ACTIVE. You MUST preserve the exact perspective, room size, window placement, door placement, and ceiling height of the original image. Do not hallucinate a new room shape. Do not remove pillars or beams. ";

    switch (mode) {
      case DesignMode.CLEAN:
        promptText = "TASK: DEEP CLEAN & DECLUTTER. " + STRICT_LOCK + " STRICTLY KEEP ALL FURNITURE (sofas, tables, beds, cabinets) in their EXACT current positions. DO NOT MOVE THEM. ONLY remove trash, clothes, paper, and clutter. Make surfaces spotless and minimal.";
        break;
      case DesignMode.CHRISTMAS:
        promptText = "TASK: SEASONAL DECOR. " + STRICT_LOCK + " STRICTLY KEEP ALL FURNITURE in their EXACT current positions. Add sophisticated holiday decorations: garland, lights, tree. The room structure and furniture layout must match the input image exactly.";
        break;
      case DesignMode.STYLE_TRANSFER:
        promptText = "TASK: STYLE TRANSFER. " + STRICT_LOCK + " RETAIN THE CURRENT FURNITURE LAYOUT. Apply the visual style/texture/colors of the reference images to the existing items. e.g. Turn the existing fabric sofa into a leather sofa, but do not move it.";
        break;
      case DesignMode.REDESIGN:
      default:
        promptText = "TASK: INTERIOR REDESIGN. ";
        if (structureLocked) {
            promptText += STRICT_LOCK + " You may replace furniture and lighting to match the user's vision. However, KEEP the room's architectural footprint exactly as is. ";
        } else {
            promptText += " CREATIVE FREEDOM: You may change the walls, windows, and structure if necessary to achieve the design vision. This is a renovation. ";
        }
        break;
    }

    // 4. COMBINE INPUTS
    promptText += " " + budgetInstruction;
    promptText += formatInstruction;
    promptText += styleSuffix;

    if (location) {
        promptText += ` \n\nLOCATION CONTEXT: The home is located in ${location}. Ensure lighting and materials reflect this local environment/climate. `;
    }

    // Chat Context Injection
    if (chatContext.length > 0) {
        promptText += ` \n\nIMPORTANT CONTEXT FROM USER CHAT: ${chatContext.join(' ')}`;
    }

    // Element References (Image Based)
    const elementRefs = referenceImages.filter(r => r.type === 'element');
    if (elementRefs.length > 0) {
        promptText += " \n\nREQUIRED FURNITURE FROM IMAGES: Integrate the specific furniture items provided in the reference images into the room naturalistically. Match the reference items exactly.";
    }
    
    // External Links (Text Based Analysis)
    if (externalItems.length > 0) {
      promptText += ` \n\nREQUIRED REALITY ANCHORS (Retail Items): Integrate these specific items based on their description: `;
      externalItems.forEach((item, idx) => {
          promptText += `\n ${idx + 1}. ${item.analysis}`;
      });
    }

    if (userPrompt) {
      promptText += ` \n\nUSER DIRECTIVE: ${userPrompt}`;
    }

    const parts: any[] = [
      { text: promptText },
      {
        inlineData: {
          data: baseImage.split(',')[1],
          mimeType: 'image/jpeg' 
        }
      }
    ];

    // Add references (Limit 8)
    referenceImages.slice(0, 8).forEach(img => {
      parts.push({
        inlineData: {
          data: img.url.split(',')[1],
          mimeType: 'image/jpeg'
        }
      });
    });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    return null;

  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};
