import Realm from 'realm';
import dotenv from 'dotenv';
import {
  UserSchema,
  ProductSchema,
  CartSchema,
  CartItemSchema,
  OrderSchema,
  OrderItemSchema,
  WishlistSchema,
  BrandSchema,
  CategorySchema,
  MessageSchema,
  ShippingDetailsSchema
} from './realmSchema.js';

dotenv.config();

const APP_ID = process.env.REALM_APP_ID || 'shenshopper-xxxxx';

let realm: Realm | null = null;

export const connectDB = async () => {
  try {
    const app = new Realm.App({ id: APP_ID });
    const credentials = Realm.Credentials.anonymous();
    await app.logIn(credentials);

    realm = await Realm.open({
      schema: [
        UserSchema,
        ProductSchema,
        CartSchema,
        CartItemSchema,
        OrderSchema,
        OrderItemSchema,
        WishlistSchema,
        BrandSchema,
        CategorySchema,
        MessageSchema,
        ShippingDetailsSchema
      ],
      schemaVersion: 1
    });

    console.log('Realm database connected successfully');
    return realm;
  } catch (error) {
    console.error('Realm connection error:', error);
    process.exit(1);
  }
};

export const getRealm = () => {
  if (!realm) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return realm;
};

export default { connectDB, getRealm };
