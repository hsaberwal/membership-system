export default function getCroppedImg(imageSrc: string, pixelCrop: any, size: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) return reject("Canvas context not found");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
      );

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
        } else {
          reject("Failed to create blob");
        }
      }, "image/jpeg");
    };

    image.onerror = () => reject("Failed to load image");
  });
}

