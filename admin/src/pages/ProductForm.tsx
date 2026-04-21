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
  }
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

          if (editor && p.description) {
            editor.commands.setContent(p.description);
          }

          const formattedImages = (p.images || []).map((img: any) => ({
            ...img,
            id: img.id || img.publicId || img._id || Math.random().toString()
          }));
          setImages(formattedImages);
          setSizes(p.sizes || []);
          setColors(p.colors || []);
          setVariants(p.variants || []);
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
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        price: data.price,
        originalPrice: data.originalPrice,
        tags: data.tags,
        isNewProduct: data.isNewProduct,
        isBestSeller: data.isBestSeller,
        metaTitle: data.seo.metaTitle,
        metaDescription: data.seo.metaDescription,
        metaKeywords: data.seo.metaKeywords,
        images,
        sizes,
        colors,
        variants
      };

      // clean up payload
      if (isNaN(payload.originalPrice as number)) {
         payload.originalPrice = 0;
      }

      if (isEditing) {
        await api.patch(`/api/admin/products/${id}`, payload);
      } else {
        await api.post('/api/admin/products', payload);
      }

      navigate('/admin/products');
    } catch (error: any) {
      console.error("Failed to save product", error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.errors?.[0]?.msg || 'Unknown error';
      alert(`Failed to save product: ${serverMsg}`);
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
    </form>
  );
};
