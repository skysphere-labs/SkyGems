/**
 * xAI (Grok) Image Generation Service
 *
 * Uses the xAI API to generate jewelry design images.
 * API key is read from VITE_XAI_API_KEY environment variable.
 * Calls go through Vite proxy (/api/xai) to avoid CORS issues.
 *
 * Docs: https://docs.x.ai/docs/guides/image-generation
 */

// Use Vite proxy to bypass CORS
const XAI_API_URL = '/api/xai/v1/images/generations';

function getApiKey(): string {
  const key = import.meta.env.VITE_XAI_API_KEY;
  if (!key || key === 'your-xai-api-key-here') {
    throw new Error('xAI API key not configured. Set VITE_XAI_API_KEY in your .env file.');
  }
  return key;
}

export function isXaiConfigured(): boolean {
  const key = import.meta.env.VITE_XAI_API_KEY;
  return !!key && key !== 'your-xai-api-key-here';
}

interface XaiImageResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

/**
 * Generate a single jewelry design image using xAI.
 * Returns a data URL (base64) for the generated image.
 */
export async function generateImage(prompt: string): Promise<string> {
  const apiKey = getApiKey();

  console.log('[xAI] Generating image...', prompt.substring(0, 80) + '...');

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-imagine-image-pro',
      prompt,
      n: 1,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[xAI] API error:', response.status, errorBody);
    throw new Error(`xAI API error (${response.status}): ${errorBody}`);
  }

  const data: XaiImageResponse = await response.json();
  console.log('[xAI] Response received, data items:', data.data?.length);

  if (!data.data?.[0]) {
    throw new Error('xAI returned no image data');
  }

  // Return URL if available
  if (data.data[0].url) {
    console.log('[xAI] Got image URL');
    return data.data[0].url;
  }

  // Fallback to base64
  if (data.data[0].b64_json) {
    console.log('[xAI] Got base64 image');
    return `data:image/png;base64,${data.data[0].b64_json}`;
  }

  throw new Error('xAI response missing both url and b64_json');
}

/**
 * Generate multiple jewelry design images in parallel.
 * Falls back to placeholder if xAI is not configured.
 */
export async function generateDesignImages(
  prompts: string[]
): Promise<string[]> {
  if (!isXaiConfigured()) {
    console.warn('[xAI] API key not configured, using placeholders');
    return prompts.map(
      (_, i) => `https://via.placeholder.com/400?text=Design+${i + 1}`
    );
  }

  const results = await Promise.allSettled(
    prompts.map((prompt) => generateImage(prompt))
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error(`[xAI] Failed to generate image ${i + 1}:`, result.reason);
    return `https://via.placeholder.com/400?text=Generation+Failed`;
  });
}
