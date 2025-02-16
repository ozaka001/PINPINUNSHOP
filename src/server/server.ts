import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import dashboardRoutes from "./routes/dashboard.js";
import productTypeRoutes from "./routes/productTypeRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import { initializeDatabase } from "./database/db.js";
import net from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "5000", 10);
let server: any = null;

// Configure CORS
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = [
      "https://pinpinunshop.netlify.app",
      "http://localhost:5173",
      "https://pinpinun.store",
      "https://www.pinpinun.store",
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable pre-flight for all routes

// Security middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Function to find an available port
const findAvailablePort = async (startPort: number): Promise<number> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => resolve(startPort));
      }
    });
    server.on("error", () => {
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
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/carts", cartRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/wishlist", wishlistRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/brands", brandRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/product-types", productTypeRoutes);
    app.use("/api/reviews", reviewRoutes);
    app.use("/api/system", systemRoutes);

    // Error handling middleware
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Server error:", err);
        res.status(500).json({
          error: "Internal server error",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    );

    // Serve static files
    app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

    // Find available port and start server
    const availablePort = await findAvailablePort(port);
    server = app.listen(availablePort, () => {
      console.log(`Server is running on port ${availablePort}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle shutdown gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server?.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server?.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
