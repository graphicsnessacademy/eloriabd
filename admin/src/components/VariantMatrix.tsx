import React, { useState } from 'react';
import { Plus, Info, AlertTriangle } from 'lucide-react';

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

  // Grid logic: Infer colors/sizes from variants if props are empty (Re-hydration)
  const displayColors = colors.length > 0 
    ? colors 
    : Array.from(new Set(variants.map(v => v.color))).filter(Boolean);

  const displaySizes = sizes.length > 0 
    ? sizes 
    : (variants.length > 0 
        ? Array.from(new Set(variants.map(v => v.size))).filter(s => s && s !== 'Free Size')
        : []);

  const finalSizes = displaySizes.length > 0 ? displaySizes : ['Free Size'];
  
  const totalSKUs = finalSizes.length * displayColors.length;
  const inStockVariants = variants.filter(v => v.stock > 0).length;
  const grandTotalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  if (displayColors.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
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
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] outline-none"
            />
            <button type="button" onClick={handleAddColor} className="px-3 py-2 bg-[#534AB7] text-white rounded-lg hover:bg-[#3d3599] transition flex items-center justify-center gap-1 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Color
            </button>
          </div>
        </div>
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
          <Info className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <p className="text-sm">Add at least one color to start building your SKU Matrix.</p>
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
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] outline-none"
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
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] outline-none"
          />
          <button type="button" onClick={handleAddColor} className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition flex items-center justify-center text-sm font-medium border border-slate-200">
            <Plus className="w-4 h-4" /> Add Color
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold border-r border-slate-200 w-32 bg-slate-100/50 sticky left-0 z-10">
                Size \ Color
              </th>
              {displayColors.map(color => (
                <th key={color} className="px-4 py-3 font-medium min-w-[120px] text-center border-r border-slate-100">
                  {color}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {finalSizes.map((size) => (
              <tr key={size} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700 border-r border-slate-200 bg-slate-50/30 sticky left-0 z-10">
                  {size}
                </td>
                {displayColors.map(color => {
                  const stockVal = getStock(size, color);
                  const isOutOfStock = stockVal === 0;

                  return (
                    <td 
                      key={`${size}-${color}`} 
                      className={`px-3 py-2 text-center border-r border-slate-100 transition-colors ${isOutOfStock ? 'bg-rose-50/50' : ''}`}
                    >
                      <input
                        type="number"
                        min="0"
                        value={stockVal}
                        onChange={(e) => handleStockChange(size, color, e.target.value)}
                        placeholder="0"
                        className={`w-full max-w-[80px] mx-auto text-center px-2 py-1.5 border rounded-md outline-none focus:ring-2 focus:ring-[#534AB7]/20 text-sm font-medium transition-all ${
                          isOutOfStock 
                            ? 'border-rose-300 text-rose-700 focus:border-rose-500' 
                            : 'border-slate-200 focus:border-[#534AB7]'
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Summary Footer */}
        <div className="bg-[#FCFBFE] border-t border-slate-200 px-6 py-4 flex flex-wrap gap-8 items-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            Total SKUs: <span className="text-slate-900">{totalSKUs}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            In Stock: <span className="text-emerald-600">{inStockVariants}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#534AB7]" />
            Grand Total Stock: <span className="text-[#534AB7]">{grandTotalStock} Units</span>
          </div>
          
          {grandTotalStock === 0 && (
            <div className="flex items-center gap-1.5 text-rose-500 ml-auto lowercase font-normal italic">
              <AlertTriangle className="w-3 h-3" />
              product will show as 'sold out' on client side
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
