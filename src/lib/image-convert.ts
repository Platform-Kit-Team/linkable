/**
 * Convert any browser-supported image file to JPEG at `quality` (0–1).
 * Returns a new File with the given `targetName` (should end in .jpg).
 */
export const convertToJpeg = (
  file: File,
  targetName: string,
  quality = 0.9,
): Promise<File> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas 2d context"));
          return;
        }

        // White background so transparent PNGs don't get a black bg
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob returned null"));
              return;
            }
            resolve(new File([blob], targetName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality,
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };

    img.src = url;
  });
