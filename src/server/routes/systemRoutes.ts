import express from 'express';
import fs from 'fs';
import path from 'path';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Log when routes are registered
console.log('Registering system routes...');

router.get('/export-database', auth, async (req, res) => {
  console.log('Export database route hit');
  try {
    const dbPath = path.resolve('shenshopper.realm');
    console.log('Looking for database at:', dbPath);
    
    if (!fs.existsSync(dbPath)) {
      console.log('Database file not found at:', dbPath);
      return res.status(404).json({ error: 'Database file not found' });
    }

    console.log('Database file found, attempting download');
    res.download(dbPath, `shenshopper-backup-${Date.now()}.realm`, (err) => {
      if (err) {
        console.error('Database export error:', err);
        res.status(500).end();
      }
    });
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: 'Database export failed' });
  }
});

export default router;
