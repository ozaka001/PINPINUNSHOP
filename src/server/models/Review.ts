import Realm from 'realm';
import { ObjectId } from 'bson';

export interface IReview {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = {
  name: 'Review',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', default: () => new ObjectId().toString() },
    userId: 'string',
    productId: 'string',
    rating: 'int',
    comment: 'string',
    createdAt: 'date',
    updatedAt: 'date'
  }
};

export default ReviewSchema;
