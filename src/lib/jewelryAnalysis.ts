/**
 * Jewelry Analysis — Vision API call + attribute extraction
 *
 * Tries Anthropic Claude first, falls back to xAI Grok if Anthropic key is not set.
 * Both APIs return structured jewelry attributes as JSON.
 */

const ANTHROPIC_API_URL = '/api/anthropic/v1/messages';
const XAI_CHAT_URL = '/api/xai/v1/chat/completions';

export interface JewelryAttributes {
  piece_type: string;
  style_era: string;
  silhouette_form: string;
  materials: string[];
  gemstones: string[];
  finish_texture: string[];
  motifs: string[];
  mood: string;
}

const SYSTEM_PROMPT = `You are a jewelry design analyst. Return ONLY a raw JSON object — no markdown, no preamble — with these fields:
{
  "piece_type": "",
  "style_era": "",
  "silhouette_form": "",
  "materials": [],
  "gemstones": [],
  "finish_texture": [],
  "motifs": [],
  "mood": ""
}`;

// ── Helpers ──

function isAnthropicConfigured(): boolean {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return !!key && key !== 'your-anthropic-api-key-here';
}

function getAnthropicKey(): string {
  return import.meta.env.VITE_ANTHROPIC_API_KEY;
}

function getXaiKey(): string {
  const key = import.meta.env.VITE_XAI_API_KEY;
  if (!key || key === 'your-xai-api-key-here') {
    throw new Error('No API key configured. Set VITE_XAI_API_KEY or VITE_ANTHROPIC_API_KEY in your .env file.');
  }
  return key;
}

async function urlToBase64(url: string): Promise<{ data: string; mediaType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mediaType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      resolve({ data, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function parseJsonResponse(text: string): JewelryAttributes {
  let jsonStr = text.trim();
  // Strip markdown code fences
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(jsonStr);
}

// ── Anthropic (Claude Vision) ──

async function analyzeWithAnthropic(
  base64Data: string,
  mediaType: string
): Promise<JewelryAttributes> {
  console.log('[Claude Vision] Analyzing jewelry image...');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getAnthropicKey(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Analyze this jewelry image and extract its design attributes.' },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude Vision API error (${response.status}): ${errorBody}`);
  }

  interface AnthropicResponse {
    content: Array<{ type: string; text?: string }>;
  }

  const data: AnthropicResponse = await response.json();
  const textContent = data.content.find((c) => c.type === 'text');
  if (!textContent?.text) throw new Error('Claude Vision returned no text content');

  return parseJsonResponse(textContent.text);
}

// ── xAI (Grok Vision) ──

async function analyzeWithXai(
  base64Data: string,
  mediaType: string
): Promise<JewelryAttributes> {
  console.log('[xAI Vision] Analyzing jewelry image...');

  const dataUrl = `data:${mediaType};base64,${base64Data}`;

  const response = await fetch(XAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getXaiKey()}`,
    },
    body: JSON.stringify({
      model: 'grok-3',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: 'Analyze this jewelry image and extract its design attributes.' },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`xAI Vision API error (${response.status}): ${errorBody}`);
  }

  interface XaiChatResponse {
    choices: Array<{ message: { content: string } }>;
  }

  const data: XaiChatResponse = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('xAI Vision returned no content');

  return parseJsonResponse(content);
}

// ── Public API ──

/**
 * Analyze a jewelry image using the best available vision API.
 * Tries Anthropic Claude first, falls back to xAI Grok.
 */
export async function analyzeJewelryImage(
  imageInput: { type: 'base64'; data: string; mediaType: string } | { type: 'url'; url: string }
): Promise<JewelryAttributes> {
  // Ensure we have base64 data
  let base64Data: string;
  let mediaType: string;

  if (imageInput.type === 'base64') {
    base64Data = imageInput.data;
    mediaType = imageInput.mediaType;
  } else {
    const converted = await urlToBase64(imageInput.url);
    base64Data = converted.data;
    mediaType = converted.mediaType;
  }

  // Try Anthropic first, fall back to xAI
  if (isAnthropicConfigured()) {
    console.log('[Analysis] Using Anthropic Claude Vision');
    const result = await analyzeWithAnthropic(base64Data, mediaType);
    console.log('[Analysis] Extracted attributes:', result);
    return result;
  }

  console.log('[Analysis] Anthropic not configured, using xAI Grok Vision');
  const result = await analyzeWithXai(base64Data, mediaType);
  console.log('[Analysis] Extracted attributes:', result);
  return result;
}

/**
 * Returns which vision provider will be used.
 */
export function getVisionProvider(): 'anthropic' | 'xai' {
  return isAnthropicConfigured() ? 'anthropic' : 'xai';
}
