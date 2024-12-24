import express from 'express';
import { ensureInitialized } from '../database/db.js';
import { auth } from '../middleware/auth.js';
import type Realm from 'realm';
import type { Order, User, Product, Activity } from '../../types.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('Getting stats - initializing realm...');
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    console.log('Getting stats - initializing collections...');
    const users = realm.objects<User>('User');
    const products = realm.objects<Product>('Product');
    const orders = realm.objects<Order>('Order');
    
    console.log('Collections initialized:', {
      usersCount: users.length,
      productsCount: products.length,
      ordersCount: orders.length
    });

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    console.log('Filtering recent orders...');
    // Get recent orders, filtered to last 30 days
    const recentOrders = orders.filtered('createdAt >= $0', thirtyDaysAgo)
      .sorted('createdAt', true)
      .slice(0, 5);

    console.log('Recent orders found:', recentOrders.length);

    const stats = {
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      recentOrders: Array.from(recentOrders).map(order => {
        console.log('Processing order:', order);
        return {
          id: order._id.toString(),
          userId: order.userId.toString(),
          totalAmount: order.totalAmount,
          status: order.status || 'pending',
          createdAt: order.createdAt,
          shippingDetails: order.shippingDetails,
          paymentMethod: order.paymentMethod
        };
      }),
      totalRevenue: orders.sum('totalAmount') || 0,
      usersByRole: {
        admin: users.filtered('role == "admin"').length,
        user: users.filtered('role == "user"').length
      }
    };

    console.log('Stats compiled successfully');
    res.json(stats);
  } catch (error) {
    console.error('Error in GET /dashboard/stats:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent orders
router.get('/orders', async (req, res) => {
  try {
    console.log('Getting orders - initializing realm...');
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    console.log('Filtering and sorting orders...');
    const orders = realm.objects<Order>('Order')
      .filtered('createdAt >= $0', thirtyDaysAgo)
      .sorted('createdAt', true)
      .slice(0, 10);

    console.log('Orders found:', orders.length);
    console.log('Sample order:', orders[0]);

    const formattedOrders = Array.from(orders).map(order => {
      console.log('Processing order:', order);
      return {
        id: order._id.toString(),
        userId: order.userId.toString(),
        totalAmount: order.totalAmount,
        status: order.status || 'pending',
        createdAt: order.createdAt,
        shippingDetails: order.shippingDetails,
        paymentMethod: order.paymentMethod
      };
    });
    
    console.log('Orders formatted successfully');
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error in GET /dashboard/orders:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    console.log('Getting activity - initializing realm...');
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    console.log('Getting recent activity...');
    const recentActivity = realm.objects<Activity>('Activity')
      .sorted('timestamp', true)
      .slice(0, 10);

    console.log('Recent activity found:', recentActivity.length);
    res.json(Array.from(recentActivity));
  } catch (error) {
    console.error('Error in GET /dashboard/activity:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get sales analytics
router.get('/sales', async (req, res) => {
  try {
    console.log('Getting sales - initializing realm...');
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const orders = realm.objects<Order>('Order');
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    console.log('Filtering recent orders...');
    // Since createdAt is stored as Date, we can compare directly
    const recentOrders = orders.filtered('createdAt >= $0', thirtyDaysAgo);
    
    console.log('Recent orders found:', recentOrders.length);

    const salesData = Array.from(recentOrders).reduce((acc: any[], order) => {
      console.log('Processing order:', order);
      const date = order.createdAt.toString().split('T')[0];
      const existingEntry = acc.find(entry => entry.date === date);
      if (existingEntry) {
        existingEntry.sales += order.totalAmount;
      } else {
        acc.push({ date, sales: order.totalAmount });
      }
      return acc;
    }, []);

    console.log('Sales data compiled successfully');

    // Sort by date
    salesData.sort((a, b) => a.date.localeCompare(b.date));

    res.json(salesData);
  } catch (error) {
    console.error('Error in GET /dashboard/sales:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get visitor data (mock data since we don't track visitors yet)
router.get('/visitors', async (req, res) => {
  try {
    console.log('Getting visitors - generating mock data...');
    const today = new Date();
    const visitorData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 500) + 100 // Mock data
      };
    }).reverse();

    console.log('Visitor data generated successfully');
    res.json(visitorData);
  } catch (error) {
    console.error('Error in GET /dashboard/visitors:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
