import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import routes
import userRoutes from './src/server/routes/userRoutes.js';
import uploadRoutes from './src/server/routes/upload.js';
import productRoutes from './src/server/routes/product.js';
import authRoutes from './src/server/routes/auth.js';

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const server = createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
