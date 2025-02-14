import express from "express";
import { v4 as uuidv4 } from "uuid";
import { ensureInitialized } from "../database/db.js";
import { BrandSchemaType } from "../database/realmSchema.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Add database initialization middleware
router.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    console.error("Database initialization error:", error);
    res.status(500).json({
      error: "Database initialization failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Main brands endpoint
router.get("/", async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error("Database not initialized");
    }

    const brands = realm.objects<BrandSchemaType>("Brand");
    console.log(
      "Raw brands from database:",
      JSON.stringify(Array.from(brands))
    );

    const formattedBrands = Array.from(brands).map((brand) => ({
      id: brand.id,
      _id: brand.id, // Add _id for frontend compatibility
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      description: brand.description || "",
      created_at: brand.created_at,
      updated_at: brand.updated_at,
    }));

    console.log("Formatted brands:", JSON.stringify(formattedBrands));
    res.json(formattedBrands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

// Public route for fetching brands
router.get("/public", async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error("Database not initialized");
    }

    const brands = realm.objects<BrandSchemaType>("Brand");
    const formattedBrands = Array.from(brands).map((brand) => ({
      id: brand.id,
      _id: brand.id, // Add _id for frontend compatibility
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      description: brand.description || "",
      created_at: brand.created_at,
      updated_at: brand.updated_at,
    }));

    // Unified CORS configuration
    const allowedOrigins = [
      "https://pinpinunshop.netlify.app",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:5173"]
        : []),
    ];

    if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    res.json(formattedBrands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

// Protected routes below this middleware
router.use(auth);

// Create new brand
router.post("/", async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error("Database not initialized");
    }

    const { name, description, logo } = req.body;
    console.log("Received brand data:", req.body);

    if (!name) {
      return res.status(400).json({ error: "Brand name is required" });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const now = new Date().toISOString();
    const brandId = uuidv4();

    const brandData = {
      id: brandId,
      name,
      slug,
      description,
      logo,
      created_at: now,
      updated_at: now,
    };
    console.log("Creating brand with data:", brandData);

    realm.write(() => {
      realm.create<BrandSchemaType>("Brand", brandData);
    });

    console.log("Brand created successfully");

    // Unified CORS configuration
    const allowedOrigins = [
      "https://pinpinunshop.netlify.app",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:5173"]
        : []),
    ];

    if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    res.status(201).json({
      message: "Brand created successfully",
      brand: {
        id: brandId,
        _id: brandId, // Add _id for frontend compatibility
        name,
        slug,
        description,
        logo,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({
      error: "Failed to create brand",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update brand
router.put("/:id", async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error("Database not initialized");
    }

    const { id } = req.params;
    const { name, description, logo } = req.body;

    const brand = realm.objectForPrimaryKey<BrandSchemaType>("Brand", id);
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const now = new Date().toISOString();

    realm.write(() => {
      brand.name = name;
      brand.slug = slug;
      brand.description = description;
      brand.logo = logo;
      brand.updated_at = now;
    });

    // Unified CORS configuration
    const allowedOrigins = [
      "https://pinpinunshop.netlify.app",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:5173"]
        : []),
    ];

    if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    res.json({
      message: "Brand updated successfully",
      brand: {
        id: brand.id,
        _id: brand.id, // Add _id for frontend compatibility
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logo: brand.logo,
        created_at: brand.created_at,
        updated_at: brand.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating brand:", error);
    res.status(500).json({
      error: "Failed to update brand",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Delete brand
router.delete("/:id", async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error("Database not initialized");
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    console.log("Attempting to delete brand with ID:", id);
    const brand = realm.objectForPrimaryKey<BrandSchemaType>("Brand", id);

    if (!brand) {
      console.log("Brand not found with ID:", id);
      return res.status(404).json({ error: "Brand not found" });
    }

    realm.write(() => {
      realm.delete(brand);
    });

    console.log("Brand deleted successfully");
    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ error: "Failed to delete brand" });
  }
});

export default router;
