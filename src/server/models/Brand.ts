export interface IBrand {
  _id: string;
  name: string;
  logo: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BrandSchema = {
  name: 'Brand',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    logo: 'string',
    description: 'string?',
    createdAt: 'date',
    updatedAt: 'date'
  }
};
