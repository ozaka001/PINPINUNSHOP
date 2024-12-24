import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ensureInitialized } from '../database/db.js';
import { BrandSchemaType } from '../database/realmSchema.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Add database initialization middleware
router.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Public route for fetching brands
router.get('/public', async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const brands = realm.objects<BrandSchemaType>('Brand');
    const formattedBrands = Array.from(brands).map(brand => ({
      _id: brand.id,
      name: brand.name,
      logo: brand.logo || '',
      description: brand.description || ''
    }));

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.json(formattedBrands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Protected routes below this middleware
router.use(auth);

// Create new brand
router.post('/', async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { name, description, logo } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const now = new Date().toISOString();
    const brandId = uuidv4();

    realm.write(() => {
      realm.create('Brand', {
        id: brandId,
        name,
        slug,
        description,
        logo,
        created_at: now,
        updated_at: now
      });
    });

    res.status(201).json({ 
      message: 'Brand created successfully',
      brand: {
        id: brandId,
        name,
        slug,
        description,
        logo,
        created_at: now,
        updated_at: now
      }
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ 
      error: 'Failed to create brand',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update brand
router.put('/:id', async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { id } = req.params;
    const { name, description, logo } = req.body;
    
    const brand = realm.objectForPrimaryKey<BrandSchemaType>('Brand', id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const now = new Date().toISOString();
    
    realm.write(() => {
      brand.name = name;
      brand.slug = slug;
      brand.description = description;
      brand.logo = logo;
      brand.updated_at = now;
    });
    
    res.json({ 
      message: 'Brand updated successfully',
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logo: brand.logo,
        created_at: brand.created_at,
        updated_at: brand.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ 
      error: 'Failed to update brand',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { id } = req.params;
    
    const brand = realm.objectForPrimaryKey('Brand', id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    realm.write(() => {
      realm.delete(brand);
    });
    
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ 
      error: 'Failed to delete brand',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
