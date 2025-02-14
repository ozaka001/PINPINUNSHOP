import { useState, useEffect } from "react";
import { Filter, ChevronDown, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./ProductCard.js";
import { Pagination } from "./Pagination.js";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number;
  regularPrice: number;
  stock: number;
  category: string;
  image: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
  count?: number;
}

const discountFilters = [
  { label: "10% - 30% off", value: "30" },
  { label: "31% - 50% off", value: "50" },
  { label: "Over 50% off", value: "70" },
];

const sortOptions = [
  { label: "Biggest Discount", value: "discount" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export function SaleProducts() {
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
  const [selectedDiscount, setSelectedDiscount] = useState<string>("");
  const productsPerPage = 12;

  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      const updatedCategories = categories
        .map((category) => {
          if (category.name === "All Sale Items") {
            return { ...category, count: products.length };
          }
          return {
            ...category,
            count: products.filter(
              (p) => p.category === category.id && p.salePrice > 0
            ).length,
          };
        })
        .filter(
          (category) => category.name === "All Sale Items" || category.count > 0
        );

      setCategories(updatedCategories);
    }
  }, [products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/products`
        );

        if (!response.ok) {
          console.error("HTTP error", response.status);
          const errorText = await response.text();
          console.error("Error response:", errorText);
          setError("Failed to fetch products.");
          return;
        }

        const allProducts = await response.json();

        // Filter products and ensure all required fields are present
        const saleProducts = allProducts
          .filter((product: Product) => product.salePrice > 0)
          .map((product: any) => ({
            ...product,
            salePrice: parseFloat(product.salePrice),
            regularPrice: parseFloat(product.regularPrice),
            price: parseFloat(product.price),
          }));

        setProducts(saleProducts);

        // Fetch and set categories after products are loaded
        const categoriesResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/categories`
        );
        if (!categoriesResponse.ok) {
          throw new Error(
            `Failed to fetch categories: ${categoriesResponse.status}`
          );
        }
        const categoriesData = await categoriesResponse.json();

        if (Array.isArray(categoriesData)) {
          // Add "All Sale Items" category
          interface AllSaleCategory extends Category {
            count: number;
          }

          interface CategoryWithCount extends Category {
            count: number;
          }

          const categoriesWithAll: Array<AllSaleCategory | CategoryWithCount> =
            [
              {
                id: "all",
                name: "All Sale Items",
                slug: "all",
                description: "All items on sale",
                created_at: "",
                updated_at: "",
                count: saleProducts.length,
              },
              ...categoriesData.map(
                (category: Category): CategoryWithCount => ({
                  ...category,
                  count: saleProducts.filter(
                    (p: Product) =>
                      p.category === category.id && p.salePrice > 0
                  ).length,
                })
              ),
            ];
          setCategories(categoriesWithAll);
        } else {
          console.error("Invalid categories data format:", categoriesData);
          setCategories([
            {
              id: "all",
              name: "All Sale Items",
              slug: "all",
              description: "All items on sale",
              created_at: "",
              updated_at: "",
              count: saleProducts.length,
            },
          ]);
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSort, priceRange, selectedDiscount]);

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

  // Function to handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Function to handle discount change
  const handleDiscountChange = (discount: string) => {
    setSelectedDiscount(discount);
  };

  // Filter products based on selected category and price range
  const filteredProducts = products
    .filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      // Price range filter
      const price = product.salePrice;
      const min = priceRange.min !== "" ? parseFloat(priceRange.min) : null;
      const max = priceRange.max !== "" ? parseFloat(priceRange.max) : null;

      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;

      // Discount filter
      if (selectedDiscount) {
        const discountPercent =
          ((product.regularPrice - product.salePrice) / product.regularPrice) *
          100;
        // Handle different discount range cases
        switch (selectedDiscount) {
          case "30": // 10-30% off
            if (discountPercent < 10 || discountPercent > 30) return false;
            break;
          case "50": // 31-50% off
            if (discountPercent <= 30 || discountPercent > 50) return false;
            break;
          case "70": // Over 50% off
            if (discountPercent <= 50) return false;
            break;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Sort based on selected option
      switch (selectedSort.value) {
        case "discount":
          const discountA =
            ((a.regularPrice - a.salePrice) / a.regularPrice) * 100;
          const discountB =
            ((b.regularPrice - b.salePrice) / b.regularPrice) * 100;
          return discountB - discountA;
        case "price_asc":
          return a.salePrice - b.salePrice;
        case "price_desc":
          return b.salePrice - a.salePrice;
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-[1920px] mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="px-3 py-6 mb-4 text-center text-white bg-red-600 rounded-lg sm:py-8 lg:py-10 sm:px-6 sm:mb-6">
        <h1 className="mb-2 text-xl font-bold sm:text-2xl lg:text-3xl">Sale</h1>
        <p className="text-xs text-gray-100 sm:text-sm">
          Up to 70% off on selected items
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
              {filteredProducts.length} Sale Items
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

      <div className="flex flex-col gap-6 py-4 lg:flex-row">
        {/* Sidebar - Mobile Drawer */}
        <div
          className={`fixed inset-0 z-40 lg:relative lg:z-0 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Backdrop for mobile */}
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 lg:hidden ${
              isSidebarOpen ? "block" : "hidden"
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Content */}
          <div className="relative w-56 h-full bg-white sm:w-64 lg:block">
            <div className="p-3 lg:p-0">
              <div className="flex items-center justify-between mb-3 lg:hidden">
                <h3 className="text-sm font-medium">Filters</h3>
                <button onClick={() => setIsSidebarOpen(false)}>✕</button>
              </div>

              <h3 className="mb-3 text-sm font-medium">Categories</h3>
              <div className="space-y-1.5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg ${
                      selectedCategory === category.id
                        ? "bg-red-600 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-[10px]">({category.count})</span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium">Discount</h3>
                <div className="space-y-1.5">
                  {discountFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => handleDiscountChange(filter.value)}
                      className={`w-full px-2.5 py-1.5 text-xs text-left rounded-lg ${
                        selectedDiscount === filter.value
                          ? "bg-red-600 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
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

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
