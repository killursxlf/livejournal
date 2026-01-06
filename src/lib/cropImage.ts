export default function getCroppedImg(imageSrc: string, croppedAreaPixels: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d");
  
        if (!ctx) {
          return reject(new Error("Canvas Context не найден"));
        }
  
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
  
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Ошибка при получении обрезанного изображения"));
          }
        }, "image/jpeg");
      };
      image.onerror = () => {
        reject(new Error("Ошибка загрузки изображения"));
      };
    });
  }
  