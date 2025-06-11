import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "../utils/getCroppedImg";


interface Props {
  imageSrc?: string;
  onCropComplete: (dataUrl: string) => void;
  onCapture?: (dataUrl: string) => void;
  isCropping?: boolean;
}

const PhotoCaptureAndCrop: React.FC<Props> = ({ imageSrc, onCropComplete, onCapture, isCropping = false }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [showCropButton, setShowCropButton] = useState(false);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        onCapture?.(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropCompleteInternal = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
    setShowCropButton(true);
  }, []);

  const showCroppedImage = useCallback(async () => {
    if (!(image || imageSrc) || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(image || imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      setShowCropButton(false);
    } catch (e) {
      console.error(e);
    }
  }, [image, imageSrc, croppedAreaPixels, onCropComplete]);

  useEffect(() => {
    const cropArea = document.querySelector('.reactEasyCrop_CropArea');
    if (cropArea) {
      const handler = () => showCroppedImage();
      cropArea.addEventListener('dblclick', handler);
      return () => cropArea.removeEventListener('dblclick', handler);
    }
  }, [showCroppedImage]);

  return (
    <div className="w-full">
      {!isCropping && (
        <input type="file" accept="image/*" onChange={handleCapture} className="mb-4" />
      )}
      {isCropping && (image || imageSrc) && (
        <div className="relative w-full h-[400px] bg-gray-900">
          <Cropper
            image={image || imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteInternal}
          />
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-1/2"
            />
            {showCropButton && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={showCroppedImage}
              >
                Crop & Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoCaptureAndCrop;

