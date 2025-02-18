import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import getCroppedImg from "../lib/cropImage";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  minWidth?: number;
  minHeight?: number;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  minWidth = 100,
  minHeight = 100,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteHandler = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropConfirm = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const img = new Image();
      img.src = URL.createObjectURL(croppedBlob);
      img.onload = () => {
        if (img.width < minWidth || img.height < minHeight) {
          alert(`Пожалуйста, выберите область минимум ${minWidth}x${minHeight}px`);
          return;
        }
        const croppedFile = new File([croppedBlob], "cropped.jpeg", {
          type: "image/jpeg",
        });
        onCropComplete(croppedFile);
      };
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative w-full max-w-md bg-[#151923] p-4 rounded">
        <div className="relative w-full h-64 bg-[#151923]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteHandler}
          />
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={handleCropConfirm}>Обрезать</Button>
        </div>
      </div>
    </div>
  );
}
