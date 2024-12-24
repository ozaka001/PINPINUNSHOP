import { Request, Response } from 'express';
import Realm from 'realm';
import slugify from 'slugify';
import { realm } from '../database/db.js';
import { ProductType, ProductTypeDocument } from '../models/productType.js';

// Get all product types
export const getAllProductTypes = async (req: Request, res: Response) => {
  try {
    if (!realm) {
      return res.status(500).json({ message: 'Realm is not initialized' });
    }
    const productTypes = realm!.objects<ProductTypeDocument>('ProductType').sorted('name');
    res.json(Array.from(productTypes));
  } catch (error) {
    console.error('Error fetching product types:', error);
    res.status(500).json({ message: 'Error fetching product types' });
  }
};

// Get single product type
export const getProductType = async (req: Request, res: Response) => {
  try {
    if (!realm) {
      return res.status(500).json({ message: 'Realm is not initialized' });
    }
    const { id } = req.params;
    const productType = realm!.objectForPrimaryKey<ProductTypeDocument>('ProductType', new Realm.BSON.ObjectId(id));
    
    if (!productType) {
      return res.status(404).json({ message: 'Product type not found' });
    }
    
    res.json(productType);
  } catch (error) {
    console.error('Error fetching product type:', error);
    res.status(500).json({ message: 'Error fetching product type' });
  }
};

// Create product type
export const createProductType = async (req: Request, res: Response) => {
  try {
    if (!realm) {
      return res.status(500).json({ message: 'Database realm is not initialized' });
    }
    const { name, description } = req.body;
    const _id = new Realm.BSON.ObjectId();
    const now = new Date();

    realm!.write(() => {
      const productType = realm!.create<ProductTypeDocument>('ProductType', {
        _id,
        name,
        slug: slugify(name, { lower: true }),
        description,
        created_at: now,
        updated_at: now
      });
      res.status(201).json(productType);
    });
  } catch (error) {
    console.error('Error creating product type:', error);
    res.status(500).json({ message: 'Error creating product type' });
  }
};

// Update product type
export const updateProductType = async (req: Request, res: Response) => {
  try {
    if (!realm) {
      return res.status(500).json({ message: 'Database realm is not initialized' });
    }
    const { id } = req.params;
    const { name, description } = req.body;

    realm!.write(() => {
      const productType = realm!.objectForPrimaryKey<ProductTypeDocument>('ProductType', new Realm.BSON.ObjectId(id));
      if (!productType) {
        return res.status(404).json({ message: 'Product type not found' });
      }

      productType.name = name;
      productType.slug = slugify(name, { lower: true });
      productType.description = description;
      productType.updated_at = new Date();

      res.json(productType);
    });
  } catch (error) {
    console.error('Error updating product type:', error);
    res.status(500).json({ message: 'Error updating product type' });
  }
};

// Delete product type
export const deleteProductType = async (req: Request, res: Response) => {
  try {
    if (!realm) {
      return res.status(500).json({ message: 'Database realm is not initialized' });
    }
    const { id } = req.params;

    realm!.write(() => {
      const productType = realm!.objectForPrimaryKey<ProductTypeDocument>('ProductType', new Realm.BSON.ObjectId(id));
      if (!productType) {
        return res.status(404).json({ message: 'Product type not found' });
      }
      realm!.delete(productType);
      res.json({ message: 'Product type deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting product type:', error);
    res.status(500).json({ message: 'Error deleting product type' });
  }
};
