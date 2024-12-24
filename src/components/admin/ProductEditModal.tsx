import { useState, useEffect } from "react";
import { X, Upload, Plus, Minus } from "lucide-react";
import { Product } from "../../types.js";
import api from '../../services/api.js';
import { Buffer } from 'buffer';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (product: Product) => void;
}

export interface ProductFormData {
  id: string;
  name: string;
  regularPrice: number;
  salePrice: number | null;
  price: number;
  stock: number;
  image: string;
  additionalImages: string[];
  category: string;
  type?: string;
  brand?: string;
  colors?: string[];
  description: string;
}

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#00FF00" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Purple", value: "#800080" },
  { name: "Brown", value: "#A52A2A" },
  { name: "Gray", value: "#808080" },
];

const productService = {
  getProductTypes: async () => {
    try {
      const response = await api.get('/products/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching product types:', error);
      return [];
    }
  },
  getBrands: async () => {
    try {
      const response = await api.get('/products/brands');
      return response.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  },
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
};

export function ProductEditModal({
  isOpen,
  onClose,
  product,
  onSave,
}: ProductEditModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    id: product?.id || '',
    name: product?.name || '',
    description: product?.description || '',
    regularPrice: product?.regularPrice || 0,
    salePrice: product?.salePrice || null,
    price: product?.price || 0,
    stock: product?.stock || 0,
    category: product?.category || '',
    type: product?.type || '',
    brand: product?.brand || '',
    colors: product?.colors || [],
    image: product?.image || '',
    additionalImages: product?.additionalImages || []
  });

  const [productTypes, setProductTypes] = useState<{ _id: string; name: string; }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string; }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [typesData, brandsData, categoriesData] = await Promise.all([
          productService.getProductTypes(),
          productService.getBrands(),
          productService.getCategories()
        ]);
        setProductTypes(typesData);
        setBrands(brandsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        price: product.price,
        stock: product.stock,
        category: product.category,
        type: product.type || '',
        brand: product.brand || '',
        colors: product.colors || [],
        image: product.image,
        additionalImages: product.additionalImages || []
      });
    } else {
      // Reset form for new product
      setFormData({
        id: '',
        name: '',
        description: '',
        regularPrice: 0,
        salePrice: null,
        price: 0,
        stock: 0,
        category: '',
        type: '',
        brand: '',
        colors: [],
        image: '',
        additionalImages: []
      });
    }
  }, [product]);

  useEffect(() => {
    if (!formData.image) {
      setFormData(prev => ({
        ...prev,
        image: 'https://via.placeholder.com/300x300?text=Upload+Image'
      }));
    }
  }, []);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Automatically update price based on regularPrice and salePrice
      if (name === 'regularPrice' || name === 'salePrice') {
        const regularPrice = name === 'regularPrice' ? Number(value) : prev.regularPrice;
        const salePrice = name === 'salePrice' ? (value ? Number(value) : null) : prev.salePrice;
        newData.price = salePrice || regularPrice;
      }
      
      return newData;
    });
  };

  const handleColorToggle = (colorName: string) => {
    const colors = formData?.colors || []; // Safely access colors with default value
    setFormData((prev) => ({
      ...prev,
      colors: colors.includes(colorName)
        ? colors.filter((c) => c !== colorName)
        : [...colors, colorName],
    }));
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Maximum dimensions
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.7 quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            // Validate the compressed image size
            const base64Size = (compressedBase64.length * 3) / 4;
            if (base64Size > 5 * 1024 * 1024) {
              throw new Error('Compressed image is still too large. Please use a smaller image.');
            }
            
            resolve(compressedBase64);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        img.src = event.target.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      // Reset error state
      setError('');

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      // Check file type
      if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
        throw new Error('File must be a JPEG, PNG, or GIF image');
      }

      const compressedImage = await compressImage(file);
      setFormData(prev => ({
        ...prev,
        image: compressedImage
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to upload image');
      }
    }
  };

  const handleAdditionalImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setError('No files selected');
      return;
    }

    try {
      setError('');

      // Convert FileList to Array for easier handling
      const fileArray = Array.from(files);

      // Validate all files before processing
      for (const file of fileArray) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Image ${file.name} is larger than 5MB`);
        }
        if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
          throw new Error(`File ${file.name} must be a JPEG, PNG, or GIF image`);
        }
      }

      // Process all files
      const compressedImages = await Promise.all(
        fileArray.map(file => compressImage(file))
      );

      setFormData(prev => ({
        ...prev,
        additionalImages: [...prev.additionalImages, ...compressedImages]
      }));
    } catch (error) {
      console.error('Error uploading additional images:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to upload additional images');
      }
    }

    // Clear the input
    event.target.value = '';
  };

  const removeAdditionalImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      const requiredFields = ['name', 'description', 'regularPrice', 'price', 'category', 'image'] as const;
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate numeric fields
      const numericFields = ['regularPrice', 'price', 'stock'] as const;
      const invalidNumericFields = numericFields.filter(field => 
        formData[field] !== undefined && 
        (isNaN(Number(formData[field])) || Number(formData[field]) < 0)
      );

      if (invalidNumericFields.length > 0) {
        throw new Error(`Invalid numeric values for fields: ${invalidNumericFields.join(', ')}`);
      }

      const productData: Product = {
        id: formData.id || '',  // Add the id from formData
        name: formData.name,
        description: formData.description,
        regularPrice: Number(formData.regularPrice),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category,
        type: formData.type || undefined,
        brand: formData.brand || undefined,
        colors: formData.colors,
        image: formData.image,
        additionalImages: formData.additionalImages,
        created_at: product?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (product?.id) {
        productData.id = product.id;
      }

      onSave(productData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An error occurred while saving the product');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {product ? "Edit Product" : "Add New Product"}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Brand
                    </label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Regular Price
                    </label>
                    <input
                      type="number"
                      name="regularPrice"
                      value={formData.regularPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Sale Price (Optional)
                    </label>
                    <input
                      type="number"
                      name="salePrice"
                      value={formData.salePrice || ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Type</option>
                      {productTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stock Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, stock: Math.max(0, prev.stock - 1) }))}
                      className="p-1 rounded-lg hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="block w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, stock: prev.stock + 1 }))}
                      className="p-1 rounded-lg hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Colors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => {
                      const isSelected = formData?.colors?.includes(color.name);
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleColorToggle(color.name)}
                          className={`
                            px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-colors
                            ${isSelected 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-white hover:bg-gray-100 border border-gray-200'
                            }
                          `}
                        >
                          <span
                            className={`w-4 h-4 border rounded-full ${isSelected ? 'opacity-50' : ''}`}
                            style={{ backgroundColor: color.value }}
                          />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  {/* Main Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Main Product Image
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="mainImage"
                      />
                      <label
                        htmlFor="mainImage"
                        className="cursor-pointer flex items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg"
                      >
                        {formData.image ? (
                          <img
                            src={formData.image}
                            alt="Product"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400" />
                        )}
                      </label>
                      {error && <p className="text-red-500">{error}</p>}
                    </div>
                  </div>

                  {/* Additional Images Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Images
                    </label>
                    <div className="mt-1 grid grid-cols-4 gap-4">
                      {/* Existing Additional Images */}
                      {formData.additionalImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Additional ${index + 1}`}
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload Button */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAdditionalImageUpload}
                        className="hidden"
                        id="additionalImages"
                        multiple
                      />
                      <label
                        htmlFor="additionalImages"
                        className="cursor-pointer flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50"
                      >
                        <Plus className="w-8 h-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Add Images</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg resize-none"
                    required
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
