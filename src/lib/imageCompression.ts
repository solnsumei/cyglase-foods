export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1, default 0.8
  mimeType?: "image/webp" | "image/jpeg";
}

/**
 * Resizes and compresses an image in the browser using HTML5 Canvas.
 * Reduces raw 5MB-10MB phone camera photos down to ~100KB-250KB in modern WebP.
 * Preserves aspect ratio, reduces Supabase storage footprint by 90-95%,
 * and makes uploads blazing fast on mobile networks.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    mimeType = "image/webp",
  } = options;

  // Don't process non-images (e.g. PDFs)
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // If running in a non-browser environment (SSR)
  if (typeof window === "undefined" || !window.document) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Maintain aspect ratio while bounding within max dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file); // Fallback to original
        }

        // Apply smooth high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Blob in target format (WebP or JPEG)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // If compressed blob is somehow larger than original, keep original
            if (blob.size >= file.size) {
              return resolve(file);
            }

            const ext = mimeType === "image/webp" ? "webp" : "jpg";
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const compressedFile = new File(
              [blob],
              `${baseName}.${ext}`,
              {
                type: mimeType,
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
