import { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useSearch } from '../context/SearchContext.js';
import { useNavigate } from 'react-router-dom';
import { useOnClickOutside } from '../hooks/useOnClickOutside.js';
import { Product } from '../types.js';

export function SearchBox() {
  const { searchTerm, setSearchTerm, searchResults, loading } = useSearch();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close search results
  useOnClickOutside(searchRef, () => setSearchTerm(''));

  // Handle keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [setSearchTerm]);

  const handleResultClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchTerm('');
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none w-64"
        />
      </div>

      {/* Search Results Dropdown */}
      {searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2">
              {searchResults.map((product: Product) => (
                <button
                  key={product.id}
                  onClick={() => handleResultClick(product.id.toString())}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.category}</div>
                  </div>
                  <div className="font-medium">${product.price}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}