import { Request, Response } from 'express';
import Realm from 'realm';
import { ObjectId } from 'bson';
import { realm, getProductById, updateProduct, getOrderById, ensureInitialized } from '../database/db.js';
import { Order, OrderItem, OrderCreate, ShippingDetails, OrderDTO } from '../../types/order.js';
import { RealmOrder, RealmOrderItem } from '../database/schemas.js';
import { OrderSchemaType, OrderItemSchemaType } from '../database/realmSchema.js';

export interface RealmShippingDetails extends Realm.Object {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  recipientName: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const ShippingDetailsSchema = {
  name: 'ShippingDetails',
  embedded: true,
  properties: {
    address: 'string',
    city: 'string',
    postalCode: 'string',
    country: 'string',
    recipientName: 'string',
    phoneNumber: 'string',
    firstName: 'string',
    lastName: 'string',
    email: 'string',
    phone: 'string'
  }
};

export const OrderSchema = {
  name: 'Order',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    userId: 'string',
    totalAmount: 'double',
    status: 'string',
    items: 'OrderItem[]',
    paymentMethod: 'string',
    slipImage: 'data?',
    shippingDetails: 'ShippingDetails',
    createdAt: 'date',
    updatedAt: 'date'
  }
};

export const OrderItemSchema = {
  name: 'OrderItem',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    order: 'Order',
    productId: 'string',
    quantity: 'int',
    price: 'double',
    selectedColor: 'string?',
    createdAt: 'date',
    updatedAt: 'date'
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    let orderData: OrderCreate;
    
    try {
      // Handle both FormData and JSON requests
      if (typeof req.body.orderData === 'string') {
        orderData = JSON.parse(req.body.orderData);
      } else if (req.body.orderData) {
        orderData = req.body.orderData;
      } else {
        orderData = req.body;
      }
      
      console.log('Parsed order data:', orderData);
    } catch (error) {
      console.error('Error parsing order data:', error);
      return res.status(400).json({ message: 'Invalid order data format' });
    }

    const { userId, totalAmount, shippingDetails, items, paymentMethod } = orderData;
    const slipImage = req.file;

    // Validate required fields first
    if (!userId || !totalAmount || !shippingDetails || !items || !paymentMethod) {
      console.error('Missing required fields:', { userId, totalAmount, shippingDetails, items, paymentMethod });
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          hasUserId: !!userId,
          hasTotalAmount: !!totalAmount,
          hasShippingDetails: !!shippingDetails,
          hasItems: !!items,
          hasPaymentMethod: !!paymentMethod
        }
      });
    }

    // Only validate slip for bank transfer
    if (paymentMethod === 'bank_transfer' && !slipImage) {
      return res.status(400).json({ message: 'Slip image is required for bank transfer' });
    }

    // Validate items stock before creating the order
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product ${product.name}`,
          availableStock: product.stock,
          requestedQuantity: item.quantity
        });
      }
    }

    const orderId = new ObjectId().toString();
    let realmInstance: Realm | null = null;
    realmInstance = await ensureInitialized();
    if (!realmInstance) {
      throw new Error('Realm is not initialized');
    }

    let result!: Order;

    await realmInstance.write(async () => {
      const orderData: Omit<Order, keyof Realm.Object | 'items'> = {
        _id: orderId,
        userId: userId.toString(),
        totalAmount,
        shippingDetails: {
          firstName: shippingDetails.firstName || '',
          lastName: shippingDetails.lastName || '',
          email: shippingDetails.email || '',
          phone: shippingDetails.phone || '',
          address: shippingDetails.address || '',
          city: shippingDetails.city || '',
          postalCode: shippingDetails.postalCode || '',
          country: shippingDetails.country || '',
          recipientName: shippingDetails.recipientName || `${shippingDetails.firstName || ''} ${shippingDetails.lastName || ''}`,
          phoneNumber: shippingDetails.phoneNumber || shippingDetails.phone || ''
        },
        paymentMethod,
        status: 'pending',
        slipImage: slipImage ? new Uint8Array(slipImage.buffer) : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create the order first
      result = realmInstance.create<Order>('Order', {
        ...orderData,
        items: []  // Initialize empty items list
      });

      // Create and add order items
      items.forEach((item) => {
        const orderItem = realmInstance.create<OrderItem>('OrderItem', {
          _id: new ObjectId().toString(),
          order: result,
          productId: new ObjectId(item.productId).toString(),
          quantity: item.quantity,
          price: item.price,
          selectedColor: item.selectedColor,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Add the item to the order's items list
        result.items.push(orderItem);
      });
    });

    // Update product stock after successful order creation
    try {
      for (const item of items) {
        const product = await getProductById(item.productId);
        if (!product) {
          continue; // Skip if product not found (shouldn't happen at this point)
        }

        const updatedStock = product.stock - item.quantity;
        const success = await updateProduct(item.productId, { stock: updatedStock });
        
        if (!success) {
          console.error('Failed to update stock:', {
            productId: item.productId,
            oldStock: product.stock,
            newStock: updatedStock
          });
        }
      }
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }

    // Create a serializable order object without circular references
    const orderResponse = {
      _id: result._id,
      userId: result.userId,
      totalAmount: result.totalAmount,
      status: result.status,
      paymentMethod: result.paymentMethod,
      slipUrl: result.slipImage 
        ? `data:image/png;base64,${Buffer.from(result.slipImage).toString('base64')}` 
        : '',
      shippingDetails: {
        firstName: result.shippingDetails.firstName ? String(result.shippingDetails.firstName) : '',
        lastName: result.shippingDetails.lastName ? String(result.shippingDetails.lastName) : '',
        email: result.shippingDetails.email ? String(result.shippingDetails.email) : '',
        phone: result.shippingDetails.phone ? String(result.shippingDetails.phone) : '',
        address: result.shippingDetails.address ? String(result.shippingDetails.address) : '',
        city: result.shippingDetails.city ? String(result.shippingDetails.city) : '',
        postalCode: result.shippingDetails.postalCode ? String(result.shippingDetails.postalCode) : '',
        country: result.shippingDetails.country ? String(result.shippingDetails.country) : '',
        recipientName: result.shippingDetails.recipientName ? String(result.shippingDetails.recipientName) : '',
        phoneNumber: result.shippingDetails.phoneNumber ? String(result.shippingDetails.phoneNumber) : ''
      },
      items: (Array.isArray(result.items) ? result.items : []).map(item => ({
        _id: String(item._id),
        productId: String(item.productId),
        quantity: Number(item.quantity),
        price: Number(item.price),
        selectedColor: item.selectedColor ? String(item.selectedColor) : undefined,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: new Date(item.updatedAt).toISOString()
      })),
      createdAt: result.createdAt ? new Date(String(result.createdAt)).toISOString() : new Date().toISOString(),
      updatedAt: result.updatedAt ? new Date(String(result.updatedAt)).toISOString() : new Date().toISOString()
    };

    res.status(201).json(orderResponse);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({ message: 'Error creating order', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export async function getOrders(req: Request, res: Response) {
  let realmInstance: Realm | null = null;
  try {
    console.log('Getting orders - starting...');
    
    // Use the ensureInitialized function from db.ts
    realmInstance = await ensureInitialized();
    
    if (!realmInstance) {
      console.error('Failed to initialize Realm');
      return res.status(500).json({ 
        message: 'Database initialization failed',
        error: 'Could not initialize database connection'
      });
    }

    const realm: Realm = realmInstance;

    const { userId } = req.query;
    const query = userId ? `userId == "${userId}"` : 'TRUEPREDICATE';

    // Get orders within a transaction
    const realmOrders = realm.objects('Order').filtered(query);
    
    // Convert to plain objects within the transaction, avoiding circular references
    const orders = await Promise.all(Array.from(realmOrders).map(async (realmOrder) => {
      const order = realmOrder as unknown as OrderSchemaType;
      const plainOrder = {
        _id: String(order._id),
        userId: String(order.userId),
        totalAmount: Number(order.totalAmount),
        status: String(order.status),
        items: await Promise.all(Array.from(order.items || []).map(async (item) => {
          const product = await getProductById(String(item.productId));
          return {
            _id: String(item._id),
            productId: String(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            selectedColor: item.selectedColor ? String(item.selectedColor) : undefined,
            createdAt: new Date(String(item.createdAt)),
            updatedAt: new Date(String(item.updatedAt)),
            title: product?.name || 'Product Not Found',
            image: product?.image || '/placeholder.png'
          };
        })),
        paymentMethod: String(order.paymentMethod),
        slipUrl: order.slipImage 
          ? `data:image/png;base64,${Buffer.from(order.slipImage).toString('base64')}` 
          : '',
        shippingDetails: {
          firstName: order.shippingDetails.firstName ? String(order.shippingDetails.firstName) : '',
          lastName: order.shippingDetails.lastName ? String(order.shippingDetails.lastName) : '',
          email: order.shippingDetails.email ? String(order.shippingDetails.email) : '',
          phone: order.shippingDetails.phone ? String(order.shippingDetails.phone) : '',
          address: order.shippingDetails.address ? String(order.shippingDetails.address) : '',
          city: order.shippingDetails.city ? String(order.shippingDetails.city) : '',
          postalCode: order.shippingDetails.postalCode ? String(order.shippingDetails.postalCode) : '',
          country: order.shippingDetails.country ? String(order.shippingDetails.country) : '',
          recipientName: order.shippingDetails.recipientName ? String(order.shippingDetails.recipientName) : '',
          phoneNumber: order.shippingDetails.phoneNumber ? String(order.shippingDetails.phoneNumber) : ''
        },
        createdAt: new Date(String(order.createdAt)),
        updatedAt: new Date(String(order.updatedAt))
      };
      return plainOrder;
    }));

    // Send the response
    res.json(orders);
  } catch (error) {
    console.error('Error in getOrders:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  } finally {
    // Close the Realm instance in the finally block
    if (realmInstance && !realmInstance.isClosed) {
      realmInstance.close();
    }
  }
};

export const getOrderByIdController = handleGetOrderById;

export async function handleGetOrderById(req: Request, res: Response) {
  try {
    let realmInstance: Realm | null = null;
    realmInstance = await ensureInitialized();
    if (!realmInstance) {
      throw new Error('Realm is not initialized');
    }
    const order = await getOrderById(req.params.id) as unknown as RealmOrder;
    
    if (!order || !order.shippingDetails) {
      return res.status(404).json({ message: 'Order not found or shipping details missing' });
    }
    
    // Convert RealmOrder to regular Order type
    const typedOrder: OrderDTO = {
      _id: order._id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: order.status,
      items: (Array.isArray(order.items) ? order.items : []).map((item: Realm.Object & OrderItemSchemaType) => ({
        _id: String(item._id),
        productId: String(item.productId),
        quantity: Number(item.quantity),
        price: Number(item.price),
        selectedColor: item.selectedColor ? String(item.selectedColor) : undefined,
        createdAt: new Date(String(item.createdAt)),
        updatedAt: new Date(String(item.updatedAt))
      })),
      paymentMethod: String(order.paymentMethod),
      slipUrl: order.slipImage 
        ? `data:image/png;base64,${Buffer.from(order.slipImage).toString('base64')}` 
        : '',
      shippingDetails: {
        firstName: order.shippingDetails.firstName ? String(order.shippingDetails.firstName) : '',
        lastName: order.shippingDetails.lastName ? String(order.shippingDetails.lastName) : '',
        email: order.shippingDetails.email ? String(order.shippingDetails.email) : '',
        phone: order.shippingDetails.phone ? String(order.shippingDetails.phone) : '',
        address: order.shippingDetails.address ? String(order.shippingDetails.address) : '',
        city: order.shippingDetails.city ? String(order.shippingDetails.city) : '',
        postalCode: order.shippingDetails.postalCode ? String(order.shippingDetails.postalCode) : '',
        country: order.shippingDetails.country ? String(order.shippingDetails.country) : '',
        recipientName: order.shippingDetails.recipientName ? String(order.shippingDetails.recipientName) : '',
        phoneNumber: order.shippingDetails.phoneNumber ? String(order.shippingDetails.phoneNumber) : ''
      },
      createdAt: order.createdAt ? new Date(String(order.createdAt)) : new Date(),
      updatedAt: order.updatedAt ? new Date(String(order.updatedAt)) : new Date()
    };
    
    res.json(typedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error fetching order', error: errorMessage });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  let realmInstance: Realm | null = null;
  try {
    realmInstance = await ensureInitialized();
    if (!realmInstance) {
      throw new Error('Realm is not initialized');
    }
    
    const orderId = req.params.orderId;
    const { status } = req.body;
    
    await realmInstance.write(() => {
      const order = realmInstance!.objectForPrimaryKey('Order', orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      order.status = status;
      order.updatedAt = new Date();
    });
    
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Error updating order status', error: errorMessage });
  } finally {
    if (realmInstance && !realmInstance.isClosed) {
      realmInstance.close();
    }
  }
};

export const uploadOrderSlip = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const slipImage = req.file;

    if (!slipImage) {
      return res.status(400).json({ message: 'No slip image provided' });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const realmInstance = await ensureInitialized();
    realmInstance.write(() => {
      // Convert the buffer to Uint8Array
      const imageBuffer = slipImage.buffer instanceof ArrayBuffer 
        ? new Uint8Array(slipImage.buffer)
        : new Uint8Array(Buffer.from(slipImage.buffer));
      
      (order as any).slipImage = imageBuffer;
      order.updatedAt = new Date();
    });

    res.status(200).json({ 
      message: 'Slip image uploaded successfully',
      slipUrl: `data:image/png;base64,${Buffer.from(slipImage.buffer).toString('base64')}`
    });
  } catch (error) {
    console.error('Error uploading slip:', error);
    res.status(500).json({ message: 'Error uploading slip image' });
  }
};
