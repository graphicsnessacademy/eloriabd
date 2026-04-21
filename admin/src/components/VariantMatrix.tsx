import React, { useState } from 'react';
import { Plus, Info } from 'lucide-react';

export type VariantItem = {
  size: string;
  color: string;
  stock: number;
};

interface VariantMatrixProps {
  sizes: string[];
  colors: string[];
  variants: VariantItem[];
  onChangeSizes: (sizes: string[]) => void;
  onChangeColors: (colors: string[]) => void;
  onVariantsChange: (variants: VariantItem[]) => void;
}

export const VariantMatrix: React.FC<VariantMatrixProps> = ({
  sizes,
  colors,
  variants,
  onChangeSizes,
  onChangeColors,
  onVariantsChange,
}) => {
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const handleAddSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSize.trim() || sizes.includes(newSize.trim())) return;
    onChangeSizes([...sizes, newSize.trim()]);
    setNewSize('');
  };

  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColor.trim() || colors.includes(newColor.trim())) return;
    onChangeColors([...colors, newColor.trim()]);
    setNewColor('');
  };

  const getStock = (size: string, color: string): number | '' => {
    const variant = variants.find(v => v.size === size && v.color === color);
    return variant ? variant.stock : '';
  };

  const handleStockChange = (size: string, color: string, valueStr: string) => {
    const value = parseInt(valueStr, 10);
    const existingIndex = variants.findIndex(v => v.size === size && v.color === color);
    const newVariants = [...variants];

    if (Number.isNaN(value) || valueStr === '') {
      // If cleared, optionally remove the variant entirely from array or set to 0
      if (existingIndex >= 0) {
        newVariants.splice(existingIndex, 1);
        onVariantsChange(newVariants);
      }
      return;
    }

    if (existingIndex >= 0) {
      newVariants[existingIndex].stock = value;
    } else {
      newVariants.push({ size, color, stock: value });
    }

    onVariantsChange(newVariants);
  };

  const totalSKUs = sizes.length * colors.length;
  const inStockVariants = variants.filter(v => v.stock > 0).length;
  // Variants explicitly set to 0 or unconfigured combinations
  const outOfStockCount = totalSKUs - inStockVariants;

  if (sizes.length === 0 && colors.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSize(e as any);
                }
              }}
              placeholder="e.g. XL, 32, Free Size"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <button type="button" onClick={handleAddSize} className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-1 text-sm font-medium">
              <Plus className="w-4 h-4" /> Size
            </button>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddColor(e as any);
                }
              }}
              placeholder="e.g. Red, Blue, Navy"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <button type="button" onClick={handleAddColor} className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-1 text-sm font-medium">
              <Plus className="w-4 h-4" /> Color
            </button>
          </div>
        </div>
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
          <Info className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <p className="text-sm">Add at least one size or color to generate the inventory matrix.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSize(e as any);
              }
            }}
            placeholder="New Size (e.g. XXL)"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <button type="button" onClick={handleAddSize} className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition flex items-center justify-center text-sm font-medium border border-slate-200">
            <Plus className="w-4 h-4" /> Add Size
          </button>
        </div>
        
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddColor(e as any);
              }
            }}
            placeholder="New Color (e.g. Black)"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <button type="button" onClick={handleAddColor} className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition flex items-center justify-center text-sm font-medium border border-slate-200">
            <Plus className="w-4 h-4" /> Add Color
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold border-r border-slate-200 w-32 bg-slate-100/50">
                Size \ Color
              </th>
              {colors.map(color => (
                <th key={color} className="px-4 py-3 font-medium min-w-[120px] text-center">
                  {color}
                </th>
              ))}
              {colors.length === 0 && <th className="px-4 py-3 font-medium text-slate-400 italic">No colors added</th>}
            </tr>
          </thead>
          <tbody>
            {sizes.length === 0 ? (
              <tr>
                <td colSpan={colors.length + 1} className="px-4 py-8 text-center text-slate-400 italic">
                  No sizes added
                </td>
              </tr>
            ) : (
              sizes.map((size) => (
                <tr key={size} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-200 bg-slate-50/30">
                    {size}
                  </td>
                  {colors.map(color => {
                    const stockVal = getStock(size, color);
                    const isOutOfStock = stockVal === 0;

                    return (
                      <td 
                        key={`${size}-${color}`} 
                        className={`px-3 py-2 text-center transition-colors ${isOutOfStock ? 'bg-red-50' : ''}`}
                      >
                        <input
                          type="number"
                          min="0"
                          value={stockVal}
                          onChange={(e) => handleStockChange(size, color, e.target.value)}
                          placeholder="Stock"
                          className={`w-full max-w-[100px] mx-auto text-center px-2 py-1.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500/20 text-sm ${
                            isOutOfStock 
                              ? 'border-red-300 text-red-700 focus:border-red-500' 
                              : 'border-slate-200 focus:border-blue-500'
                          }`}
                        />
                      </td>
                    );
                  })}
                  {colors.length === 0 && <td className="bg-slate-50/50" />}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Summary Row */}
        <div className="bg-slate-800 text-white px-4 py-3 text-sm flex items-center justify-between">
          <div className="flex gap-6">
            <span className="font-medium text-slate-300">
              Total SKUs: <span className="text-white ml-1">{totalSKUs}</span>
            </span>
            <span className="font-medium text-emerald-400">
              In Stock: <span className="text-white ml-1">{inStockVariants}</span>
            </span>
            <span className="font-medium text-red-400">
              Out of Stock: <span className="text-white ml-1">{outOfStockCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
