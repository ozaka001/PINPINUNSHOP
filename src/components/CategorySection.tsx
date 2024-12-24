import { Product } from '../types.js';
import { ProductCard } from './ProductCard.js';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CategorySectionProps {
  title: string;
  products: Product[];
}

export function CategorySection({ title, products }: CategorySectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link 
          to={`/products?category=${title}`}
          className="flex items-center text-gray-600 hover:text-black"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}