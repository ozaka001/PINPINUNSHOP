import type { DashboardStats, Order, SalesData, VisitorData } from '../types.js';

const API_BASE_URL = process.env.VITE_API_BASE_URL;

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      orderCount: 0,
      totalProducts: 0,
      totalUsers: 0,
      totalRevenue: 0,
      recentOrders: [],
      salesData: [],
      visitorData: [],
      increases: {
        orders: 0,
        products: 0,
        users: 0,
        revenue: 0
      }
    };
  }
}

export async function getRecentOrders(limit: number = 5): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/orders?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent orders');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
}

export async function getSalesData(days: number = 7): Promise<SalesData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/sales?days=${days}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sales data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
}

export async function getVisitorData(days: number = 7): Promise<VisitorData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/visitors?days=${days}`);
    if (!response.ok) {
      throw new Error('Failed to fetch visitor data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching visitor data:', error);
    return [];
  }
}
