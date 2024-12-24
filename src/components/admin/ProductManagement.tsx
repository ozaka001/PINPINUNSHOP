import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Product } from '../../types.js';
import { ProductEditModal } from './ProductEditModal.js';
import { productService } from '../../services/productService.js';

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch products from the API
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getAllProducts();
        setProducts(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!productId) {
      setError('Invalid product ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const success = await productService.deleteProduct(productId);
        if (success) {
          setProducts(currentProducts => currentProducts.filter(product => product.id !== productId));
          setError(null);
        } else {
          setError('Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product');
      }
    }
  };

  const handleSaveProduct = async (productData: Product) => {
    try {
      if (selectedProduct) {
        // Update existing product
        const success = await productService.updateProduct(selectedProduct.id, productData);
        if (success) {
          setProducts(currentProducts =>
            currentProducts.map(p => (p.id === selectedProduct.id ? { ...p, ...productData } : p))
          );
          setError(null);
        } else {
          throw new Error('Failed to update product');
        }
      } else {
        // Add new product
        const { id, created_at, updated_at, ...newProductData } = productData;
        
        // Ensure required fields are present and properly formatted
        const formattedProduct = {
          ...newProductData,
          regularPrice: Number(newProductData.regularPrice),
          price: Number(newProductData.price),
          stock: Number(newProductData.stock),
          salePrice: newProductData.salePrice ? Number(newProductData.salePrice) : null,
          colors: Array.isArray(newProductData.colors) ? newProductData.colors : [],
          additionalImages: Array.isArray(newProductData.additionalImages) ? newProductData.additionalImages : []
        };

        // Validate required fields
        if (!formattedProduct.name?.trim()) throw new Error('Product name is required');
        if (!formattedProduct.description?.trim()) throw new Error('Product description is required');
        if (!formattedProduct.category?.trim()) throw new Error('Product category is required');
        if (formattedProduct.regularPrice <= 0) throw new Error('Regular price must be greater than 0');
        if (formattedProduct.price <= 0) throw new Error('Price must be greater than 0');
        if (formattedProduct.stock < 0) throw new Error('Stock cannot be negative');

        const newProduct = await productService.createProduct(formattedProduct);
        setProducts(currentProducts => [...currentProducts, newProduct]);
        setError(null);
      }
      setIsModalOpen(false);
      setSelectedProduct(undefined);
    } catch (error) {
      console.error('Error saving product:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to save product');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      const allProducts = await productService.getAllProducts();
      setProducts(allProducts);
      return;
    }

    try {
      const searchResults = await productService.searchProducts(searchTerm);
      setProducts(searchResults);
      setError(null);
    } catch (error) {
      console.error('Error searching products:', error);
      setError('Failed to search products');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name && product.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-gray-600">Manage your store products</p>
        </div>
        <button
          onClick={() => {
            setSelectedProduct(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No products found
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                      {product.salePrice && (
                        <div className="text-xs text-gray-500 line-through">
                          ${product.regularPrice.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${product.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <div className="text-sm text-gray-500">
              Showing 1 to {filteredProducts.length} of {filteredProducts.length} results
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-50">Previous</button>
              <button className="px-3 py-1 border rounded-lg hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ProductEditModal
          isOpen={isModalOpen}
          product={selectedProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(undefined);
          }}
        />
      )}
    </div>
  );
}