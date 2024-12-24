import express from "express";
import { realm, ensureInitialized } from "../database/db.js";
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Protect all wishlist routes
router.use(auth);

// Add database initialization middleware
router.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    res.status(500).json({ error: "Failed to initialize database" });
  }
});

// Get user's wishlist
router.get("/:userId", async (req, res) => {
  try {
    // Check if the requesting user matches the userId parameter
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to access this wishlist" });
    }

    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      return res.status(500).json({ error: "Database is not initialized" });
    }

    const { userId } = req.params;
    const wishlistItems = realmInstance.objects("Wishlist").filtered("userId == $0", userId);
    
    // Get product details for each wishlist item
    const itemsWithProducts = await Promise.all(
      Array.from(wishlistItems).map(async (item: any) => {
        const product = realmInstance.objectForPrimaryKey("Product", String(item.productId));
        if (!product) return null;
        
        return {
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            regularPrice: product.regularPrice,
            salePrice: product.salePrice,
            price: product.price,
            stock: product.stock,
            category: product.category,
            image: product.image,
            additionalImages: product.additionalImages,
            colors: product.colors,
            created_at: product.created_at,
            updated_at: product.updated_at
          },
          added_at: item.created_at
        };
      })
    );

    // Filter out null items (products that no longer exist)
    const validItems = itemsWithProducts.filter(item => item !== null);
    
    return res.json({
      items: validItems,
      totalItems: validItems.length
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// Add item to wishlist
router.post("/:userId", async (req, res) => {
  try {
    // Check if the requesting user matches the userId parameter
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to modify this wishlist" });
    }

    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      return res.status(500).json({ error: "Database is not initialized" });
    }

    const { userId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    console.log('Adding to wishlist - userId:', userId, 'productId:', productId);

    // Check if product exists
    const product = realmInstance.objectForPrimaryKey("Product", String(productId));
    if (!product) {
      console.log('Product not found with ID:', productId);
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if item is already in wishlist
    const existingItem = realmInstance.objectForPrimaryKey("Wishlist", `${userId}-${productId}`);
    if (existingItem) {
      return res.status(409).json({ error: "Item already in wishlist" });
    }

    try {
      realmInstance.beginTransaction();
      realmInstance.create("Wishlist", {
        id: `${userId}-${productId}`,
        userId,
        productId: String(productId),
        created_at: new Date().toISOString()
      });
      realmInstance.commitTransaction();
      return res.status(201).json({ message: "Item added to wishlist" });
    } catch (writeError) {
      console.error('Transaction error:', writeError);
      if (realmInstance.isInTransaction) {
        realmInstance.cancelTransaction();
      }
      throw writeError;
    }
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({ 
      error: "Failed to add item to wishlist",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Remove item from wishlist
router.delete("/:userId/:productId", async (req, res) => {
  try {
    // Check if the requesting user matches the userId parameter
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Not authorized to modify this wishlist" });
    }

    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      return res.status(500).json({ error: "Database is not initialized" });
    }

    const { userId, productId } = req.params;
    const wishlistItem = realmInstance.objectForPrimaryKey("Wishlist", `${userId}-${productId}`);

    if (!wishlistItem) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    realmInstance.write(() => {
      realmInstance.delete(wishlistItem);
    });

    return res.json({ message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({ error: "Failed to remove item from wishlist" });
  }
});

export default router;
