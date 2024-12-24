import Realm from 'realm';
import { ShippingDetails } from '../../types/order.js';

export interface RealmOrderItem extends Realm.Object {
  _id: string;
  order: RealmOrder;
  productId: string;
  quantity: number;
  price: number;
  selectedColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RealmOrder extends Realm.Object {
  _id: string;
  userId: string;
  totalAmount: number;
  status: string;
  items: Realm.List<RealmOrderItem>;
  paymentMethod: string;
  slipImage?: Uint8Array;
  shippingDetails: ShippingDetails;
  createdAt: Date;
  updatedAt: Date;
}

export const ShippingDetailsSchema = {
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

export const OrderItemSchema = {
  name: 'OrderItem',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    order: 'Order',
    productId: 'string',
    quantity: 'int',
    price: 'double',
    selectedColor: 'string?',
    createdAt: 'date',
    updatedAt: 'date'
  }
};

export const OrderSchema = {
  name: 'Order',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    userId: 'string',
    totalAmount: 'double',
    status: 'string',
    items: 'OrderItem[]',
    paymentMethod: 'string',
    slipImage: 'data?',
    shippingDetails: 'ShippingDetails',
    createdAt: 'date',
    updatedAt: 'date'
  }
};
