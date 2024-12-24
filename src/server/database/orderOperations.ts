import { v4 as uuidv4 } from 'uuid';
import { getOrderById as getOrderByIdFromDb, initRealm } from './db.js';
import Realm from 'realm';
import { ObjectId } from 'bson';

interface ShippingDetails {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  recipientName: string;
  phoneNumber: string;
}

interface OrderItem {
  _id: string;
  productId: string;
  quantity: number;
  price: number;
  selectedColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  _id: string;
  userId: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: OrderItem[];
  paymentMethod: string;
  status: string;
  slipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderCreate {
  userId: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: OrderItem[];
  paymentMethod: 'credit_card' | 'bank_transfer';
  slipUrl?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  regularPrice: number;
  salePrice?: number;
  price: number;
  stock: number;
  category: string;
  image: string;
}

interface PlainOrder {
  _id: string;
  userId: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: {
    _id: string;
    productId: string;
    quantity: number;
    price: number;
    selectedColor?: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  paymentMethod: string;
  status: string;
  slipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createOrder = async (orderData: OrderCreate) => {
  const realm = await initRealm();
  
  if (!realm) {
    throw new Error('Failed to initialize Realm database');
  }

  try {
    let order: Order | undefined;
    await realm.write(() => {
      // Create the order
      const newOrder = realm.create('Order', {
        _id: uuidv4(),
        userId: new ObjectId(orderData.userId).toString(),
        totalAmount: orderData.totalAmount,
        shippingDetails: orderData.shippingDetails,
        items: orderData.items.map(item => ({
          _id: uuidv4(),
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          selectedColor: item.selectedColor,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        paymentMethod: orderData.paymentMethod,
        status: 'pending',
        slipUrl: orderData.slipUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update product stock
      orderData.items.forEach(item => {
        const product = realm.objectForPrimaryKey<Product>('Product', item.productId);
        if (product) {
          product.stock -= item.quantity;
        }
      });

      order = newOrder;
    });

    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrders = async (userId?: string): Promise<PlainOrder[]> => {
  try {
    const realm = await initRealm();
    if (!realm) {
      throw new Error('Failed to initialize Realm database');
    }

    let orders = realm.objects<Order>('Order');

    if (userId) {
      orders = orders.filtered('userId == $0', userId);
    }

    // Sort by creation date, newest first
    orders = orders.sorted('createdAt', true);

    // Convert to plain objects and include items
    return Array.from(orders).map(order => {
      const plainOrder = {
        ...order,
        items: Array.from(order.items).map(item => ({
          ...item,
          _id: item._id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          selectedColor: item.selectedColor,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
      };
      return plainOrder;
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

export const getOrderById = getOrderByIdFromDb;

export const updateOrderStatus = async (orderId: string, status: string) => {
  const realm = await initRealm();
  if (!realm) {
    throw new Error('Failed to initialize Realm database');
  }
  
  try {
    const order = realm.objectForPrimaryKey('Order', orderId);
    if (!order) throw new Error('Order not found');

    await realm.write(() => {
      order.status = status;
      order.updatedAt = new Date();
    });

    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};
