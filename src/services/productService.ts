import { AxiosResponse, AxiosError } from 'axios';
import { Product } from '../types.js';
import api from './api.js';

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const response: AxiosResponse<Product[]> = await api.get('/products');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const response: AxiosResponse<Product> = await api.get(`/products/${id}`);
      if (response.status === 404) {
        return null;
      }
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'description', 'regularPrice', 'price', 'category'];
      const missingFields = requiredFields.filter(field => !productData[field as keyof typeof productData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate image data
      if (productData.image && !productData.image.startsWith('data:image')) {
        throw new Error('Invalid image format. Image must be a valid base64 data URL');
      }

      // Prepare the data
      const formattedData = {
        name: productData.name?.trim(),
        description: productData.description?.trim(),
        regularPrice: Number(productData.regularPrice) || 0,
        salePrice: productData.salePrice ? Number(productData.salePrice) : null,
        price: Number(productData.price) || 0,
        stock: Number(productData.stock) || 0,
        category: productData.category?.trim(),
        type: productData.type?.trim() || '',
        brand: productData.brand?.trim() || '',
        colors: Array.isArray(productData.colors) ? productData.colors : [],
        image: productData.image || '',
        additionalImages: Array.isArray(productData.additionalImages) ? productData.additionalImages : []
      };

      // Validate numeric fields
      if (formattedData.regularPrice <= 0) throw new Error('Regular price must be greater than 0');
      if (formattedData.price <= 0) throw new Error('Price must be greater than 0');
      if (formattedData.stock < 0) throw new Error('Stock cannot be negative');

      const response: AxiosResponse<Product> = await api.post('/products', formattedData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle specific API errors
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to create product: ${message}`);
      }
      // Re-throw other errors
      throw error;
    }
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<boolean> {
    if (!id) {
      throw new Error('Product ID is required for update');
    }

    try {
      // Convert numeric fields to numbers and ensure arrays are properly formatted
      const formattedData = {
        ...productData,
        regularPrice: productData.regularPrice ? Number(productData.regularPrice) : undefined,
        salePrice: productData.salePrice ? Number(productData.salePrice) : null,
        price: productData.price ? Number(productData.price) : undefined,
        stock: productData.stock ? Number(productData.stock) : undefined,
        colors: Array.isArray(productData.colors) ? productData.colors : undefined,
        additionalImages: Array.isArray(productData.additionalImages) ? productData.additionalImages : [],
      };

      // Validate image data if present
      if (formattedData.image && !formattedData.image.startsWith('data:image')) {
        throw new Error('Invalid image format. Image must be a valid base64 data URL');
      }

      // Validate additional images if present
      if (formattedData.additionalImages) {
        for (const img of formattedData.additionalImages) {
          if (!img.startsWith('data:image')) {
            throw new Error('Invalid additional image format. Images must be valid base64 data URLs');
          }
        }
      }

      const response: AxiosResponse = await api.put(`/products/${id}`, formattedData);
      return response.status === 200;
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      if (error instanceof Error) {
        throw error;
      }
      return false;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('Product ID is required for deletion');
    }

    try {
      const response: AxiosResponse<any> = await api.delete(`/products/${id}`);
      return response.status === 200;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return false; // Product not found
      }
      console.error('Error deleting product:', error);
      return false;
    }
  },

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response: AxiosResponse<Product[]> = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  async getProductTypes(): Promise<{ _id: string; name: string; }[]> {
    try {
      const response: AxiosResponse<{ _id: string; name: string; }[]> = await api.get('/products/types');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching product types:', error);
      return [];
    }
  },

  async getBrands(): Promise<{ id: string; name: string; }[]> {
    try {
      const response: AxiosResponse<{ id: string; name: string; }[]> = await api.get('/products/brands');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching brands:', error);
      return [];
    }
  },

  async getCategories(): Promise<{ id: string; name: string; }[]> {
    try {
      const response: AxiosResponse<{ id: string; name: string; }[]> = await api.get('/products/categories');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
};
