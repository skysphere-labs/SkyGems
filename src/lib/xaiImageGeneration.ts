/**
 * xAI Image Generation — wrapper for the jewelry variations page
 *
 * Uses the Vite proxy at /api/xai to avoid CORS.
 * Model: grok-imagine-image-pro
 */

const XAI_API_URL = '/api/xai/v1/images/generations';

interface XaiImageResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_XAI_API_KEY;
  if (!key || key === 'your-xai-api-key-here') {
    throw new Error('xAI API key not configured. Set VITE_XAI_API_KEY in your .env file.');
  }
  return key;
}

/**
 * Generate a single image from a prompt via xAI.
 */
export async function generateXaiImage(prompt: string): Promise<string> {
  const apiKey = getApiKey();

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
    throw new Error(`xAI API error (${response.status}): ${errorBody}`);
  }

  const data: XaiImageResponse = await response.json();

  if (!data.data?.[0]) {
    throw new Error('xAI returned no image data');
  }

  if (data.data[0].url) return data.data[0].url;
  if (data.data[0].b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;

  throw new Error('xAI response missing both url and b64_json');
}

export interface VariationResult {
  axis: string;
  label: string;
  description: string;
  prompt: string;
  imageUrl: string | null;
  error: string | null;
  status: 'loading' | 'success' | 'error';
}

/**
 * Generate all 4 variation images in parallel.
 * Returns results as they resolve so the UI can update incrementally.
 */
export async function generateAllVariations(
  variations: Array<{ axis: string; label: string; description: string; prompt: string }>,
  onUpdate: (index: number, result: VariationResult) => void
): Promise<void> {
  const promises = variations.map(async (variation, index) => {
    try {
      const imageUrl = await generateXaiImage(variation.prompt);

      // Auto-save to generated-designs/ folder
      saveVariationToDisk(imageUrl, variation.label, index).catch(() => {});

      onUpdate(index, {
        ...variation,
        imageUrl,
        error: null,
        status: 'success',
      });
    } catch (err) {
      onUpdate(index, {
        ...variation,
        imageUrl: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
      });
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Save a variation image to the generated-designs/ folder via Vite plugin.
 */
async function saveVariationToDisk(imageUrl: string, label: string, index: number): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const slug = label.toLowerCase().replace(/\s+/g, '-');
  const filename = `variation-${slug}-${timestamp}-${index + 1}.png`;

  try {
    const response = await fetch('/api/save-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, filename }),
    });
    if (response.ok) {
      const result = await response.json();
      console.log(`[VariationSaver] Saved: ${result.path}`);
    }
  } catch (err) {
    console.error(`[VariationSaver] Failed to save ${filename}:`, err);
  }
}
