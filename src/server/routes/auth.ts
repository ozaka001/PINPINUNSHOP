import express from "express";
import jwt from "jsonwebtoken";
import { getAllUsers, login, adminLogin } from "../database/db.js";
import type { User, DBUser } from "../../types.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Use the login function from db.ts
    const user = await login(email, password);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return the user object with token (excluding password)
    const { password: _, ...userWithoutPassword } = user as User & { password: string };
    res.json({ ...userWithoutPassword, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to process login" });
  }
});

// POST /api/auth/admin/login
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Use the adminLogin function from db.ts
    const { user, redirectTo } = await adminLogin(username, password);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return the user object with token
    const { password: _, ...userWithoutPassword } = user as User & { password: string };
    res.json({ 
      user: userWithoutPassword, 
      token,
      redirectTo: '/admin/dashboard'
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Failed to process admin login" });
  }
});

export default router;
