import express, { Router } from 'express';
import multer from 'multer';
import {
  createOrder,
  getOrders,
  getOrderByIdController,
  updateOrderStatus,
  uploadOrderSlip
} from '../controllers/orderController.js';
import { auth as authenticateToken } from '../middleware/auth.js';
import { orderModel } from '../models/Order.js';

const router = Router();

// Setup multer for slip image upload
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ที่ 5MB
  }
});

// Protected routes (require authentication)
router.use(authenticateToken);

// Create new order with slip image
router.post('/', upload.single('slip'), createOrder);

// Get all orders (or filter by userId if provided)
router.get('/', getOrders);

// Get order by ID
router.get('/:id', getOrderByIdController);

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the order status
    const updatedOrder = await orderModel.updateOrder(id, { status });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Return a simplified response to avoid circular references
    res.json({
      message: 'Order status updated successfully',
      order: {
        id: updatedOrder._id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: 'Failed to update order status', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update order status', details: 'An unknown error occurred' });
    }
  }
});

router.post('/:id/slip', authenticateToken, upload.single('slip'), uploadOrderSlip);

export default router;
