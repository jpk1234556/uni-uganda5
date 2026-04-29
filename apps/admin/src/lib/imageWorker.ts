self.onmessage = async (e) => {
  const { id, file } = e.data;
  
  try {
    const bitmap = await createImageBitmap(file);
    
    const maxDimension = 1280;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width || 1, bitmap.height || 1),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      throw new Error("Could not get 2d context from OffscreenCanvas");
    }
    
    ctx.drawImage(bitmap, 0, 0, width, height);
    
    // Convert to JPEG blob at 82% quality
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.82 });
    
    self.postMessage({ id, success: true, blob });
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err.message });
  }
};

export {};
