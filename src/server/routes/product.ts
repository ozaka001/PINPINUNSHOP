import express from "express";
import { getAllProducts, createProduct, updateProduct, deleteProduct, getProductById } from "../database/db.js";

const router = express.Router();

// GET /api/products
router.get("/", async (req, res) => {
  try {
    console.log('Fetching all products from Realm...');
    const products = await getAllProducts();
    console.log(`Found ${products.length} products:`, products);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/search
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required." });
    }

    const products = await getAllProducts();
    const searchResults = products.filter(product => 
      product.name.toLowerCase().includes(query.toString().toLowerCase()) ||
      product.description.toLowerCase().includes(query.toString().toLowerCase()) ||
      product.category.toLowerCase().includes(query.toString().toLowerCase())
    );

    res.json(searchResults);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id; // req.params.id is already a string, no need to parse
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  try {
    const productData = req.body;
    // Validate required fields
    const requiredFields = ['name', 'description', 'regularPrice', 'price', 'category', 'image', 'additionalImages'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate numeric fields
    const numericFields = ['regularPrice', 'price', 'stock'];
    const invalidNumericFields = numericFields.filter(field => 
      productData[field] !== undefined && 
      (isNaN(Number(productData[field])) || Number(productData[field]) < 0)
    );

    if (invalidNumericFields.length > 0) {
      return res.status(400).json({ 
        error: `Invalid numeric values for fields: ${invalidNumericFields.join(', ')}` 
      });
    }

    // Validate salePrice if present
    if (productData.salePrice !== undefined && productData.salePrice !== null) {
      if (isNaN(Number(productData.salePrice)) || Number(productData.salePrice) < 0) {
        return res.status(400).json({ error: 'Invalid sale price value' });
      }
    }

    const product = await createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create product" });
    }
  }
});

// PUT /api/products/:id
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id; // req.params.id is already a string, no need to parse
    const productData = req.body;
    const success = await updateProduct(id, productData);
    if (!success) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id; // req.params.id is already a string, no need to parse
    const success = await deleteProduct(id);
    if (!success) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
