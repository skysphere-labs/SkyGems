/**
 * Design Saver Service
 *
 * Saves generated design images to the local `generated-designs/` folder
 * via the Vite dev server plugin endpoint.
 */

export async function saveDesignToDisk(
  imageUrl: string,
  designId: string,
  index: number
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `design-${timestamp}-${index + 1}.png`;

  try {
    const response = await fetch('/api/save-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, filename }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[DesignSaver] Failed to save ${filename}:`, error);
      return;
    }

    const result = await response.json();
    console.log(`[DesignSaver] Saved: ${result.path}`);
  } catch (err) {
    console.error(`[DesignSaver] Error saving ${filename}:`, err);
  }
}

/**
 * Save all generated designs to disk in parallel.
 */
export async function saveAllDesignsToDisk(
  designs: Array<{ id: string; imageUrl: string }>
): Promise<void> {
  console.log(`[DesignSaver] Saving ${designs.length} designs to generated-designs/...`);

  await Promise.allSettled(
    designs.map((design, i) => saveDesignToDisk(design.imageUrl, design.id, i))
  );

  console.log(`[DesignSaver] All designs saved.`);
}
