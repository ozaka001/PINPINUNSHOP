import { ObjectId } from "bson";
import { Realm } from "realm";

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  productId: string;
  created_at: Date;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
}

export interface Order {
  _id: ObjectId;
  userId: string;
  items: Realm.List<OrderItem> | OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentResult?: PaymentResult;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  created_at: Date;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderCreate extends Omit<Order, "_id"> {
  status: string;
}
