import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import api from '../../services/api.js';
import toast from '../../services/toast.js';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function BrandManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: ''
  });

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands');
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to fetch brands');
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Create new brand
  const handleCreate = async () => {
    try {
      await api.post('/brands', formData);
      setIsModalOpen(false);
      setFormData({ name: '', description: '', logo: '' });
      fetchBrands(); // Refresh the list
      toast.success('Brand created successfully');
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Failed to create brand');
    }
  };

  // Update brand
  const handleUpdate = async () => {
    if (!selectedBrand) return;
    try {
      await api.put(`/brands/${selectedBrand.id}`, formData);
      setIsModalOpen(false);
      setSelectedBrand(null);
      setFormData({ name: '', description: '', logo: '' });
      fetchBrands(); // Refresh the list
      toast.success('Brand updated successfully');
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error('Failed to update brand');
    }
  };

  // Delete brand
  const handleDelete = async (brandId: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await api.delete(`/brands/${brandId}`);
      fetchBrands(); // Refresh the list
      toast.success('Brand deleted successfully');
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand');
    }
  };

  // Filter brands based on search query
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Open modal for editing
  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      logo: brand.logo || ''
    });
    setIsModalOpen(true);
  };

  // Open modal for adding new brand
  const handleAdd = () => {
    setSelectedBrand(null);
    setFormData({ name: '', description: '', logo: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Brand Management</h2>
          <p className="text-gray-600">Manage your product brands</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border rounded-lg"
        />
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Brand</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Slug</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Created At</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Updated At</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {brand.logo && (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <span className="font-medium">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{brand.slug}</td>
                  <td className="px-6 py-4 text-gray-500">{brand.description}</td>
                  <td className="px-6 py-4 text-gray-500">{brand.created_at}</td>
                  <td className="px-6 py-4 text-gray-500">{brand.updated_at}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(brand)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button 
                        onClick={() => handleDelete(brand.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBrands.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No brands found</h3>
            <p className="mt-2 text-gray-500">
              Create a new brand to get started.
            </p>
          </div>
        )}
      </div>

      {/* Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedBrand ? 'Edit Brand' : 'Add Brand'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              selectedBrand ? handleUpdate() : handleCreate();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedBrand(null);
                    setFormData({ name: '', description: '', logo: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedBrand ? 'Update Brand' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}