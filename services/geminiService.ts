
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult, Story } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Recognizes a landmark with a strict certainty requirement.
 */
export async function recognizePlace(base64Image: string): Promise<RecognitionResult> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: `Act as a precision NYC spatial analyzer. Identify the landmark in this image.
            
            STRICT RULES:
            1. DO NOT GUESS. If the image is blurry, too dark, or shows a generic building without identifiable features, set 'place' to null.
            2. Only return a name if you are at least 90% certain. 
            3. Provide a 'confidence' score between 0.0 and 1.0.
            
            Return a JSON object with:
            - place: { name, category, description, yearBuilt, rating, confidence } or null
            - stories: array of 3 objects { type, title, content, icon } or empty array
            - reasoning: Brief internal note on identification certainty.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            place: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                yearBuilt: { type: Type.STRING },
                rating: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
              },
              required: ["name", "category", "description", "rating", "confidence"]
            },
            stories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ["type", "title", "content", "icon"]
              }
            },
            reasoning: { type: Type.STRING }
          }
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    // Filter out low confidence results (under 0.85) to prevent wrong guesses
    if (!result.place || (result.place.confidence && result.place.confidence < 0.85)) {
      return { place: null, stories: [], reasoning: result.reasoning || "Insufficient certainty" };
    }

    return {
      place: { ...result.place, id: Math.random().toString(36).substr(2, 9) },
      stories: result.stories.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }))
    };
  } catch (error) {
    console.error("Recognition error:", error);
    return { place: null, stories: [] };
  }
}

/**
 * Generates audio narration for a landmark description.
 */
export async function getAudioGuide(text: string): Promise<Uint8Array | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Narrate this like a cinematic tour guide: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeBase64(base64Audio);
    }
    return null;
  } catch (err) {
    console.error("TTS Error:", err);
    return null;
  }
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function askLandmarkExpert(question: string, landmark: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert NYC historian. Answer this question about ${landmark}: ${question}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "I'm sorry, I couldn't find specific details on that.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const urls = chunks
        .map((chunk: any) => chunk.web?.uri)
        .filter((uri: any) => !!uri);
      
      if (urls.length > 0) {
        const uniqueUrls = Array.from(new Set(urls));
        text += "\n\nSources:\n" + uniqueUrls.map(url => `- ${url}`).join("\n");
      }
    }
    return text;
  } catch (err) {
    return "The local sensor network is experiencing interference. Try again shortly.";
  }
}
