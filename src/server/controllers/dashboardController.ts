import { Request, Response } from 'express';
import { getDashboardStats, getRecentOrders, getSalesData, getVisitorData, trackVisitor } from '../database/dashboard.js';

export const getDashboardStatsHandler = async (req: Request, res: Response) => {
  try {
    console.log('Getting dashboard stats...');
    const [stats, visitorData] = await Promise.all([
      getDashboardStats(),
      getVisitorData()
    ]);

    // Track the current visit
    await trackVisitor(
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      ...stats,
      visitorData
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecentOrdersHandler = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const orders = await getRecentOrders(limit);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSalesDataHandler = async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 7;
    const salesData = await getSalesData(days);
    res.json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVisitorDataHandler = async (req: Request, res: Response) => {
  try {
    const visitorData = await getVisitorData();
    res.json(visitorData);
  } catch (error) {
    console.error('Error fetching visitor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
