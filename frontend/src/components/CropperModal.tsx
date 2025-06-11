import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/getCroppedImg';

interface CropperModalProps {
  image: string;
  onCrop: (file: File) => void;
  onClose: () => void;
}

export const CropperModal: React.FC<CropperModalProps> = ({ image, onCrop, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const onCropComplete = useCallback((_: any, croppedArea: any) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) {
      console.warn('Crop area not set yet.');
      return;
    }
    try {
      console.log('Cropping image...');
      const croppedFile = await getCroppedImg(image, croppedAreaPixels);
      setConfirmationMessage('Image cropped and saved!');
      onCrop(croppedFile);
    } catch (e) {
      console.error('Cropping failed:', e);
      setConfirmationMessage('Failed to crop image.');
    }
  };

  const handleDoubleClick = async () => {
    await handleDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center overflow-auto p-4">
      <div className="bg-white rounded shadow-lg w-full max-w-4xl flex flex-col gap-4 p-4">
        <p className="text-center text-gray-700 font-semibold">
          Adjust the area to crop. <span className="text-blue-600">Double-click inside the image to confirm.</span>
        </p>

        {!imageLoaded && (
          <div className="text-center text-gray-500">Loading image...</div>
        )}

        {confirmationMessage && (
          <div className="text-center text-green-600 font-medium">{confirmationMessage}</div>
        )}

        <div
          className="relative w-full h-[400px] bg-gray-100 cursor-crosshair"
          onDoubleClick={handleDoubleClick}
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={() => setImageLoaded(true)}
            style={{
              containerStyle: { borderRadius: '0.5rem' },
              cropAreaStyle: {
                border: '2px solid #3b82f6',
                borderRadius: '4px',
              },
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="zoom" className="text-sm font-medium text-gray-700">Zoom</label>
            <input
              type="range"
              id="zoom"
              name="zoom"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-64"
            />
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button
              onClick={handleDone}
              className="btn btn-primary"
              disabled={!imageLoaded || !croppedAreaPixels}
            >
              Crop & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
