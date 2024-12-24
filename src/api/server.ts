import express from "express";
import cors from "cors";
import dashboardRoutes from "./routes/dashboard.js";
import userRoutes from "./routes/user.js";
import uploadRoutes from "./routes/upload.js";
import path from "path";

const app = express();
const DEFAULT_PORT = 5000;
const MAX_PORT_ATTEMPTS = 10;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

// Routes
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// Health check endpoint
app.get("/api/admin/dashboard/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Function to try different ports
const startServer = async (startPort: number) => {
  for (let port = startPort; port < startPort + MAX_PORT_ATTEMPTS; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(port)
          .once('listening', () => {
            console.log(`Server is running on http://localhost:${port}`);
            resolve();
          })
          .once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
              console.log(`Port ${port} is busy, trying next port...`);
              server.close();
              reject(err);
            } else {
              console.error('Server error:', err);
              reject(err);
            }
          });
      });
      // If we get here, the server started successfully
      return port;
    } catch (err) {
      if (port === startPort + MAX_PORT_ATTEMPTS - 1) {
        throw new Error(`Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts`);
      }
      // Continue to next port
      continue;
    }
  }
};

// Start the server
startServer(DEFAULT_PORT).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  }
);