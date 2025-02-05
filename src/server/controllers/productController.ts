import { Request, Response } from 'express';
import { ObjectId } from 'bson';
import { 
  getAllProductTypes,
  getAllBrands,
  getAllCategories,
  realm,
  ensureInitialized,
  createProduct as createProductInDB,
  getProductById as getProductByIdInDB
} from '../database/db.js';

export async function getProductTypes(req: Request, res: Response) {
  try {
    const types = await getAllProductTypes();
    res.json(types);
  } catch (error) {
    console.error('Error getting product types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getBrands(req: Request, res: Response) {
  try {
    const brands = await getAllBrands();
    res.json(brands);
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const productData = req.body;
    console.log('Received product data:', productData);

    // Validate required fields
    const requiredFields = ['name', 'description', 'regularPrice', 'price', 'stock', 'category', 'image'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        fields: missingFields 
      });
    }

    await ensureInitialized();
    if (!realm) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    let product;
    realm!.write(() => {
      // First find the brand by name if provided
      let brandId = null;
      if (productData.brandName) {
        const brands = realm!.objects('Brand')
          .filtered('name CONTAINS[c] $0', productData.brandName);
        if (brands.length > 0) {
          brandId = brands[0].id;
          console.log('Found brand:', { id: brandId, name: brands[0].name });
        } else {
          console.log('No brand found for name:', productData.brandName);
        }
      }

      product = realm!.create('Product', {
        id: new ObjectId().toString(),
        name: productData.name,
        description: productData.description,
        regularPrice: parseFloat(productData.regularPrice),
        salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
        category: productData.category,
        type: productData.type || null,  // Use type for other purposes
        brand: brandId, // Store brand ID in brand field
        image: productData.image,
        additionalImages: productData.additionalImages || [],
        colors: productData.colors || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('Updating product:', id, 'with data:', updates);

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Initialize Realm
    await ensureInitialized();
    const realmInstance = await realm!;

    if (!realmInstance) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    // Find the product
    const product = realmInstance.objectForPrimaryKey('Product', id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Format numeric values
    const formattedUpdates = {
      ...updates,
      regularPrice: updates.regularPrice !== undefined ? Number(updates.regularPrice) : undefined,
      salePrice: updates.salePrice !== undefined ? Number(updates.salePrice) : null,
      price: updates.price !== undefined ? Number(updates.price) : undefined,
      stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
      additionalImages: Array.isArray(updates.additionalImages) ? updates.additionalImages : [],
      colors: Array.isArray(updates.colors) ? updates.colors : undefined,
      updated_at: new Date().toISOString()
    };

    // Remove id from updates if it exists to prevent primary key modification
    delete formattedUpdates.id;

    // Validate numeric fields
    const numericFields = ['regularPrice', 'price', 'stock'];
    for (const field of numericFields) {
      if (formattedUpdates[field] !== undefined && isNaN(formattedUpdates[field])) {
        return res.status(400).json({ error: `Invalid ${field}: must be a number` });
      }
    }

    // Validate image data if present
    if (formattedUpdates.image && !formattedUpdates.image.startsWith('data:image')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Validate additional images if present
    if (formattedUpdates.additionalImages) {
      for (const img of formattedUpdates.additionalImages) {
        if (!img.startsWith('data:image')) {
          return res.status(400).json({ error: 'Invalid additional image format' });
        }
      }
    }

    try {
      await new Promise<void>((resolve, reject) => {
        try {
          realmInstance.write(() => {
            Object.assign(product, formattedUpdates);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });

      // Return the updated product
      const updatedProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        price: product.price,
        stock: product.stock,
        category: product.category,
        type: product.type,
        brandName: product.brandName,
        colors: product.colors,
        image: product.image,
        additionalImages: product.additionalImages,
        created_at: product.created_at,
        updated_at: product.updated_at
      };

      console.log('Product updated successfully:', updatedProduct);
      return res.json(updatedProduct);
    } catch (dbError) {
      console.error('Error in database write:', dbError);
      return res.status(500).json({
        error: 'Database write error',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export async function getAllProducts(req: Request, res: Response) {
  try {
    await ensureInitialized();
    if (!realm) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const { brand: brandQuery } = req.query;
    let products = realm!.objects('Product');

    // Log all products and their brand info for debugging
    console.log('All products brand info:', Array.from(products).map(p => ({
      name: p.name,
      type: p.type,
      brand: p.brand
    })));

    // Get brand info
    const brand = realm!.objects('Brand').filtered('id == $0', brandQuery?.toString())[0];
    console.log('Found brand:', brand ? { id: brand.id, name: brand.name } : 'No brand found');

    // Filter by brand if specified
    if (brandQuery) {
      // Log for debugging
      console.log('Filtering by brand ID:', brandQuery);
      console.log('Total products before filter:', products.length);
      
      // Filter products by matching the brand ID in the brand field
      products = products.filtered('brand == $0', brandQuery.toString());
      
      console.log('Total products after filter:', products.length);
      console.log('Filtered products:', Array.from(products).map(p => ({ 
        name: p.name, 
        type: p.type,
        brand: p.brand 
      })));
    }

    const formattedProducts = Array.from(products).map(product => ({
      ...product,
      _id: product.id // Ensure we're returning _id for frontend compatibility
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error getting all products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    await ensureInitialized();
    if (!realm) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
    const { id } = req.params;
    
    const product = await getProductByIdInDB(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error getting product by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    await ensureInitialized();
    if (!realm) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
    const productId = req.params.id;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const realmInstance = realm!;
    const products = realmInstance.objects('Product');
    const productToDelete = products.filtered('id == $0', productId)[0];

    if (!productToDelete) {
      return res.status(404).json({ error: 'Product not found' });
    }

    realmInstance.write(() => {
      realmInstance.delete(productToDelete);
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
