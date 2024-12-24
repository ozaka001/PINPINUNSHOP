import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Brand {
  _id: string;
  name: string;
  logo: string;
  description?: string;
}

export function BrandBanner() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/brands/public', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch brands');
        }
        const data = await response.json();
        console.log('Fetched brands:', data);
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandClick = (brand: Brand) => {
    // Reset any existing search params and set the brand
    navigate({
      pathname: '/products',
      search: `?brand=${encodeURIComponent(brand._id)}`
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render anything if there are no brands
  if (brands.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50 mb-8 mt-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <motion.div
              key={brand._id}
              className="group flex items-center justify-center p-6 bg-white border-[0.5px] border-gray-100 cursor-pointer hover:bg-gray-50"
              whileHover={{ 
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleBrandClick(brand)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleBrandClick(brand);
                }
              }}
            >
              <img
                src={brand.logo}
                alt={`${brand.name} logo - Click to view ${brand.name} products`}
                className="h-12 w-auto object-contain filter grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}