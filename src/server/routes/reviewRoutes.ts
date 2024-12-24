import express from 'express';
import { auth } from '../middleware/auth.js';
import { ReviewSchema, IReview } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { realm, ensureInitialized } from '../database/db.js';
import { ObjectId } from 'bson'; // Import ObjectId from bson

const router = express.Router();

// Protect all review routes
router.use(auth);

// Create a new review
router.post('/', async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Ensure realm is initialized
    const realmInstance = await ensureInitialized();
    
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }
    const existingReview = realmInstance.objects<IReview>('Review').filtered('userId == $0 && productId == $1', userId, productId)[0];
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Create the review
    let review;

    // Get user details
    const user = realmInstance.objects('User').filtered('id == $0', userId)[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.username || 'Anonymous User';

    realmInstance.write(() => {
      review = realmInstance.create('Review', {
        _id: new ObjectId().toString(),
        userId,
        productId,
        rating,
        comment,
        userName,
        date: new Date().toISOString(),
      });
    });

    // Update product rating
    const product = realmInstance.objects('Product').filtered('id == $0', productId)[0];
    if (product) {
      const reviews = realmInstance.objects<IReview>('Review').filtered('productId == $0', productId);
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      realmInstance.write(() => {
        product.rating = averageRating;
        product.reviewCount = reviews.length;
      });
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const realmInstance = await ensureInitialized();
    
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }

    const reviews = realmInstance.objects<IReview>('Review')
      .filtered('productId == $0', productId)
      .sorted('date', true);

    // Map reviews and include user information
    const reviewsWithUserInfo = Array.from(reviews).map(review => {
      const user = realmInstance.objects('User').filtered('id == $0', review.userId)[0];
      return {
        ...review,
        userName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username) : 'Anonymous User'
      };
    });

    res.json(reviewsWithUserInfo);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reviews by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const realmInstance = await ensureInitialized();
    
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }

    const reviews = realmInstance.objects<IReview>('Review').filtered('userId == $0', userId).sorted('date', true);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Check if user has reviewed a product
router.get('/check/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const realmInstance = await ensureInitialized();
    
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }

    const existingReview = realmInstance.objects('Review').filtered('userId == $0 && productId == $1', userId, productId)[0];
    
    res.json({ hasReviewed: !!existingReview });
  } catch (error) {
    console.error('Error checking review:', error);
    res.status(500).json({ error: 'Failed to check review status' });
  }
});

// Delete a review
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Ensure realm is initialized
    const realmInstance = await ensureInitialized();
    
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }

    const review = realmInstance.objects<IReview>('Review').filtered('_id == $0 && userId == $1', reviewId, userId)[0];
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    const productId = review.productId;

    realmInstance.write(() => {
      realmInstance.delete(review);
    });

    // Update product rating after deletion
    const product = realmInstance.objects('Product').filtered('id == $0', productId)[0];
    if (product) {
      const reviews = realmInstance.objects<IReview>('Review').filtered('productId == $0', productId);
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
      
      realmInstance.write(() => {
        product.rating = averageRating;
        product.reviewCount = reviews.length;
      });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
