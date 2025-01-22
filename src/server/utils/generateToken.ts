import jwt from 'jsonwebtoken';
import { ObjectId } from 'bson';

export const generateToken = (id: string | ObjectId): string => {
  return jwt.sign(
    { id: id.toString() },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};
