import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import api from "../../services/api.js";
import toast from "../../services/toast.js";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface FormDataType {
  name: string;
  description: string;
  logo: string;
  logoFile?: File;
  slug?: string;
}

export default function BrandManagement() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    description: "",
    logo: "",
    slug: "",
  });

  // Fetch brands from API
  const fetchBrands = async () => {
    try {
      const response = await api.get<Brand[]>("/brands");
      console.log("Fetched brands:", response.data);
      setBrands(response.data);
    } catch (error: unknown) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to fetch brands");
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-");
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
        toast.error("Only JPEG, PNG and GIF images are allowed");
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            logo: event.target?.result as string,
            logoFile: file,
          }));
        }
      };

      reader.onerror = () => {
        toast.error("Error reading file");
      };

      reader.readAsDataURL(file);
    }
  };

  // Create new brand
  const handleCreate = async () => {
    try {
      // Validate logo
      if (!formData.logo) {
        toast.error("Please upload a logo image");
        return;
      }

      const now = new Date().toISOString();
      const brandData = {
        name: formData.name,
        description: formData.description,
        logo: formData.logo, // Already base64 from handleFileChange
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        created_at: now,
        updated_at: now,
      };

      console.log("Creating brand with data:", brandData);
      const response = await api.post<Brand>("/brands", brandData);
      console.log("Created brand response:", response.data);

      setIsModalOpen(false);
      setFormData({ name: "", description: "", logo: "", slug: "" });
      fetchBrands(); // Refresh the list
      toast.success("Brand created successfully");
    } catch (error: unknown) {
      console.error("Error creating brand:", error);
      toast.error("Failed to create brand");
    }
  };

  // Update brand
  const handleUpdate = async () => {
    if (!selectedBrand) return;
    try {
      // Validate logo if it was changed
      if (!formData.logo) {
        toast.error("Please upload a logo image");
        return;
      }

      const now = new Date().toISOString();
      const brandData = {
        name: formData.name,
        description: formData.description,
        logo: formData.logo, // Already base64 from handleFileChange
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        updated_at: now,
      };

      console.log("Updating brand with data:", brandData);
      const response = await api.put<Brand>(
        `/brands/${selectedBrand.id}`,
        brandData
      );
      console.log("Updated brand response:", response.data);

      setIsModalOpen(false);
      setSelectedBrand(null);
      setFormData({ name: "", description: "", logo: "", slug: "" });
      fetchBrands(); // Refresh the list
      toast.success("Brand updated successfully");
    } catch (error: unknown) {
      console.error("Error updating brand:", error);
      toast.error("Failed to update brand");
    }
  };

  // Delete brand
  const handleDelete = async (brandId: string) => {
    if (!brandId) {
      console.error("Cannot delete brand: brandId is undefined");
      toast.error("Cannot delete brand: Invalid ID");
      return;
    }

    try {
      console.log("Deleting brand with ID:", brandId);
      await api.delete(`/brands/${brandId}`);
      toast.success("Brand deleted successfully");
      fetchBrands(); // Refresh the list
    } catch (error: unknown) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
    }
  };

  // Format date for display
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat("en-GB").format(date); // DD/MM/YYYY
    } catch (error) {
      console.error("Invalid date format:", timestamp);
      return "N/A";
    }
  };

  // Filter brands based on search query
  const filteredBrands = brands.filter(
    (brand: Brand) =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (brand.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      )
  );

  // Open modal for editing
  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logo: brand.logo || "",
      slug: brand.slug,
    });
    setIsModalOpen(true);
  };

  // Open modal for adding new brand
  const handleAdd = () => {
    setSelectedBrand(null);
    setFormData({ name: "", description: "", logo: "", slug: "" });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brand Management</h2>
          <p className="text-gray-600">Manage your product brands</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
        <input
          type="text"
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 pl-10 pr-4 border rounded-lg"
        />
      </div>

      {/* Brands Table */}
      <div className="bg-white shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-500">
                  Logo
                </th>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-500">
                  Description
                </th>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-500">
                  Created At
                </th>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-500">
                  Updated At
                </th>
                <th className="px-6 py-3 text-sm font-medium text-right text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      No brands found
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Create a new brand to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{brand.name}</td>
                    <td className="px-6 py-4 text-gray-500">{brand.slug}</td>
                    <td className="px-6 py-4">
                      {brand.logo && (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="object-cover w-12 h-12"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {brand.description}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(brand.created_at)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(brand.updated_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {selectedBrand ? "Edit Brand" : "Add Brand"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                selectedBrand ? handleUpdate() : handleCreate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.slug}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Logo Image
                </label>
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleFileChange}
                />
                {formData.logo && (
                  <div className="mt-2">
                    <img
                      src={formData.logo}
                      alt="Logo preview"
                      className="object-cover w-20 h-20 rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedBrand(null);
                    setFormData({
                      name: "",
                      description: "",
                      logo: "",
                      slug: "",
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedBrand ? "Update Brand" : "Create Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
