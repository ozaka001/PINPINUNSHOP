import { Request, Response } from 'express';
import Realm from 'realm';
import { ObjectId } from 'bson';
import { IReview } from '../models/Review';

export const createReview = async (req: Request, res: Response) => {
  const { userId, productId, rating, comment } = req.body;

  try {
    const realm = await Realm.open({
      schema: [require('../models/Review').default]
    });

    let review: IReview;

    realm.write(() => {
      review = realm.create('Review', {
        _id: new ObjectId().toString(),
        userId,
        productId,
        rating,
        comment,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating review'
    });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;

  try {
    const realm = await Realm.open({
      schema: [require('../models/Review').default]
    });

    const reviews = realm.objects('Review').filtered('productId == $0', productId);

    res.status(200).json({
      success: true,
      data: Array.from(reviews)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching reviews'
    });
  }
};

export const getUserReviews = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const realm = await Realm.open({
      schema: [require('../models/Review').default]
    });

    const reviews = realm.objects('Review').filtered('userId == $0', userId);

    res.status(200).json({
      success: true,
      data: Array.from(reviews)
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user reviews'
    });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  try {
    const realm = await Realm.open({
      schema: [require('../models/Review').default]
    });

    realm.write(() => {
      const review = realm.objectForPrimaryKey('Review', reviewId);
      if (review) {
        review.rating = rating;
        review.comment = comment;
        review.updatedAt = new Date();
      }
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating review'
    });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  try {
    const realm = await Realm.open({
      schema: [require('../models/Review').default]
    });

    realm.write(() => {
      const review = realm.objectForPrimaryKey('Review', reviewId);
      if (review) {
        realm.delete(review);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting review'
    });
  }
};
