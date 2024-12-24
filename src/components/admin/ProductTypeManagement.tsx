import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../services/api.js';
import toast from '../../services/toast.js';

interface ProductType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function ProductTypeManagement() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch product types from API
  const fetchProductTypes = async () => {
    try {
      const response = await api.get('/product-types');
      setProductTypes(response.data);
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Failed to fetch product types');
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  // Create new product type
  const handleCreate = async () => {
    try {
      await api.post('/product-types', formData);
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      fetchProductTypes(); // Refresh the list
      toast.success('Product type created successfully');
    } catch (error) {
      console.error('Error creating product type:', error);
      toast.error('Failed to create product type');
    }
  };

  // Update product type
  const handleUpdate = async () => {
    if (!selectedProductType) return;
    try {
      await api.put(`/product-types/${selectedProductType._id}`, formData);
      setIsModalOpen(false);
      setSelectedProductType(null);
      setFormData({ name: '', description: '' });
      fetchProductTypes(); // Refresh the list
      toast.success('Product type updated successfully');
    } catch (error) {
      console.error('Error updating product type:', error);
      toast.error('Failed to update product type');
    }
  };

  // Delete product type
  const handleDelete = async (productTypeId: string) => {
    if (!window.confirm('Are you sure you want to delete this product type?')) return;
    try {
      await api.delete(`/product-types/${productTypeId}`);
      fetchProductTypes(); // Refresh the list
      toast.success('Product type deleted successfully');
    } catch (error) {
      console.error('Error deleting product type:', error);
      toast.error('Failed to delete product type');
    }
  };

  // Open modal for create/edit
  const handleOpenModal = (productType?: ProductType) => {
    if (productType) {
      setSelectedProductType(productType);
      setFormData({
        name: productType.name,
        description: productType.description || ''
      });
    } else {
      setSelectedProductType(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  // Filter product types based on search query
  const filteredProductTypes = productTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold">Product Type Management</h1>
        <p className="text-gray-600">Manage your Product Types</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          <Plus size={20} />
          Add Product Type
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search product types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" size={20} />
        </div>
      </div>

      {/* Product Types Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProductTypes.map((type) => (
              <tr key={type._id}>
                <td className="px-6 py-4 whitespace-nowrap">{type.name}</td>
                <td className="px-6 py-4">{type.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(type.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(type)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(type._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {selectedProductType ? 'Edit Product Type' : 'Create Product Type'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={selectedProductType ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {selectedProductType ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
