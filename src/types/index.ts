export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  // New fields for extended product information
  type?: string;
  brand?: string;
  colors?: string[];
  description?: string;
  regularPrice?: number;
  salePrice?: number | null;
  additionalImages?: string[];
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

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
}

export interface WishlistItem extends Product {}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: 'user' | 'admin';
  phone?: string;
  address?: string;
  profilePicture?: string;
}

export interface AdminStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenue: number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  selectedColor?: string;
}

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  recipientName?: string;
}

export interface Order {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  date: string;
  shippingAddress: string;
  paymentMethod: string;
  slipUrl?: string;
  shippingDetails: ShippingDetails;
}