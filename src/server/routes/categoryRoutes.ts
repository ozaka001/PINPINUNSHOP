import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ensureInitialized } from '../database/db.js';
import { CategorySchemaType } from '../database/realmSchema.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public route for getting categories
router.get('/', async (req, res) => {
  try {
    console.log('Getting categories...');
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const categories = realm.objects<CategorySchemaType>('Category');
    console.log('Found categories:', categories.length);
    const formattedCategories = Array.from(categories).map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      created_at: category.created_at,
      updated_at: category.updated_at
    }));

    res.json(formattedCategories);
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Protected routes
router.post('/', auth, async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const category = {
      id: uuidv4(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    realm.write(() => {
      realm.create('Category', category);
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update category
router.put('/:id', auth, async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const category = realm.objectForPrimaryKey<CategorySchemaType>('Category', id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    realm.write(() => {
      category.name = name || category.name;
      category.description = description || category.description;
      category.updated_at = new Date().toISOString();
    });

    res.json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      created_at: category.created_at,
      updated_at: category.updated_at
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { id } = req.params;
    const category = realm.objectForPrimaryKey<CategorySchemaType>('Category', id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    realm.write(() => {
      realm.delete(category);
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
