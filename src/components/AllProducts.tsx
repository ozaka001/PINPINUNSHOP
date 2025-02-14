import { useState, useEffect } from "react";
import { Filter, ChevronDown, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./ProductCard.js";
import { Product } from "../types.js";
import { useSearchParams } from "react-router-dom";
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

const sortOptions = [
  { label: "Recommended", value: "recommended" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export function AllProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const productsPerPage = 12;
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const brand = searchParams.get("brand")?.toLowerCase();
        const category = searchParams.get("category");
        let url = `${import.meta.env.VITE_API_BASE_URL}/products`;

        // สร้าง URL parameters
        const params = new URLSearchParams();
        if (brand) {
          params.append("brand", brand);
        }
        if (category && category !== "All Products") {
          params.append("category", category);
        }

        // เพิ่ม parameters ถ้ามี
        const finalUrl = params.toString()
          ? `${url}?${params.toString()}`
          : url;

        console.log("Fetching products with URL:", finalUrl);

        const response = await fetch(finalUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/categories`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const data: Category[] = await response.json();

        // Calculate counts for each category
        const categoryCounts = products.reduce(
          (counts: { [key: string]: number }, product) => {
            if (product.category) {
              counts[product.category] = (counts[product.category] || 0) + 1;
            }
            return counts;
          },
          {}
        );

        // Add counts to categories and "All Products" category
        const categoriesWithCounts = data.map((category) => ({
          ...category,
          count: categoryCounts[category.id] || 0,
        }));

        // Add "All Products" category with total count
        const categoriesWithAll = [
          {
            id: "all",
            name: "All Products",
            slug: "all",
            description: "All Products",
            created_at: "",
            updated_at: "",
            count: products.length,
          },
          ...categoriesWithCounts,
        ];

        setCategories(categoriesWithAll);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([
          {
            id: "all",
            name: "All Products",
            slug: "all",
            description: "All Products",
            created_at: "",
            updated_at: "",
          },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [products]);

  useEffect(() => {
    // Update URL when category changes
    if (selectedCategory === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", selectedCategory);
    }
    setSearchParams(searchParams);
  }, [selectedCategory]);

  useEffect(() => {
    // Close mobile filter when screen size changes
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileFilterOpen(false);
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSort, priceRange]);

  const handlePriceRangeChange = (type: "min" | "max", value: string) => {
    setPriceRange((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleApplyPriceRange = () => {
    setCurrentPage(1);
  };

  const handleResetPriceRange = () => {
    setPriceRange({ min: "", max: "" });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", categoryId);
    }
    setSearchParams(searchParams);
    setCurrentPage(1);
  };

  const filteredProducts = products
    .filter((product) => {
      // Category filter
      const categoryMatch =
        selectedCategory === "all" || product.category === selectedCategory;

      // Price filter
      const priceMatch =
        (!priceRange.min || product.price >= parseFloat(priceRange.min)) &&
        (!priceRange.max || product.price <= parseFloat(priceRange.max));

      return categoryMatch && priceMatch;
    })
    .sort((a, b) => {
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

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="max-w-[1920px] mx-auto px-2 sm:px-4">
      {/* Top Bar */}
      <div className="py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsSidebarOpen(!isSidebarOpen);
                } else {
                  setIsMobileFilterOpen(true);
                }
              }}
              className="flex items-center gap-1.5 text-xs font-medium lg:hidden"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <span className="text-xs text-gray-500">
              {filteredProducts.length} Items
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{selectedSort.label}</span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 z-10 w-40 mt-2 bg-white border rounded-lg shadow-lg">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedSort(option);
                      setShowSortDropdown(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 ${
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

      <div className="flex gap-6 py-4">
        {/* Mobile Filter Overlay */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-full max-w-xs p-4 overflow-y-auto bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium">Filters</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-medium">Categories</h3>
                  {loadingCategories ? (
                    <div>Loading categories...</div>
                  ) : (
                    <div className="space-y-1.5">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            handleCategoryChange(category.id);
                            setIsMobileFilterOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg ${
                            selectedCategory === category.id
                              ? "bg-black text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <span>{category.name}</span>
                          <span>({category.count})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
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
        )}

        {/* Desktop Sidebar */}
        {isSidebarOpen && (
          <div className="flex-shrink-0 hidden w-56 lg:block">
            <div className="sticky top-20">
              <h3 className="mb-3 text-sm font-medium">Categories</h3>
              {loadingCategories ? (
                <div>Loading categories...</div>
              ) : (
                <div className="space-y-1.5">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg ${
                        selectedCategory === category.id
                          ? "bg-black text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <span>{category.name}</span>
                      <span>({category.count})</span>
                    </button>
                  ))}
                </div>
              )}
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
        )}

        {/* Product Grid */}
        <div className="flex-1 flex flex-col min-h-[600px]">
          <div className="grid flex-grow grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center py-8">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 mx-1 text-xs font-medium rounded ${
                  currentPage === index + 1
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 mx-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
