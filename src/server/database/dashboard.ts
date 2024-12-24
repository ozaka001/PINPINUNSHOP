import Realm from 'realm';
import { ObjectId } from 'bson';
import { ensureInitialized } from './db.js';
import { RealmOrder } from './schemas.js';

interface Order {
  _id: string;
  userId: string;
  totalAmount: number;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  items: Realm.List<{
    _id: string;
    productId: string;
    quantity: number;
    price: number;
    selectedColor?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  paymentMethod: string;
  status: string;
  slipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Visitor {
  _id: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export async function getDashboardStats() {
  const realm = await ensureInitialized();
  try {
    console.log('Fetching stats from database...');
    const users = realm.objects('User');
    const products = realm.objects('Product');
    const orders = realm.objects<RealmOrder>('Order').sorted('createdAt', true);

    // Calculate increases based on last week's data
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);

    // Get orders from last week
    const lastWeekOrders = orders.filtered('createdAt >= $0 && createdAt < $1', lastWeek, now);
    const previousWeekOrders = orders.filtered('createdAt >= $0 && createdAt < $1', 
      new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000), lastWeek);

    // Calculate increases
    const currentRevenue = lastWeekOrders.sum('totalAmount') || 0;
    const previousRevenue = previousWeekOrders.sum('totalAmount') || 0;
    const revenueIncrease = previousRevenue === 0 ? 0 : 
      ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    const currentOrderCount = lastWeekOrders.length;
    const previousOrderCount = previousWeekOrders.length;
    const orderIncrease = previousOrderCount === 0 ? 0 : 
      ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100;

    // Calculate product and user increases
    const lastWeekUsers = users.filtered('created_at >= $0 && created_at < $1', lastWeek, now);
    const previousWeekUsers = users.filtered('created_at >= $0 && created_at < $1', 
      new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000), lastWeek);
    const userIncrease = previousWeekUsers.length === 0 ? 0 : 
      ((lastWeekUsers.length - previousWeekUsers.length) / previousWeekUsers.length) * 100;

    const lastWeekProducts = products.filtered('created_at >= $0 && created_at < $1', lastWeek, now);
    const previousWeekProducts = products.filtered('created_at >= $0 && created_at < $1', 
      new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000), lastWeek);
    const productIncrease = previousWeekProducts.length === 0 ? 0 : 
      ((lastWeekProducts.length - previousWeekProducts.length) / previousWeekProducts.length) * 100;

    const stats = {
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: orders.sum('totalAmount') || 0,
      recentOrders: Array.from(orders.slice(0, 5)),
      increases: {
        revenue: Number(revenueIncrease.toFixed(1)),
        orders: Number(orderIncrease.toFixed(1)),
        users: Number(userIncrease.toFixed(1)),
        products: Number(productIncrease.toFixed(1))
      }
    };

    console.log('Final stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export async function getRecentOrders(limit: number = 5) {
  const realm = await ensureInitialized();
  try {
    const orders = realm.objects<RealmOrder>('Order').sorted('createdAt', true);
    return Array.from(orders.slice(0, limit));
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
}

export async function getSalesData(days: number = 7) {
  const realm = await ensureInitialized();
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);

    const orders = realm.objects<RealmOrder>('Order')
      .filtered('createdAt >= $0', startDate)
      .sorted('createdAt');

    // Group orders by date
    const salesByDate = new Map();
    orders.forEach((order) => {
      const typedOrder = order as unknown as RealmOrder;
      const date = typedOrder.createdAt.toISOString().split('T')[0];
      const existing = salesByDate.get(date) || { total: 0, count: 0 };
      salesByDate.set(date, {
        total: existing.total + typedOrder.totalAmount,
        count: existing.count + 1
      });
    });

    // Convert to array format
    return Array.from(salesByDate.entries()).map(([date, data]) => ({
      date,
      total: data.total,
      count: data.count
    }));
  } catch (error) {
    console.error('Error fetching sales data:', error);
    throw error;
  }
}

export async function getVisitorData(days: number = 7) {
  const realm = await ensureInitialized();
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const visitors = realm.objects<Visitor>('Visitor')
      .filtered('timestamp >= $0 && timestamp <= $1', startDate, now)
      .sorted('timestamp');

    // Group visitors by date
    const visitorsByDate = new Map<string, number>();
    
    // Initialize all dates with 0 visitors
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      visitorsByDate.set(dateStr, 0);
    }

    // Count visitors for each date
    visitors.forEach((visitor: Visitor) => {
      const dateStr = new Date(visitor.timestamp).toISOString().split('T')[0];
      const currentCount = visitorsByDate.get(dateStr) || 0;
      visitorsByDate.set(dateStr, currentCount + 1);
    });

    // Convert to array format
    return Array.from(visitorsByDate.entries()).map(([date, visitors]) => ({
      date,
      visitors
    }));
  } catch (error) {
    console.error('Error getting visitor data:', error);
    return [];
  }
}

export async function trackVisitor(ipAddress?: string, userAgent?: string) {
  const realm = await ensureInitialized();
  try {
    realm.write(() => {
      realm.create('Visitor', {
        _id: new ObjectId(),
        timestamp: new Date(),
        ipAddress,
        userAgent
      });
    });
  } catch (error) {
    console.error('Error tracking visitor:', error);
  }
}
