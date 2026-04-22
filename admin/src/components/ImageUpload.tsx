import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadCloud, X, Loader2, GripVertical, Star } from 'lucide-react';
import { api } from '../api/axios';

export interface ImageItem {
  id: string; // Used for unique dnd-kit identifying (can be publicId or random string if local processing)
  url: string;
  publicId: string;
  isPrimary: boolean;
}

interface ImageUploadProps {
  value: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxFiles?: number;
}

// Sub-component for the sortable items
const SortableImage = ({
  item,
  onRemove,
  onSetPrimary
}: {
  item: ImageItem,
  onRemove: (id: string) => void,
  onSetPrimary: (id: string) => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-xl border bg-white overflow-hidden shadow-sm group ${isDragging ? 'ring-2 ring-blue-500 opacity-80' : 'border-slate-200'
        } ${item.isPrimary ? 'ring-2 ring-emerald-500' : ''}`}
    >
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 bg-white/90 backdrop-blur-sm shadow-sm text-slate-500 rounded-md cursor-grab active:cursor-grabbing hover:text-slate-800 transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-1.5 bg-red-500/90 hover:bg-red-600 backdrop-blur-sm shadow-sm text-white rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="aspect-square w-full">
        <img
          src={item.url}
          alt="Product Upload"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="primary_image"
            checked={item.isPrimary}
            onChange={() => onSetPrimary(item.id)}
            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <span className={`text-sm font-medium ${item.isPrimary ? 'text-emerald-700' : 'text-slate-600'}`}>
            {item.isPrimary ? 'Primary Image' : 'Set Primary'}
          </span>
        </label>
        {item.isPrimary && <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />}
      </div>
    </div>
  );
};

export const ImageUpload: React.FC<ImageUploadProps> = ({ value = [], onChange, maxFiles = 4 }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(
    usePointerSensor(),
    useKeyboardSensor()
  );

  // Custom sensors to allow clicking buttons (like delete or radio) without triggering drag
  function usePointerSensor() {
    return useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    });
  }

  function useKeyboardSensor() {
    return useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    });
  }

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (value.length + files.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} images.`);
      return;
    }

    // Client side validation
    const validFiles = files.filter(file => {
      const isCorrectFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isUnder5MB = file.size <= 5 * 1024 * 1024;
      return isCorrectFormat && isUnder5MB;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Please use JPEG/PNG/WEBP under 5MB.');
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newImages = response.data.images.map((img: any) => ({
        id: img.publicId, // Using publicId as unique dnd id
        publicId: img.publicId,
        url: img.url,
        isPrimary: value.length === 0, // Make primary if it's the first image ever uploaded
      }));

      // If there are multiple new images and no previous values, making the VERY first one primary
      if (value.length === 0 && newImages.length > 0) {
        newImages.forEach((img: any, idx: number) => { img.isPrimary = idx === 0; });
      }

      onChange([...value, ...newImages]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload images.');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemove = async (id: string) => {
    const itemToRemove = value.find(item => item.id === id);
    if (!itemToRemove) return;

    // Optimistically remove from UI
    const newItems = value.filter(item => item.id !== id);

    // Auto-assign new primary if the removed one was primary
    if (itemToRemove.isPrimary && newItems.length > 0) {
      newItems[0].isPrimary = true;
    }

    onChange(newItems);

    try {
      await api.delete('/api/upload', { data: { publicId: itemToRemove.publicId } });
    } catch (err) {
      console.error('Failed to delete image from Cloudinary', err);
    }
  };

  const handleSetPrimary = (id: string) => {
    const newItems = value.map(item => ({
      ...item,
      isPrimary: item.id === id
    }));
    onChange(newItems);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex(item => item.id === active.id);
      const newIndex = value.findIndex(item => item.id === over.id);

      onChange(arrayMove(value, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Upload Dropzone */}
      {value.length < maxFiles && (
        <label className={`
          flex flex-col items-center justify-center w-full h-40 
          border-2 border-dashed rounded-xl cursor-pointer
          transition-colors duration-200
          ${isUploading ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-300 hover:border-blue-400'}
        `}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-600">Uploading images...</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <p className="mb-2 text-sm text-slate-600 font-medium">
                  <span className="text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  PNG, JPG or WEBP (MAX. 5MB)
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-2">
                  {value.length} / {maxFiles} files uploaded
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileScan}
            disabled={isUploading}
          />
        </label>
      )}

      {/* Sortable Grid */}
      {value.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={value.map(v => v.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {value.map((item) => (
                <SortableImage
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  onSetPrimary={handleSetPrimary}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
