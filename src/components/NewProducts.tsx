import { useState, useEffect } from "react";
import { Filter, ChevronDown, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./ProductCard.js";
import { Pagination } from "./Pagination.js";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
  count?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  regularPrice: number;
  salePrice: number | null;
  price: number;
  stock: number;
  category: string;
  image: string;
  created_at: string;
  updated_at: string;
  type?: string;
  brand?: string;
  colors?: string[];
  additionalImages?: string[];
}

const sortOptions = [
  { label: "Latest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export function NewProducts() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const productsPerPage = 12;

  useEffect(() => {
    // Fetch categories from the API
    const fetchCategories = async () => {
      try {
        console.log("Fetching categories...");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/categories`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const data = await response.json();
        console.log("Categories data:", data);

        if (Array.isArray(data)) {
          // Add "All New Arrivals" category
          const categoriesWithAll = [
            {
              id: "all",
              name: "All New Arrivals",
              slug: "all",
              description: "All new arrivals",
              created_at: "",
              updated_at: "",
              count: products.length,
            },
            ...data.map((category) => ({
              ...category,
              count: products.filter((p) => p.category === category.id).length,
            })),
          ];
          setCategories(categoriesWithAll);
        } else {
          console.error("Invalid categories data format:", data);
          setCategories([
            {
              id: "all",
              name: "All New Arrivals",
              slug: "all",
              description: "All new arrivals",
              created_at: "",
              updated_at: "",
              count: products.length,
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([
          {
            id: "all",
            name: "All New Arrivals",
            slug: "all",
            description: "All new arrivals",
            created_at: "",
            updated_at: "",
            count: products.length,
          },
        ]);
      }
    };

    if (products.length > 0) {
      fetchCategories();
    }
  }, [products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/products?addedWithin=1month`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSort, priceRange]);

  // Handle price range change
  const handlePriceRangeChange = (type: "min" | "max", value: string) => {
    setPriceRange((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Apply price filter
  const handleApplyPriceRange = () => {
    // This will trigger re-render and filtering due to priceRange dependency
    setCurrentPage(1);
  };

  // Reset price range
  const handleResetPriceRange = () => {
    setPriceRange({ min: "", max: "" });
  };

  // Filter products based on selected category and price range
  const filteredProducts = products
    .filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      // Price range filter
      const price = product.price;
      const min = priceRange.min !== "" ? parseFloat(priceRange.min) : null;
      const max = priceRange.max !== "" ? parseFloat(priceRange.max) : null;

      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort based on selected option
      switch (selectedSort.value) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="max-w-[1920px] mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="px-3 py-6 mb-4 text-center text-white bg-black rounded-lg sm:py-8 lg:py-10 sm:px-6 sm:mb-6">
        <h1 className="mb-2 text-xl font-bold sm:text-2xl lg:text-3xl">
          New Arrivals
        </h1>
        <p className="text-xs text-gray-300 sm:text-sm">
          Discover our latest collection of trending styles
        </p>
      </div>

      {/* Top Bar */}
      <div className="py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-1.5 text-xs font-medium sm:text-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <span className="text-xs text-gray-500 sm:text-sm">
              {filteredProducts.length} New Items
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 text-xs font-medium sm:text-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {selectedSort.label}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 z-10 w-40 mt-2 bg-white border rounded-lg shadow-lg sm:w-44">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedSort(option);
                      setShowSortDropdown(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 ${
                      selectedSort.value === option.value ? "bg-gray-50" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 py-4 sm:py-6">
        {/* Sidebar - Mobile Drawer */}
        <div
          className={`lg:hidden fixed inset-0 z-40 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="relative w-64 max-w-[80%] h-full bg-white p-4">
            <div className="h-full overflow-y-auto">
              <h3 className="mb-3 text-sm font-medium">Categories</h3>
              <div className="space-y-1.5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg ${
                      selectedCategory === category.id
                        ? "bg-black text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-[10px]">({category.count})</span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium">Price Range</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        handlePriceRangeChange("min", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        handlePriceRangeChange("max", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyPriceRange}
                      className="flex-1 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleResetPriceRange}
                      className="flex-1 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <div className="flex-shrink-0 hidden w-64 lg:block">
          <div className="sticky top-20">
            <h3 className="mb-3 text-sm font-medium">Categories</h3>
            <div className="space-y-1.5">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg ${
                    selectedCategory === category.id
                      ? "bg-black text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-[10px]">({category.count})</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-medium">Price Range</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) =>
                      handlePriceRangeChange("min", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) =>
                      handlePriceRangeChange("max", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyPriceRange}
                    className="flex-1 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleResetPriceRange}
                    className="flex-1 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex flex-col min-h-[50vh]">
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="py-6 mt-auto">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
