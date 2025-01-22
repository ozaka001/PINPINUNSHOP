import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const verifyToken = (token: string): { id: string } => {
  return jwt.verify(token, JWT_SECRET) as { id: string };
};
