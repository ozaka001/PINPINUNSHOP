import { ObjectId } from "bson";
import type { Realm } from 'realm';

export class Product {
  static schema = {
    name: 'Product',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      id: 'string',
      name: 'string',
      description: 'string',
      regularPrice: 'double',
      salePrice: { type: 'double', optional: true },
      price: 'double',
      image: 'string',
      category: 'string',
      stock: 'int',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };

  _id!: string;
  id!: string;
  name!: string;
  description!: string;
  regularPrice!: number;
  salePrice?: number;
  price!: number;
  image!: string;
  category!: string;
  stock!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
