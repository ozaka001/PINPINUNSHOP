import express from "express";
import { updateCartItemQuantity } from "../server/database/db.js"; // Adjust path if needed

const router = express.Router();

router.put("/api/carts/:cartId/items/:productId", async (req, res) => {
  // ...existing middleware such as authentication...
  try {
    const { cartId, productId } = req.params;
    const { quantity, userId } = req.body;
    if (!userId || typeof quantity !== "number") {
      return res
        .status(400)
        .json({ error: "userId and numeric quantity required" });
    }

    const updatedCart = await updateCartItemQuantity(
      userId,
      cartId,
      productId,
      quantity
    );
    return res.json(updatedCart);
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return res
      .status(500)
      .json({ error: "Failed to update cart item quantity" });
  }
});

export default router;
