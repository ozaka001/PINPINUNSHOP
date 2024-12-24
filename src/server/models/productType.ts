import Realm from 'realm';

export class ProductType extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  name!: string;
  slug!: string;
  description?: string;
  created_at!: Date;
  updated_at!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'ProductType',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      name: 'string',
      slug: 'string',
      description: 'string?',
      created_at: 'date',
      updated_at: 'date'
    }
  };
}

export type ProductTypeDocument = {
  _id: Realm.BSON.ObjectId;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
};
