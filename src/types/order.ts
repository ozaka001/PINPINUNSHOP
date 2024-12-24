import { Realm } from 'realm';

export interface OrderItem {
  _id: string;
  order?: Order;  
  productId: string;
  quantity: number;
  price: number;
  selectedColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingDetails {
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

export interface Order extends Realm.Object {
  _id: string;
  userId: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: Realm.List<OrderItem>;
  paymentMethod: string;
  slipImage?: Uint8Array;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDTO {
  _id: string;
  userId: string;
  totalAmount: number;
  shippingDetails: ShippingDetails;
  items: Omit<OrderItem, 'order'>[];
  paymentMethod: string;
  slipUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderCreate = Omit<Order, keyof Realm.Object | 'items'> & {
  items: Omit<OrderItem, 'order'>[];
  slipUrl: string;
};
