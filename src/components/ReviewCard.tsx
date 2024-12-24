import { Star } from 'lucide-react';
import { Review } from '../types.js';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border">
      {/* Header: User Info and Rating */}
      <div className="flex items-start gap-4 mb-4">
        <img
          src={review.userImage || 'https://www.gravatar.com/avatar/?d=mp'}
          alt={review.userName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{review.userName}</h4>
            <span className="text-sm text-gray-500">
              {new Date(review.date).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`w-4 h-4 ${
                  index < review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {review.rating}/5
            </span>
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="pl-16">
        <p className="text-gray-600 leading-relaxed">{review.comment}</p>
        
        {/* Optional: Review Images */}
        {review.images && (
          <div className="mt-4 flex gap-2">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}