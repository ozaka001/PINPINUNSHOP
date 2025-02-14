import express from "express";
import { ObjectId } from "bson";
import { Realm } from "realm";
import { realm, ensureInitialized, addToCart } from "../database/db.js";
import { Cart, CartItem } from "../types/cart.js";
import { Product } from "../types/product.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Protect all cart routes
router.use(auth);

// Add database initialization middleware with better error handling
router.use(async (req, res, next) => {
  try {
    console.log("Initializing database connection...");
    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      console.error(
        "Database initialization failed - no realm instance returned"
      );
      return res.status(500).json({ error: "Failed to initialize database" });
    }
    console.log("Database initialization successful");
    next();
  } catch (error) {
    console.error("Database initialization error:", error);
    res.status(500).json({
      error: "Failed to initialize database",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all carts
router.get("/", async (req, res) => {
  try {
    if (!realm) {
      return res.status(500).json({ error: "Database is not initialized" });
    }

    try {
      const realmInstance = realm;
      const carts = realmInstance.objects<Cart>("Cart");

      // Map cart items to include product details for each cart
      const cartsWithDetails = Array.from(carts).map((cart) => {
        const cartItems = realmInstance
          .objects<CartItem>("CartItem")
          .filtered("cart._id == $0", cart._id);
        const items = Array.from(cartItems)
          .map((item: CartItem) => {
            const product = realmInstance.objectForPrimaryKey<Product>(
              "Product",
              item.productId
            );
            if (!product) {
              console.warn(`Product with ID ${item.productId} not found`);
              return null;
            }
            return {
              _id: item._id,
              product: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
              },
              quantity: item.quantity,
              selectedColor: item.selectedColor || null,
              createdAt: item.createdAt,
            };
          })
          .filter((item) => item !== null);

        return {
          _id: cart._id,
          userId: cart.userId,
          items: items,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        };
      });

      res.json(cartsWithDetails);
    } catch (error: any) {
      console.error("Error fetching carts:", error);
      res.status(500).json({
        error: "Failed to fetch carts",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error: any) {
    console.error("Error initializing Realm:", error);
    res.status(500).json({
      error: "Failed to initialize Realm",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get user's cart
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Starting cart fetch for user:", userId);

    // Ensure database is initialized
    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      console.error("Database not initialized when fetching cart");
      return res.status(500).json({ error: "Database is not initialized" });
    }

    console.log(`Attempting to find cart for user ${userId}`);
    let cart;
    try {
      cart = realmInstance
        .objects<Cart>("Cart")
        .filtered("userId == $0", userId)[0];
      console.log("Cart query result:", cart ? "Found cart" : "No cart found");
    } catch (queryError) {
      console.error("Error querying cart:", queryError);
      return res.status(500).json({
        error: "Failed to query cart",
        details:
          queryError instanceof Error ? queryError.message : "Unknown error",
      });
    }

    if (!cart) {
      console.log(`Creating new cart for user ${userId}`);
      try {
        cart = realmInstance.write(() => {
          const newCart = realmInstance.create<Cart>("Cart", {
            _id: new ObjectId().toString(),
            userId: userId,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log("Created new cart:", newCart);
          return newCart;
        });

        if (!cart) {
          console.error("Failed to create cart - cart is null after creation");
          throw new Error("Failed to create cart");
        }

        console.log("New cart created successfully:", cart);
        return res.json({
          cart: {
            _id: cart._id,
            userId: cart.userId,
            items: [],
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
          },
        });
      } catch (writeError) {
        console.error("Error creating new cart:", writeError);
        return res.status(500).json({
          error: "Failed to create new cart",
          details:
            writeError instanceof Error ? writeError.message : "Unknown error",
        });
      }
    }

    console.log(`Found existing cart for user ${userId}, fetching items`);
    try {
      // Get CartItem objects for this cart
      const cartItems = realmInstance
        .objects<CartItem>("CartItem")
        .filtered("cart._id == $0", cart._id);
      console.log(`Found ${cartItems.length} items in cart`);

      const items = Array.from(cartItems)
        .map((item: CartItem) => {
          try {
            const product = realmInstance.objectForPrimaryKey<Product>(
              "Product",
              item.productId
            );
            if (!product) {
              console.warn(
                `Product not found for cart item: ${item.productId}`
              );
              return null;
            }

            console.log("Processing cart item:", {
              itemId: item._id,
              productId: item.productId,
              productName: product.name,
              quantity: item.quantity,
              selectedColor: item.selectedColor,
            });

            return {
              _id: item._id,
              product: {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image,
                category: product.category,
                stock: product.stock,
              },
              quantity: item.quantity,
              selectedColor: item.selectedColor,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };
          } catch (itemError) {
            console.error(`Error processing cart item ${item._id}:`, itemError);
            return null;
          }
        })
        .filter((item) => item !== null);

      console.log(
        `Successfully processed ${items.length} valid cart items:`,
        items
      );

      const response = {
        cart: {
          _id: cart._id,
          userId: cart.userId,
          items: items,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        },
      };

      console.log("Sending cart response:", response);
      return res.json(response);
    } catch (itemsError) {
      console.error("Error fetching cart items:", itemsError);
      return res.status(500).json({
        error: "Failed to fetch cart items",
        details:
          itemsError instanceof Error ? itemsError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error in cart route:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Add item to cart
router.post("/:userId/items", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1, selectedColor } = req.body;

    console.log(
      "Adding to cart - User:",
      userId,
      "Product:",
      productId,
      "Quantity:",
      quantity,
      "Color:",
      selectedColor
    );

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    try {
      // Ensure realm is initialized
      const realmInstance = await ensureInitialized();

      // Check if product exists first
      const product = realmInstance.objectForPrimaryKey("Product", productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      try {
        const result = await addToCart(
          userId,
          productId,
          quantity,
          selectedColor
        );
        console.log("Successfully added to cart");
        res.json(result);
      } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({
          error: "Failed to add item to cart",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error initializing Realm:", error);
      res.status(500).json({
        error: "Failed to initialize Realm",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Cart add error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update cart item quantity
router.put("/:userId/items/:itemId", async (req, res) => {
  try {
    const realmInstance = realm;
    if (!realmInstance) {
      return res.status(500).json({ error: "Database is not initialized" });
    }

    const { itemId, userId } = req.params;
    const { quantity } = req.body;

    realmInstance.write(() => {
      const cartItem = realmInstance.objectForPrimaryKey<CartItem>(
        "CartItem",
        itemId
      );
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      // Verify that the cart item belongs to the user's cart
      if (cartItem.cart.userId !== userId) {
        return res
          .status(403)
          .json({
            error: "Unauthorized: Cart item does not belong to this user",
          });
      }

      cartItem.quantity = quantity;
      cartItem.updatedAt = new Date();
      cartItem.cart.updatedAt = new Date();
    });

    return res.json({ message: "Cart item updated" });
  } catch (error: any) {
    console.error("Error updating cart item:", error);
    return res.status(500).json({
      error: "Failed to update cart item",
      details: error.message,
    });
  }
});

// Delete item from cart
router.delete("/:userId/items/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { selectedColor, itemId } = req.body;

    console.log("Deleting cart item:", {
      userId,
      productId,
      selectedColor,
      itemId,
    });

    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      return res.status(500).json({ error: "Database is not initialized" });
    }

    let cart = realmInstance
      .objects<Cart>("Cart")
      .filtered("userId == $0", userId)[0];
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    try {
      await realmInstance.write(async () => {
        // Find the specific item to delete using itemId
        if (itemId) {
          const itemToDelete = realmInstance.objectForPrimaryKey<CartItem>(
            "CartItem",
            itemId
          );
          if (itemToDelete) {
            console.log("Deleting specific cart item:", itemId);
            realmInstance.delete(itemToDelete);
          }
        } else {
          // If no itemId, find by productId and selectedColor
          const itemsToDelete = realmInstance
            .objects<CartItem>("CartItem")
            .filtered(
              "cart._id == $0 AND productId == $1 AND selectedColor == $2",
              cart._id,
              productId,
              selectedColor || null
            );

          console.log(`Found ${itemsToDelete.length} items to delete`);
          realmInstance.delete(itemsToDelete);
        }

        cart.updatedAt = new Date();
      });

      // Get updated cart items
      const cartItems = realmInstance
        .objects<CartItem>("CartItem")
        .filtered("cart._id == $0", cart._id);

      // Prepare response with updated cart data
      const items = Array.from(cartItems)
        .map((item: CartItem) => {
          const product = realmInstance.objectForPrimaryKey<Product>(
            "Product",
            item.productId
          );
          if (!product) return null;

          return {
            _id: item._id,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
            },
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        })
        .filter(Boolean);

      console.log("Sending updated cart data:", { itemCount: items.length });

      res.json({
        cart: {
          _id: cart._id,
          userId: cart.userId,
          items: items,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error deleting cart item:", error);
      return res.status(500).json({
        error: "Failed to delete cart item",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error in delete cart item route:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Clear cart
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      return res.status(500).json({ error: "Database not initialized" });
    }

    await realmInstance.write(async () => {
      const cart = realmInstance
        .objects<Cart>("Cart")
        .filtered("userId == $0", userId)[0];

      if (!cart) {
        return; // Don't send response here, let it fall through
      }

      const cartItems = realmInstance
        .objects<CartItem>("CartItem")
        .filtered("cart._id == $0", cart._id);
      realmInstance.delete(cartItems);
      realmInstance.delete(cart);
    });

    return res.json({ message: "Cart cleared" });
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({
      error: "Failed to clear cart",
      details: error.message,
    });
  }
});

export default router;
