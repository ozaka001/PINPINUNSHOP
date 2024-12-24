import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import dashboardRoutes from './routes/dashboard.js';
import productTypeRoutes from './routes/productTypeRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { initializeDatabase } from './database/db.js';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
let server: any = null;

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Function to find an available port
const findAvailablePort = async (startPort: number): Promise<number> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => resolve(startPort));
      }
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Initialize database and start server
async function startServer() {
  try {
    // Initialize the database first
    await initializeDatabase();

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/carts', cartRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/brands', brandRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/product-types', productTypeRoutes);
    app.use('/api/reviews', reviewRoutes);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({
        error: 'Internal server error',
        details: err instanceof Error ? err.message : 'Unknown error'
      });
    });

    // Serve static files
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Find available port and start server
    const availablePort = await findAvailablePort(port);
    server = app.listen(availablePort, () => {
      console.log(`Server is running on port ${availablePort}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server?.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server?.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
