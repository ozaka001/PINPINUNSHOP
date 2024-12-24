import { ObjectId } from 'bson';
import type { Realm } from 'realm';
import { CartItemSchema, CartSchema } from '../database/realmSchema.js';

export class CartItem {
  static schema = CartItemSchema;

  _id!: string;
  cart!: Cart;
  productId!: string;
  quantity!: number;
  selectedColor?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class Cart {
  static schema = CartSchema;

  _id!: string;
  userId!: string;
  items!: Realm.List<CartItem>;
  createdAt!: Date;
  updatedAt!: Date;
}
