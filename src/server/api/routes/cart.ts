import express from 'express';
import { ensureInitialized, getCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '../../database/db.js';

const router = express.Router();

// Get cart by user ID
router.get('/:userId', async (req, res) => {
  try {
    await ensureInitialized();
    const cart = await getCart(req.params.userId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/:userId/items', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    await ensureInitialized();
    const cart = await addToCart(req.params.userId, productId, quantity);
    res.json(cart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update item quantity
router.put('/:userId/items/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    await ensureInitialized();
    const cart = await updateCartItemQuantity(req.params.userId, req.params.productId, quantity);
    res.json(cart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/:userId/items/:productId', async (req, res) => {
  try {
    await ensureInitialized();
    const cart = await removeFromCart(req.params.userId, req.params.productId);
    res.json(cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/:userId', async (req, res) => {
  try {
    await ensureInitialized();
    await clearCart(req.params.userId);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
