import express from "express";
import { getAllProducts, createProduct, updateProduct, deleteProduct, getProductById } from "../database/db.js";

// Define the Product interface
interface Product {
  name: string | string[];
  // Add other properties as needed
}

const router = express.Router();

// Other routes remain unchanged...

// GET /api/products/search
router.get("/search", async (req, res) => {
  const queryParam = req.query.q; // Get the search query from the request
  const safeQueryParam = String(req.query.q); // Ensure 'safeQueryParam' is always a string
  if (!safeQueryParam) { // Check if query is undefined
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }
  try {
    const products: Product[] = await getAllProducts(); // Fetch all products
    const filteredProducts = products.filter((product: Product) => {
      if (product && safeQueryParam !== undefined && safeQueryParam !== null) { 
        if (typeof product.name === 'string' || Array.isArray(product.name)) {
          const lowerCaseParam = safeQueryParam.toLowerCase();
          const lowerCasedName = typeof product.name === 'string' ? product.name.toLowerCase() : (Array.isArray(product.name) ? product.name.map((item: string) => item.toLowerCase()) : '');
          if (lowerCaseParam && typeof lowerCaseParam === 'string') {
            return lowerCasedName.includes(lowerCaseParam);
          } else {
            return false;
          }
        } else {
          return false; // Handle case where product.name is not a string or array
        }
      } else {
        return false;
      }
    });
    res.json(filteredProducts);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

export default router;
