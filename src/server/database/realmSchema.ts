import Realm from 'realm';
import { ObjectId } from 'bson';

interface UserSchemaType {
  id: string;
  username: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  imageProfile?: string;
  created_at: string;
  updated_at: string;
}

const UserSchema: Realm.ObjectSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'string',
    username: 'string',
    password: 'string',
    role: {
      type: 'string',
      default: 'user',
      optional: false
    },
    firstName: 'string',
    lastName: 'string',
    email: { 
      type: 'string',
      indexed: true
    },
    phone: {
      type: 'string',
      optional: true
    },
    address: {
      type: 'string',
      optional: true
    },
    city: {
      type: 'string',
      optional: true
    },
    postalCode: {
      type: 'string',
      optional: true
    },
    imageProfile: {
      type: 'string',
      optional: true
    },
    created_at: 'string',
    updated_at: 'string'
  }
};

interface ProductSchemaType {
  id: string;
  name: string;
  description: string;
  regularPrice: number;
  salePrice?: number;
  price: number;
  stock: number;
  category: string;
  type?: string;
  brand?: string;
  image: string;
  additionalImages?: string[];
  colors?: string[];
  created_at: string;
  updated_at: string;
}

const ProductSchema: Realm.ObjectSchema = {
  name: 'Product',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    description: 'string',
    regularPrice: 'double',
    salePrice: {
      type: 'double',
      optional: true
    },
    price: 'double',
    stock: 'int',
    category: 'string',
    type: {
      type: 'string',
      optional: true
    },
    brand: {
      type: 'string',
      optional: true
    },
    image: 'string',
    additionalImages: {
      type: 'list',
      objectType: 'string',
      default: []
    },
    colors: {
      type: 'list',
      objectType: 'string',
      default: []
    },
    created_at: 'string',
    updated_at: 'string'
  }
};

interface OrderItemSchemaType {
  _id: string;
  order: any;
  productId: string;
  quantity: number;
  price: number;
  selectedColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Realm.ObjectSchema = {
  name: 'OrderItem',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    order: 'Order',  
    productId: 'string',
    quantity: 'int',
    price: 'double',
    selectedColor: {
      type: 'string',
      optional: true
    },
    createdAt: 'date',
    updatedAt: 'date'
  }
};

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  recipientName: string;
  phoneNumber: string;
}

const ShippingDetailsSchema: Realm.ObjectSchema = {
  name: 'ShippingDetails',
  embedded: true,
  properties: {
    firstName: 'string',
    lastName: 'string',
    email: 'string',
    phone: 'string',
    address: 'string',
    city: 'string',
    postalCode: 'string',
    country: 'string',
    recipientName: 'string',
    phoneNumber: 'string'
  }
};

interface OrderSchemaType {
  _id: string;
  userId: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: Realm.List<OrderItemSchemaType>;
  paymentMethod: string;
  status: string;
  slipImage?: Uint8Array;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Realm.ObjectSchema = {
  name: 'Order',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    userId: 'string',
    totalAmount: 'double',
    shippingDetails: 'ShippingDetails',
    items: 'OrderItem[]', 
    paymentMethod: 'string',
    status: 'string',
    slipImage: { type: 'data', optional: true },  
    createdAt: 'date',
    updatedAt: 'date'
  }
};

interface WishlistSchemaType {
  id: string;
  userId: string;
  productId: string;
  created_at: string;
}

const WishlistSchema: Realm.ObjectSchema = {
  name: 'Wishlist',
  primaryKey: 'id',
  properties: {
    id: 'string',
    userId: 'string',
    productId: 'string',
    created_at: 'string'
  }
};

interface BrandSchemaType {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const BrandSchema: Realm.ObjectSchema = {
  name: 'Brand',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    slug: 'string',
    logo: { type: 'string', optional: true },
    description: { type: 'string', optional: true },
    created_at: 'string',
    updated_at: 'string'
  }
};

interface CategorySchemaType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const CategorySchema: Realm.ObjectSchema = {
  name: 'Category',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    slug: 'string',
    description: { type: 'string', optional: true },
    created_at: 'string',
    updated_at: 'string'
  }
};

interface MessageSchemaType {
  _id: string;
  userId: string;
  sender: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

const MessageSchema: Realm.ObjectSchema = {
  name: 'Message',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    userId: 'string',
    sender: 'string',
    content: 'string',
    timestamp: 'date',
    isRead: 'bool'
  }
};

interface ProductTypeSchemaType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const ProductTypeSchema: Realm.ObjectSchema = {
  name: 'ProductType',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    name: 'string',
    slug: 'string',
    description: { type: 'string', optional: true },
    created_at: 'date',
    updated_at: 'date'
  }
};

interface CartSchemaType {
  _id: string;
  userId: string;
  items: Realm.List<any>;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema: Realm.ObjectSchema = {
  name: 'CartItem',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', indexed: true },
    cart: { type: 'object', objectType: 'Cart' },
    productId: 'string',
    quantity: { type: 'int', default: 1 },
    selectedColor: { type: 'string', optional: true },
    createdAt: 'date',
    updatedAt: 'date'
  }
};

const CartSchema: Realm.ObjectSchema = {
  name: 'Cart',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', indexed: true },
    userId: 'string',
    items: { type: 'list', objectType: 'CartItem' },
    createdAt: 'date',
    updatedAt: 'date'
  }
};

interface VisitorSchemaType {
  _id: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const VisitorSchema: Realm.ObjectSchema = {
  name: 'Visitor',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    timestamp: 'date',
    ipAddress: { type: 'string', optional: true },
    userAgent: { type: 'string', optional: true }
  }
};

interface ReviewSchemaType {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  userName: string;
  date: string;
}

const ReviewSchema: Realm.ObjectSchema = {
  name: 'Review',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', default: () => new ObjectId().toString() },
    userId: 'string',
    productId: 'string',
    rating: 'int',
    comment: 'string',
    userName: 'string',
    date: 'string'
  }
};

export {
  UserSchema,
  ProductSchema,
  OrderSchema,
  OrderItemSchema,
  WishlistSchema,
  CartSchema,
  CartItemSchema,
  ProductTypeSchema,
  BrandSchema,
  CategorySchema,
  ShippingDetailsSchema,
  MessageSchema,
  VisitorSchema,
  ReviewSchema
};

export type {
  UserSchemaType,
  ProductSchemaType,
  OrderItemSchemaType,
  OrderSchemaType,
  WishlistSchemaType,
  BrandSchemaType,
  CategorySchemaType,
  MessageSchemaType,
  ProductTypeSchemaType,
  ShippingDetails,
  VisitorSchemaType,
  CartSchemaType,
  ReviewSchemaType
};
