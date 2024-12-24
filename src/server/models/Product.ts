import { ObjectId } from 'bson';

export interface Product {
  id: ObjectId;
  name: string;
  description: string;
  regularPrice: number;
  salePrice?: number;
  price: number;
  stock: number;
  category: string;
  image: string;
  additionalImages?: string[];
  colors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreate {
  name: string;
  description: string;
  regularPrice: number;
  salePrice?: number;
  price: number;
  stock: number;
  category: string;
  image: string;
  additionalImages?: string[];
  colors?: string[];
}

const ProductSchema = {
  bsonType: 'object',
  required: ['name', 'description', 'regularPrice', 'price', 'stock', 'category', 'image'],
  properties: {
    id: {
      bsonType: 'objectId',
    },
    name: {
      bsonType: 'string',
    },
    description: {
      bsonType: 'string',
    },
    regularPrice: {
      bsonType: 'double',
    },
    salePrice: {
      bsonType: 'double',
      optional: true,
    },
    price: {
      bsonType: 'double',
    },
    stock: {
      bsonType: 'int',
    },
    category: {
      bsonType: 'string',
    },
    image: {
      bsonType: 'string',
    },
    additionalImages: {
      bsonType: 'array',
      items: {
        bsonType: 'string',
      },
      optional: true,
    },
    colors: {
      bsonType: 'array',
      items: {
        bsonType: 'string',
      },
      optional: true,
    },
    createdAt: {
      bsonType: 'date',
    },
    updatedAt: {
      bsonType: 'date',
    },
  },
};

export const Product = {
  name: 'Product',
  schema: ProductSchema,
};
