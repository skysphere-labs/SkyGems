/**
 * Provider Abstraction Layer
 * 
 * Unified interface for all image generation providers
 * Normalizes responses across different APIs
 */

export type Provider = 'openai' | 'stability' | 'flux' | 'ideogram';

export interface GenerateImageInput {
  prompt: string;
  provider: Provider;
  quality?: 'low' | 'medium' | 'high';
  variants?: number;
  seed?: number;
  size?: string;
}

export interface NormalizedResponse {
  provider: Provider;
  images: string[]; // Base64 or URL
  latency: number; // ms
  costEstimate: number; // USD
  metadata: {
    model: string;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * OpenAI DALL-E Provider
 */
async function generateWithOpenAI(input: GenerateImageInput): Promise<NormalizedResponse> {
  const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY not set');
  }

  const startTime = Date.now();

  try {
    // Mock implementation (replace with real API call)
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: input.prompt,
        n: input.variants || 1,
        size: input.size || '1024x1024',
        quality: input.quality === 'high' ? 'hd' : 'standard',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      provider: 'openai',
      images: data.data.map((item: any) => item.url),
      latency,
      costEstimate: 0.04 * (input.variants || 1),
      metadata: {
        model: 'dall-e-3',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('OpenAI generation failed:', error);
    throw error;
  }
}

/**
 * Stability AI Provider
 */
async function generateWithStability(input: GenerateImageInput): Promise<NormalizedResponse> {
  const apiKey = (import.meta as any).env.VITE_STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_STABILITY_API_KEY not set');
  }

  const startTime = Date.now();

  try {
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: input.prompt }],
          steps: input.quality === 'high' ? 50 : 30,
          samples: input.variants || 1,
          seed: input.seed,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Stability API error: ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      provider: 'stability',
      images: data.artifacts.map((artifact: any) => `data:image/png;base64,${artifact.base64}`),
      latency,
      costEstimate: 0.03 * (input.variants || 1),
      metadata: {
        model: 'stable-diffusion-xl',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Stability generation failed:', error);
    throw error;
  }
}

/**
 * Main provider interface
 */
export async function generateImage(input: GenerateImageInput): Promise<NormalizedResponse> {
  switch (input.provider) {
    case 'openai':
      return generateWithOpenAI(input);
    case 'stability':
      return generateWithStability(input);
    default:
      throw new Error(`Unsupported provider: ${input.provider}`);
  }
}

/**
 * Mock generator for development (no API keys required)
 */
export async function generateImageMock(input: GenerateImageInput): Promise<NormalizedResponse> {
  const latency = 800 + Math.random() * 1200;

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, latency));

  const imageUrl = `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(
    input.prompt.substring(0, 30)
  )}`;

  return {
    provider: input.provider,
    images: Array(input.variants || 1).fill(imageUrl),
    latency: Math.round(latency),
    costEstimate: input.provider === 'openai' ? 0.04 : 0.03,
    metadata: {
      model: input.provider === 'openai' ? 'dall-e-3' : 'stable-diffusion-xl',
      timestamp: new Date().toISOString(),
      requestId: `mock-${Date.now()}`,
    },
  };
}
