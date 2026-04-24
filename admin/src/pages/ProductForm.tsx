import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import CreatableSelect from 'react-select/creatable';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../api/axios';
import { ImageUpload } from '../components/ImageUpload';
import type { ImageItem } from '../components/ImageUpload';
import { VariantMatrix } from '../components/VariantMatrix';
import type { VariantItem } from '../components/VariantMatrix';
import { CATEGORIES } from '../constants/categories';
import { RelatedProductSelector } from '../components/RelatedProductSelector';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  tags: string[];
  isNewProduct: boolean;
  isBestSeller: boolean;
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };
  sizeChart: {
    show: boolean;
    data: Array<{
      size: string;
      chest: string;
      length: string;
      sleeve: string;
    }>;
  };
}

export const ProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  // External component states
  const [images, setImages] = useState<ImageItem[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: CATEGORIES[0].name,
      subcategory: CATEGORIES[0].subcategories[0].name,
      price: 0,
      originalPrice: 0,
      tags: [],
      isNewProduct: false,
      isBestSeller: false,
      seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: ''
      },
      sizeChart: {
        show: false,
        data: [{ size: 'M', chest: '', length: '', sleeve: '' }]
      }
    }
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setValue('description', editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-4',
      },
    },
  });

  const originalPrice = watch('originalPrice');
  const price = watch('price');
  const isSale = !!originalPrice && originalPrice > price;

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const res = await api.get(`/api/admin/products/${id}`);
          const p = res.data;
          
          setValue('name', p.name);
          setValue('description', p.description || '');
          setValue('category', p.category || CATEGORIES[0].name);
          setValue('subcategory', p.subcategory || CATEGORIES[0].subcategories[0].name);
          setValue('price', p.price);
          setValue('originalPrice', p.originalPrice || 0);
          setValue('tags', p.tags || []);
          setValue('isNewProduct', p.isNewProduct || false);
          setValue('isBestSeller', p.isBestSeller || false);
          setValue('seo.metaTitle', p.metaTitle || '');
          setValue('seo.metaDescription', p.metaDescription || '');
          setValue('seo.metaKeywords', p.metaKeywords || '');
          
          if (p.sizeChart) {
            setValue('sizeChart.show', p.sizeChart.show || false);
            setValue('sizeChart.data', p.sizeChart.data && p.sizeChart.data.length > 0 ? p.sizeChart.data : [{ size: 'M', chest: '', length: '', sleeve: '' }]);
          } else {
            // Legacy fallback if data exists in old fields
            setValue('sizeChart.show', p.showSizeChart || false);
            setValue('sizeChart.data', p.sizeChartData || [{ size: 'M', chest: '', length: '', sleeve: '' }]);
          }

          if (editor && p.description) {
            editor.commands.setContent(p.description);
          }

          const formattedImages = (p.images || []).map((img: any) => ({
            ...img,
            id: img.id || img.publicId || img._id || Math.random().toString()
          }));
          setImages(formattedImages);
          
          // --- Inventory Re-hydration ---
          // Extract unique colors and sizes from the variants matrix saved in the DB
          const dbVariants = p.variants || [];
          const extractedColors = Array.from(new Set(dbVariants.map((v: any) => v.color))).filter(Boolean) as string[];
          const extractedSizes = Array.from(new Set(dbVariants.map((v: any) => v.size))).filter(s => s && s !== 'Free Size') as string[];

          setColors(extractedColors);
          setSizes(extractedSizes);
          setVariants(dbVariants);

          setRelatedProducts((p.relatedProducts || []).map((rp: any) => typeof rp === 'object' ? rp._id : rp));
        } catch (error) {
          console.error("Failed to load product", error);
          alert('Failed to load product details');
          navigate('/admin/products');
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditing, setValue, navigate, editor]);

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        // Explicit cast to Number to prevent string slipping through react-hook-form
        price: Number(data.price),
        originalPrice: Number(data.originalPrice) || 0,
        tags: data.tags,
        isNewProduct: data.isNewProduct,
        isBestSeller: data.isBestSeller,
        metaTitle: data.seo.metaTitle,
        metaDescription: data.seo.metaDescription,
        metaKeywords: data.seo.metaKeywords,
        images,
        // Sizes/colors arrays kept for legacy support
        sizes,
        colors,
        // Variants from the VariantMatrix component
        variants: variants.map(v => ({
          color: String(v.color).trim(),
          size: String(v.size).trim(),
          stock: Number(v.stock) || 0
        })),
        // Related products: always a clean array of ID strings
        relatedProducts: relatedProducts
          .filter(id => typeof id === 'string' && id.length > 0)
          .map(id => (typeof id === 'object' ? (id as any)._id : id)),
        sizeChart: data.sizeChart
      };

      if (isEditing) {
        await api.patch(`/api/admin/products/${id}`, payload);
      } else {
        await api.post('/api/admin/products', payload);
      }

      navigate('/admin/products');
    } catch (error: any) {
      console.error("Failed to save product", error);
      // Surface specific Mongoose/express-validator messages
      const mongooseErrors = error?.response?.data?.errors;
      let serverMsg: string;
      if (mongooseErrors) {
        // express-validator errors array
        serverMsg = Array.isArray(mongooseErrors)
          ? mongooseErrors.map((e: any) => e.msg || e.message).join('\n')
          : JSON.stringify(mongooseErrors);
      } else {
        serverMsg = error?.response?.data?.message || error?.message || 'Unknown server error';
      }
      alert(`Save failed:\n${serverMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            onClick={() => navigate('/admin/products')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{isSaving ? 'Saving...' : 'Save Product'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input 
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="Product Name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <EditorContent editor={editor} className="min-h-[150px] bg-slate-50/50" />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-slate-800 font-semibold mb-4">Product Images</h3>
            <ImageUpload value={images} onChange={setImages} maxFiles={4} />
          </div>

          {/* Variants Matrix */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-slate-800 font-semibold mb-1">Inventory Variants</h3>
            <p className="text-slate-500 text-sm mb-4">Configure SKUs, sizes, colors and track specific stock counts</p>
            <VariantMatrix 
              sizes={sizes}
              colors={colors}
              variants={variants}
              onChangeSizes={setSizes}
              onChangeColors={setColors}
              onVariantsChange={setVariants}
            />
          </div>
          
          {/* Size Chart Management */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-slate-800 font-semibold">Size Chart Management</h3>
                <p className="text-slate-500 text-sm">Create a dynamic size chart for this specific product</p>
              </div>
              <Controller
                name="sizeChart.show"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${field.value ? 'bg-[#534AB7]' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                )}
              />
            </div>

            {watch('sizeChart.show') && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('sizeChart.data', [
                        { size: 'M', chest: '38', length: '27', sleeve: '7.5' },
                        { size: 'L', chest: '40', length: '28', sleeve: '8' },
                        { size: 'XL', chest: '42', length: '29', sleeve: '8.5' }
                      ]);
                    }}
                    className="text-[10px] font-bold text-[#534AB7] hover:bg-[#534AB7]/10 px-3 py-1.5 rounded-lg border border-[#534AB7]/20 transition-all uppercase tracking-wider"
                  >
                    Use Default Template
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Size</th>
                        <th className="px-4 py-3">Chest (in)</th>
                        <th className="px-4 py-3">Length (in)</th>
                        <th className="px-4 py-3">Sleeve (in)</th>
                        <th className="px-4 py-3 rounded-r-lg w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <Controller
                        name="sizeChart.data"
                        control={control}
                        render={({ field }) => (
                          <>
                            {field.value.map((row, index) => (
                              <tr key={index}>
                                <td className="px-2 py-2">
                                  <input
                                    value={row.size}
                                    onChange={(e) => {
                                      const newData = [...field.value];
                                      newData[index].size = e.target.value;
                                      field.onChange(newData);
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#534AB7] outline-none"
                                    placeholder="M"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    value={row.chest}
                                    onChange={(e) => {
                                      const newData = [...field.value];
                                      newData[index].chest = e.target.value;
                                      field.onChange(newData);
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#534AB7] outline-none"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    value={row.length}
                                    onChange={(e) => {
                                      const newData = [...field.value];
                                      newData[index].length = e.target.value;
                                      field.onChange(newData);
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#534AB7] outline-none"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    value={row.sleeve}
                                    onChange={(e) => {
                                      const newData = [...field.value];
                                      newData[index].sleeve = e.target.value;
                                      field.onChange(newData);
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#534AB7] outline-none"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <button
                                    type="button"
                                    onClick={() => field.onChange(field.value.filter((_, i) => i !== index))}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={5} className="pt-4">
                                <button
                                  type="button"
                                  onClick={() => field.onChange([...field.value, { size: '', chest: '', length: '', sleeve: '' }])}
                                  className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-[#534AB7] hover:text-[#534AB7] transition-all text-xs font-bold"
                                >
                                  + ADD ROW
                                </button>
                              </td>
                            </tr>
                          </>
                        )}
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SEO Collapsible */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <button 
              type="button" 
              onClick={() => setSeoOpen(!seoOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="font-semibold text-slate-800">Search Engine Optimization (SEO)</span>
              {seoOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </button>
            {seoOpen && (
              <div className="p-6 pt-2 space-y-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                  <input {...register('seo.metaTitle')} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                  <textarea {...register('seo.metaDescription')} rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meta Keywords</label>
                  <input {...register('seo.metaKeywords')} placeholder="e.g. fashion, saree, summer" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Organization & Price */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select 
                {...register('category', { required: 'Category is required' })}
                onChange={(e) => {
                  setValue('category', e.target.value);
                  const selectedCat = CATEGORIES.find(c => c.name === e.target.value);
                  if (selectedCat && selectedCat.subcategories.length > 0) {
                    setValue('subcategory', selectedCat.subcategories[0].name);
                  } else {
                    setValue('subcategory', '');
                  }
                }}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {CATEGORIES.map(c => (
                  <option key={c.slug} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
              <select 
                {...register('subcategory')} 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={!watch('category')}
              >
                {CATEGORIES.find(c => c.name === watch('category'))?.subcategories.map(sub => (
                  <option key={sub.slug} value={sub.name}>{sub.name}</option>
                )) || <option value="">No subcategories</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (৳) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                step="0.01"
                {...register('price', { required: 'Price is required', valueAsNumber: true })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Original Price (৳)</label>
              <input 
                type="number" 
                step="0.01"
                {...register('originalPrice', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
              />
              <p className="text-xs text-slate-400 mt-1">Leave empty or 0 if no discount is applied.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <CreatableSelect
                    isMulti
                    value={field.value.map(val => ({ label: val, value: val }))}
                    onChange={(newValue) => field.onChange(newValue.map(v => v.value))}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#e2e8f0',
                        borderRadius: '0.5rem',
                        '&:hover': { borderColor: '#cbd5e1' },
                        boxShadow: 'none'
                      })
                    }}
                  />
                )}
              />
            </div>
          </div>

          {/* Badges / Visibility */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <h3 className="text-slate-800 font-semibold mb-2">Featured Flags</h3>
            
            <label className="flex items-center justify-between cursor-pointer p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
              <div>
                <p className="font-medium text-slate-800 text-sm">New Arrival</p>
                <p className="text-xs text-slate-500">Adds "NEW" badge to product</p>
              </div>
              <input type="checkbox" {...register('isNewProduct')} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
              <div>
                <p className="font-medium text-slate-800 text-sm">Best Seller</p>
                <p className="text-xs text-slate-500">Adds "TOP" badge to product</p>
              </div>
              <input type="checkbox" {...register('isBestSeller')} className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500" />
            </label>

            <div className={`flex items-center justify-between p-3 border rounded-lg transition ${isSale ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50/50 grayscale opacity-70'}`}>
              <div>
                <p className={`font-medium text-sm ${isSale ? 'text-rose-700' : 'text-slate-600'}`}>Active Sale</p>
                <p className="text-xs text-slate-500">Auto-detected from Original Price</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isSale ? 'bg-rose-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isSale ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
        <h3 className="text-slate-800 font-semibold mb-1 font-serif text-lg">Curated Related Products</h3>
        <p className="text-slate-500 text-sm mb-4">Manually select up to 6 products to feature as 'Related Masterpieces' on this product's page. If left empty, automatic recommendations will be shown.</p>
        <RelatedProductSelector 
          selectedIds={relatedProducts} 
          onChange={setRelatedProducts} 
          currentProductId={id}
        />
      </div>
    </form>
  );
};
