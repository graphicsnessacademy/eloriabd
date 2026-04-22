import React, { useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { api } from '../api/axios';

export interface ImageItem {
  publicId: string;
  url: string;
}

interface Props {
  value: ImageItem[];
  onChange: (value: ImageItem[]) => void;
  maxFiles?: number;
}

export const ReviewImageUpload = ({ value, onChange, maxFiles = 3 }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => formData.append('images', file));

    try {
      const res = await api.post('/api/upload', formData);
      // Map back to the expected structure
      onChange([...value, ...res.data]);
    } catch (err) {
      alert("Image upload failed. Please ensure file is under 5MB.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    onChange(value.filter(img => img.url !== url));
  };

  return (
    <div className="flex flex-wrap gap-3">
      {value.map((img) => (
        <div key={img.url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          <img src={img.url} className="w-full h-full object-cover" alt="Review" />
          <button 
            type="button"
            onClick={() => removeImage(img.url)}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      ))}

      {value.length < maxFiles && (
        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#534AB7] hover:bg-indigo-50/30 transition-all">
          {uploading ? <Loader2 className="animate-spin text-gray-400" /> : <Camera size={20} className="text-gray-400" />}
          <span className="text-[8px] font-bold uppercase mt-1 text-gray-400">Add Photo</span>
          <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
        </label>
      )}
    </div>
  );
};