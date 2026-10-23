import React, { useState } from 'react';
import { MenuItem } from '../types';
import { generateSku } from '../data/mockData';
import { 
  X, 
  Upload, 
  Camera, 
  Sparkles, 
  Check, 
  DollarSign, 
  Tag, 
  FileText, 
  Image as ImageIcon,
  Layers,
  AlertCircle
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (item: MenuItem) => void;
  initialCategory?: MenuItem['category'];
  currentItemsCount: number;
  restaurantId?: string;
  sourceApp?: 'Store / Kitchen App' | 'Admin Portal';
}

const PRESET_PHOTOS = [
  {
    name: 'Gourmet Smash Burger',
    url: '/src/assets/images/dish_truffle_burger_1792736549347.jpg',
    category: 'Burgers'
  },
  {
    name: 'Artisan Woodfired Pizza',
    url: '/src/assets/images/dish_woodfired_pizza_1792736550881.jpg',
    category: 'Pizzas'
  },
  {
    name: 'Fresh Salmon Poke Bowl',
    url: '/src/assets/images/dish_salmon_poke_1792736549536.jpg',
    category: 'Bowls'
  },
  {
    name: 'Crispy Seasoned Fries',
    url: '/src/assets/images/hero_delivery_culinary_1792736549071.jpg',
    category: 'Sides'
  },
  {
    name: 'Crispy Hot Wings',
    url: 'https://images.unsplash.com/photo-1527477321005-4d45d724b8c4?w=500&auto=format&fit=crop&q=80',
    category: 'Sides'
  },
  {
    name: 'Iced Artisan Beverage',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
    category: 'Drinks'
  },
  {
    name: 'Neapolitan Calzone',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
    category: 'Pizzas'
  },
  {
    name: 'Loaded Avocado Burger',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    category: 'Burgers'
  }
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  initialCategory = 'Burgers',
  currentItemsCount,
  restaurantId = 'rest-1',
  sourceApp = 'Admin Portal',
}) => {
  const [category, setCategory] = useState<MenuItem['category']>(initialCategory);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(650);
  const [sku, setSku] = useState<string>(() => generateSku(initialCategory, currentItemsCount + 1));
  const [imageUrl, setImageUrl] = useState<string>(PRESET_PHOTOS[0].url);
  const [prepTime, setPrepTime] = useState('12-15 min');
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [inStock, setInStock] = useState<boolean>(true);
  const [tagInput, setTagInput] = useState('Chef Special, Fresh');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: MenuItem['category']) => {
    setCategory(newCat);
    // Auto-update SKU prefix if user hasn't heavily customized
    setSku(generateSku(newCat, Math.floor(Math.random() * 800) + 100));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!description.trim()) {
      setError('Product description is required');
      return;
    }
    if (!sku.trim()) {
      setError('SKU number or code is required');
      return;
    }
    if (price <= 0) {
      setError('Price must be greater than KSh 0');
      return;
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newItem: MenuItem = {
      id: `item-${category.toLowerCase()}-${Date.now()}`,
      sku: sku.trim().toUpperCase(),
      restaurantId,
      name: name.trim(),
      category,
      price: Number(price),
      description: description.trim(),
      image: imageUrl || PRESET_PHOTOS[0].url,
      prepTime,
      inStock,
      stockQuantity: Number(stockQuantity),
      isPopular: false,
      tags: tags.length ? tags : ['New Addition'],
    };

    onAddProduct(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {sourceApp} Catalog
              </span>
              <span className="font-mono text-xs text-neutral-400">SKU Generation Enabled</span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">Add New Product to Catalog</h2>
            <p className="text-xs text-neutral-400">
              Provide product details, item description, photo, and assign an official SKU code.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Category & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as MenuItem['category'])}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Burgers">Burgers</option>
                <option value="Pizzas">Pizzas</option>
                <option value="Bowls">Bowls</option>
                <option value="Sides">Sides</option>
                <option value="Drinks">Drinks</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Assigned SKU Number / Code
                </label>
                <button
                  type="button"
                  onClick={() => setSku(generateSku(category, Math.floor(Math.random() * 900) + 100))}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto Generate
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-VRB-105"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 uppercase focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Name & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Product Title / Dish Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Crispy Jalapeño Wagyu Burger"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Price (Kenyan Shilling - KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-neutral-500 font-bold">KSh</span>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Item Description & Culinary Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed ingredients, taste profile, buns, sauces, and cooking technique..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
              required
            />
          </div>

          {/* Photo Selection / Upload */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Product Photo & Visual Asset
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Preview */}
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shrink-0 bg-neutral-950 shadow-inner group">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-[10px] text-white font-semibold">Current Photo</span>
                </div>
              </div>

              {/* Upload & Presets */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-neutral-200 cursor-pointer flex items-center gap-2 transition">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-neutral-500">or choose from culinary gallery below:</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 pt-1">
                  {PRESET_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-video border transition cursor-pointer ${
                        imageUrl === preset.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-95'
                          : 'border-neutral-800 hover:border-neutral-600 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                      {imageUrl === preset.url && (
                        <div className="absolute top-1 right-1 bg-emerald-500 text-neutral-950 rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or enter direct image URL (https://...)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-[11px] text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Prep time, Initial Stock, Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Estimated Prep Time
              </label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g. 10-14 min"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Initial Stock Units
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Product Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. Gluten Free, Chef Special"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div>
              <div className="text-xs font-bold text-white">Immediate Store Availability</div>
              <div className="text-[11px] text-neutral-400">
                Mark whether this product is immediately available for orders upon publishing.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                inStock
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}
            >
              {inStock ? 'Available In Stock' : 'Mark Out of Stock'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save & Publish Product (SKU Assigned)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
