import express from "express";
import cors from "cors";
import path from "path";
import { initRealm, ensureInitialized } from "./database/db.js";
import dashboardRoutes from "./routes/dashboard.js";
import userRoutes from "./routes/user.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/product.js";
import uploadRoutes from "./routes/upload.js";
import cartRoutes from "./routes/cartRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import productTypeRoutes from "./routes/productTypes.js";
import systemRoutes from "./routes/systemRoutes.js";
import cartItemsRouter from "../api/cartItems.js";

const app = express();
const DEFAULT_PORT = 5000;

// Initialize Realm before setting up routes
console.log("Starting application...");

async function startServer() {
  try {
    console.log("Initializing Realm database...");
    await initRealm();
    // Verify initialization was successful
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error("Failed to initialize Realm database");
    }
    console.log("Realm database initialized successfully");

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ limit: "10mb", extended: true }));

    // Serve static files from uploads directory
    app.use("/uploads", express.static("uploads"));

    // Add error handling middleware
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Unhandled error:", err);
        res.status(500).json({
          error: "Internal server error",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    );

    // Routes
    // Mount cartItemsRouter BEFORE /api/carts to catch the PUT route
    app.use(cartItemsRouter);

    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/carts", cartRoutes);
    app.use("/api/brands", brandRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/product-types", productTypeRoutes);

    console.log("Mounting system routes at /api/system");
    app.use("/api/system", systemRoutes);

    // Add middleware to log all incoming requests
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });

    // Health check endpoint
    app.get("/api/health", async (req, res) => {
      try {
        await ensureInitialized();
        res.json({
          status: "ok",
          timestamp: new Date().toISOString(),
          database: "connected",
        });
      } catch (error) {
        res.status(500).json({
          status: "error",
          timestamp: new Date().toISOString(),
          database: "disconnected",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Start server
    const port = process.env.PORT || DEFAULT_PORT;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    process.exit(1); // Exit if initialization fails
  }
}

startServer();
