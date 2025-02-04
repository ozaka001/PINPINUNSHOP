import { ObjectId } from 'bson';
import { 
  getOrderById,
  updateOrderInDb as updateOrder
} from '../database/db.js';

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderItem {
  _id: ObjectId;
  order: Order;
  productId: ObjectId;
  quantity: number;
  price: number;
  selectedColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  _id: ObjectId;
  userId: ObjectId;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: OrderItem[];
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cod';
  status?: string;
  slipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCreate {
  userId: ObjectId;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: Array<{
    productId: ObjectId;
    quantity: number;
    price: number;
    selectedColor?: string;
  }>;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cod';
  slipUrl?: string;
}

export const orderModel = {
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const order = await getOrderById(id);
      return order ? JSON.parse(JSON.stringify(order)) : null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    try {
      const updatedOrder = await updateOrder(id, updates);
      return updatedOrder ? JSON.parse(JSON.stringify(updatedOrder)) : null;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }
};
