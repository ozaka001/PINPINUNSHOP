import Realm from 'realm';
import { ShippingDetails } from './server/models/Order.js';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  imageProfile?: string;
  created_at: string;
  updated_at: string;
  token?: string;
}

export interface UserCreate {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: 'user' | 'admin';
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  regularPrice: number;
  salePrice: number | null;
  price: number;
  stock: number;
  category: string;
  type?: string;
  brand?: string;
  colors?: string[];
  image: string;
  additionalImages?: string[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';

export interface Order {
  _id: Realm.BSON.ObjectId;
  userId: Realm.BSON.ObjectId;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: OrderItem[];
  paymentMethod: string;
  status: OrderStatus;
  slipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  title: string;
  image?: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartProduct extends Product {
  selectedColor?: string;
}

export interface WishlistItem {
  product: Product;
  added_at: string;
}

export interface DashboardStats {
  orderCount: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Order[];
  salesData: SalesData[];
  visitorData: VisitorData[];
  increases: {
    revenue: number;
    orders: number;
    users: number;
    products: number;
  };
}

export interface VisitorData {
  date: string;
  count: number;
}

export interface SalesData {
  date: string;
  amount: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  userImage?: string;
  images?: string[];
}

export interface DBUser extends User {
  password: string;
}

export interface Activity {
  id: string;
  type: 'order_placed' | 'user_registered' | 'product_added' | 'product_updated';
  userId: string;
  details: string;
  timestamp: string;
}
