// Server-side only imports
if (typeof window !== "undefined") {
  throw new Error(
    "This module is server-side only and cannot be imported in the browser"
  );
}

import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";
import Realm from "realm";
import { ObjectId } from "bson";
import { v4 as uuidv4 } from "uuid";
import type {
  User,
  Product,
  VisitorData,
  SalesData,
  DashboardStats,
  UserCreate,
  DBUser,
} from "../../types.js";
import { Order, OrderItem, ShippingDetails } from "../models/Order.js";
import {
  UserSchema,
  ProductSchema,
  OrderSchema,
  OrderItemSchema,
  WishlistSchema,
  CartSchema,
  CartItemSchema,
  ProductTypeSchema,
  BrandSchema,
  CategorySchema,
  ShippingDetailsSchema,
  MessageSchema, // Import MessageSchema
  VisitorSchema, // Import VisitorSchema
  ReviewSchema, // Import ReviewSchema
} from "./realmSchema.js";
import bcrypt from "bcrypt";
import slugify from "slugify";
import { RealmOrderItem } from "./schemas.js"; // Import RealmOrderItem

let realm: Realm | null = null;
let initializationPromise: Promise<Realm> | null = null;
let isClosing = false;

// Add cleanup handler for graceful shutdown
process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});

async function cleanup() {
  isClosing = true;
  if (realm && !realm.isClosed) {
    console.log("Closing Realm instance...");
    realm.close();
  }
}

async function initRealm(): Promise<Realm> {
  try {
    console.log("Initializing Realm...");
    if (realm) {
      if (realm.isClosed || isClosing) {
        console.log(
          "Existing Realm instance is closed or closing, creating new instance"
        );
        realm = null;
      } else {
        console.log("Using existing Realm instance");
        return realm;
      }
    }

    console.log("Opening new Realm instance...");
    const newRealm = await Realm.open({
      schema: [
        UserSchema,
        ProductSchema,
        OrderSchema,
        OrderItemSchema,
        WishlistSchema,
        CartSchema,
        CartItemSchema,
        ProductTypeSchema,
        BrandSchema,
        CategorySchema,
        ShippingDetailsSchema,
        MessageSchema,
        VisitorSchema,
        ReviewSchema,
      ],
      path: "shenshopper.realm",
      schemaVersion: 1,
      onMigration: (oldRealm, newRealm) => {
        console.log("Running migration...");
        const oldOrders = oldRealm.objects("Order");
        const newOrders = newRealm.objects("Order");

        for (let i = 0; i < oldOrders.length; i++) {
          const oldOrder = oldOrders[i] as unknown as {
            items?: Realm.List<any>;
          };
          const newOrder = newOrders[i] as any;

          if (!newOrder.items) {
            newOrder.items = [];
          }

          if (oldOrder.items) {
            const itemsArray = oldOrder.items.toJSON
              ? oldOrder.items.toJSON()
              : Array.prototype.slice.call(oldOrder.items);
            for (const item of itemsArray) {
              newOrder.items.push(item);
            }
          }
        }
        console.log("Migration completed successfully");
      },
    });

    // Only set the global realm if another initialization hasn't happened
    if (!realm && !isClosing) {
      realm = newRealm;
    } else if (newRealm) {
      // If we can't use this instance, close it
      newRealm.close();
    }

    console.log("Realm initialized successfully");
    return realm || newRealm;
  } catch (error) {
    console.error("Error initializing Realm:", error);
    realm = null;
    throw error;
  }
}

async function ensureInitialized(): Promise<Realm> {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < maxRetries) {
    try {
      if (isClosing) {
        throw new Error("Database is shutting down");
      }

      if (!realm || realm.isClosed) {
        console.log("Realm not initialized or closed, initializing...");
        if (!initializationPromise) {
          console.log("Starting new Realm initialization...");
          initializationPromise = initRealm();
        } else {
          console.log("Waiting for existing initialization...");
        }

        try {
          realm = await initializationPromise;
        } finally {
          // Clear the promise regardless of success/failure
          initializationPromise = null;
        }
      }

      // Verify the instance is still valid
      if (!realm || realm.isClosed || isClosing) {
        throw new Error("Realm instance is invalid or closing");
      }

      return realm;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `Realm initialization attempt ${retryCount + 1} failed:`,
        error
      );
      retryCount++;

      if (retryCount === maxRetries) {
        console.error("All retry attempts failed");
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
    }
  }

  throw (
    lastError || new Error("Failed to initialize Realm after maximum retries")
  );
}

// Create admin user if it doesn't exist
async function createAdminIfNotExists() {
  try {
    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      throw new Error("Failed to get Realm instance");
    }

    const adminUser = realmInstance
      .objects("User")
      .filtered('role = "admin"')[0];
    if (!adminUser) {
      realmInstance.write(() => {
        realmInstance.create("User", {
          id: new ObjectId().toString(),
          username: "admin",
          password: bcrypt.hashSync("admin123", 10),
          email: "admin@example.com",
          role: "admin",
          firstName: "Admin",
          lastName: "User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
      console.log("Admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating/updating admin user:", error);
    // Don't throw the error as this is not critical for system operation
  }
}

// Initialize Realm and create admin user
let initializationComplete = false;

export async function initializeDatabase() {
  if (initializationComplete) {
    return;
  }

  try {
    console.log("Starting server-side Realm initialization...");
    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      throw new Error("Failed to initialize Realm");
    }

    await createAdminIfNotExists();
    initializationComplete = true;
    console.log("Realm database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// User-related functions
async function getAllUsers(
  page: number = 1,
  pageSize: number = 10
): Promise<{ users: User[]; total: number }> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before getting users...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Fetching all users from Realm...");
    const users = realm.objects("User").sorted("username");
    console.log(`Found ${users.length} users`);

    // Convert Realm objects to plain objects and map them
    const allUsers = Array.from(users).map((user) => mapRealmUserToUser(user));
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      total: allUsers.length,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return { users: [], total: 0 };
  }
}

// Helper function to map Realm user object to User interface
function mapRealmUserToUser(user: any): User {
  return {
    id: String(user.id),
    username: String(user.username),
    role: user.role as "user" | "admin",
    firstName: String(user.firstName),
    lastName: String(user.lastName),
    email: String(user.email),
    phone: user.phone ? String(user.phone) : undefined,
    address: user.address ? String(user.address) : undefined,
    city: user.city ? String(user.city) : undefined,
    postalCode: user.postalCode ? String(user.postalCode) : undefined,
    imageProfile: user.imageProfile,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
  };
}

async function getUser(id: string): Promise<DBUser | null> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before getting user...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Fetching user from Realm...");
    const user = realm.objectForPrimaryKey("User", id);
    console.log(`Found user with ID ${id}: ${!!user}`);
    if (!user) return null;
    const mappedUser = mapRealmUserToUser(user);
    return {
      ...mappedUser,
      password: user.password as string,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
}

async function getUserByUsername(username: string): Promise<DBUser | null> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before getting user...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Fetching user by username from Realm...");
    const users = realm.objects("User").filtered("username == $0", username);
    console.log(`Found ${users.length} users with username ${username}`);
    if (users.length === 0) return null;
    const mappedUser = mapRealmUserToUser(users[0]);
    return {
      ...mappedUser,
      password: users[0].password as string,
    };
  } catch (error) {
    console.error("Error fetching user by username:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
}

async function getUserByEmail(email: string): Promise<DBUser | null> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before getting user...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Fetching user by email from Realm...");
    const users = realm.objects("User").filtered("email == $0", email);
    console.log(`Found ${users.length} users with email ${email}`);
    if (users.length === 0) return null;
    const mappedUser = mapRealmUserToUser(users[0]);
    return {
      ...mappedUser,
      password: users[0].password as string,
    };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
}

async function createUser(userData: UserCreate): Promise<DBUser> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before creating user...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Checking for existing email:", userData.email);
    const usersWithEmail = realm
      .objects("User")
      .filtered("email == $0", userData.email);
    console.log(
      `Found ${usersWithEmail.length} users with email ${userData.email}`
    );

    if (usersWithEmail.length > 0) {
      console.error("Email already exists:", userData.email);
      throw new Error("A user with this email already exists");
    }

    console.log("Creating new user in Realm...");
    const newUser: DBUser = {
      id: uuidv4(),
      ...userData,
      role: userData.role || "user", // Set default role if not provided
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    realm.write(() => {
      console.log("Writing new user to Realm...");
      realm!.create("User", newUser);
    });

    console.log("User created successfully");
    return {
      ...newUser,
      password: newUser.password as string,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

async function updateUser(
  id: string,
  userData: Partial<DBUser>
): Promise<DBUser | null> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before updating user...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Updating user in Realm...");
    const user = realm.objectForPrimaryKey("User", id);
    if (!user) return null;

    realm.write(() => {
      console.log("Writing updated user to Realm...");
      Object.assign(user, {
        ...userData,
        updated_at: new Date().toISOString(),
      });
    });

    console.log("User updated successfully");
    const mappedUser = mapRealmUserToUser(user);
    return {
      ...mappedUser,
      password: user.password as string,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
}

async function deleteUser(id: string): Promise<boolean> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before deleting user...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Deleting user from Realm...");
    const user = realm.objectForPrimaryKey("User", id);
    if (!user) return false;

    realm.write(() => {
      console.log("Deleting user from Realm...");
      realm!.delete(user);
    });

    console.log("User deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}

async function login(email: string, password: string): Promise<DBUser | null> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before logging in...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Logging in user...");
    const user = realm
      .objects("User")
      .filtered("email == $0 AND password == $1", email, password)[0];
    console.log(`Found user with email ${email}: ${!!user}`);
    if (!user) return null;
    const mappedUser = mapRealmUserToUser(user);
    return {
      ...mappedUser,
      password: user.password as string,
    };
  } catch (error) {
    console.error("Error during login:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
}

async function adminLogin(
  username: string,
  password: string
): Promise<{ user: User | null; redirectTo?: string }> {
  return new Promise(async (resolve) => {
    try {
      await ensureInitialized();
      if (!username || typeof username !== "string") {
        console.log("Invalid username type provided");
        return resolve({ user: null });
      }

      if (!realm) {
        console.log("Database not initialized");
        return resolve({ user: null });
      }

      const user = realm
        .objects("User")
        .filtered("username == $0 AND role == 'admin'", username)[0];

      if (!user) {
        console.log(`No admin user found with username ${username}`);
        return resolve({ user: null });
      }

      console.log("Admin user found, attempting password verification...");
      try {
        const isPasswordValid = await bcrypt.compare(
          password,
          user.password as string
        );
        console.log("Password comparison result:", isPasswordValid);
        if (!isPasswordValid) {
          console.log("Invalid password for admin user");
          return resolve({ user: null });
        }
      } catch (error) {
        console.error("Error during password comparison:", error);
        return resolve({ user: null });
      }

      console.log(`Successfully authenticated admin user ${username}`);
      const mappedUser = mapRealmUserToUser(user);
      return resolve({
        user: {
          ...mappedUser,
          password: user.password as string,
        } as DBUser,
        redirectTo: "/admin/dashboard",
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
      return resolve({ user: null });
    }
  });
}

async function updatePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  try {
    await initRealm();
    if (!realm) throw new Error("Realm not initialized");

    const user = realm.objects("User").filtered("id == $0", id)[0];
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      String(currentPassword),
      String(user.password)
    );
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(String(newPassword), 10);

    realm.write(() => {
      if (!realm) {
        throw new Error("Database not initialized");
      }
      user.password = hashedPassword;
      user.updated_at = new Date();
    });

    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}

// Product-related functions
async function getAllProducts(): Promise<Product[]> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before getting products...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Fetching all products from Realm...");
    const products = realm.objects<{
      id: string;
      name: string;
      description: string;
      regularPrice: number;
      salePrice: number | null;
      price: number;
      stock: number;
      category: string;
      type: string | null;
      brand: string | null;
      colors: Realm.List<string>;
      image: string;
      additionalImages: Realm.List<string>;
      created_at: string;
    }>("Product");
    console.log(`Found ${products.length} products`);

    // Convert Realm Results to array and map the properties
    return Array.from(products).map((product) => ({
      id: String(product.id),
      name: String(product.name),
      description: String(product.description),
      regularPrice: Number(product.regularPrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      price: Number(product.price),
      stock: Number(product.stock),
      category: String(product.category),
      type: product.type ? String(product.type) : undefined,
      brand: product.brand ? String(product.brand) : undefined,
      colors: Array.isArray(product.colors)
        ? product.colors.map(String)
        : product.colors && typeof product.colors === "object"
        ? Object.values(product.colors).map(String)
        : [],
      image: String(product.image),
      additionalImages: Array.isArray(product.additionalImages)
        ? product.additionalImages.map(String)
        : [],
      created_at: String(product.created_at),
      updated_at: String(product.created_at),
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return [];
  }
}

async function createProduct(
  productData: Omit<Product, "id" | "created_at" | "updated_at">
): Promise<Product> {
  try {
    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Creating new product in Realm...");
    const newProduct = {
      id: new ObjectId().toString(),
      name: productData.name.trim(),
      description: productData.description.trim(),
      regularPrice: Number(productData.regularPrice),
      price: Number(productData.price),
      stock: Number(productData.stock),
      salePrice: productData.salePrice ? Number(productData.salePrice) : null,
      category: productData.category.trim(),
      type: productData.type?.trim() || "",
      brand: productData.brand?.trim() || "",
      colors: Array.isArray(productData.colors) ? productData.colors : [],
      image: productData.image,
      additionalImages: Array.isArray(productData.additionalImages)
        ? productData.additionalImages
        : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Formatted product data:", newProduct);

    let createdProduct: any;
    realmInstance.write(() => {
      console.log("Writing new product to Realm...");
      createdProduct = realmInstance.create("Product", newProduct);
    });

    if (!createdProduct) {
      throw new Error("Failed to create product in database");
    }

    console.log("Product created successfully:", createdProduct);
    return {
      id: createdProduct.id,
      name: createdProduct.name,
      description: createdProduct.description,
      regularPrice: createdProduct.regularPrice,
      salePrice: createdProduct.salePrice,
      price: createdProduct.price,
      stock: createdProduct.stock,
      category: createdProduct.category,
      type: createdProduct.type,
      brand: createdProduct.brand,
      colors: createdProduct.colors,
      image: createdProduct.image,
      additionalImages: createdProduct.additionalImages,
      created_at: createdProduct.created_at,
      updated_at: createdProduct.updated_at,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

async function updateProduct(
  id: string,
  productData: Partial<Product>
): Promise<boolean> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before updating product...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Updating product in Realm...");
    const product = realm.objectForPrimaryKey<{
      id: string;
      name: string;
      description: string;
      regularPrice: number;
      salePrice: number | null;
      price: number;
      stock: number;
      category: string;
      type?: string;
      brand?: string;
      colors: Realm.List<string>;
      image: string;
      additionalImages: Realm.List<string>;
      created_at: string;
      updated_at: string;
    }>("Product", id);

    if (!product) return false;

    realm.write(() => {
      if (!realm) {
        throw new Error("Database not initialized");
      }
      console.log("Writing updated product to Realm...");
      const { id: _, ...updateData } = productData;

      // Ensure additionalImages is properly handled
      if (updateData.additionalImages) {
        while (product.additionalImages.length > 0) {
          product.additionalImages.pop();
        }
        updateData.additionalImages.forEach((image: string) => {
          product.additionalImages.push(image);
        });
        delete updateData.additionalImages;
      }

      Object.assign(product, {
        ...updateData,
        updated_at: new Date().toISOString(),
      });
    });

    console.log("Product updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}

async function deleteProduct(id: string): Promise<boolean> {
  try {
    const realmInstance = await ensureInitialized();
    if (!realmInstance) {
      console.log("Failed to initialize Realm");
      return false;
    }

    // Find product using direct string ID
    const product = realmInstance
      .objects("Product")
      .filtered("id == $0", id)[0];

    if (!product) {
      console.log(`Product not found with id: ${id}`);
      return false;
    }

    realmInstance.write(() => {
      realmInstance.delete(product);
      console.log(`Deleted product with id: ${id}`);
    });

    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}

async function getProductById(id: string): Promise<Product | null> {
  try {
    if (!realm) {
      console.log("Attempting to initialize Realm before getting product...");
      await initRealm();
    }

    if (!realm) {
      throw new Error("Realm database is not initialized");
    }

    console.log("Fetching product from Realm...");
    if (typeof id !== "string") {
      throw new Error("Product ID must be a string");
    }

    const product = realm.objectForPrimaryKey<{
      id: string;
      name: string;
      description: string;
      regularPrice: number;
      salePrice: number | null;
      price: number;
      stock: number;
      category: string;
      type?: string;
      brand?: string;
      colors: Realm.List<string>;
      image: string;
      additionalImages: Realm.List<string>;
      created_at: string;
      updated_at: string;
    }>("Product", id);

    console.log(`Found product with ID ${id}: ${!!product}`);
    if (!product) return null;

    // Convert Realm.List to regular arrays
    const additionalImages = Array.from(product.additionalImages || []);
    const colors = Array.from(product.colors || []);

    console.log("Additional Images from DB:", additionalImages);

    return {
      id: String(product.id),
      name: String(product.name),
      description: String(product.description),
      regularPrice: Number(product.regularPrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      price: Number(product.price),
      stock: Number(product.stock),
      category: String(product.category),
      type: product.type ? String(product.type) : undefined,
      brand: product.brand ? String(product.brand) : undefined,
      colors: colors,
      image: String(product.image),
      additionalImages: additionalImages,
      created_at: String(product.created_at),
      updated_at: String(product.updated_at),
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
}

// Wishlist-related functions
async function addToWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    await initRealm();
    if (!realm) throw new Error("Realm not initialized");

    const now = new Date().toISOString();
    const wishlistItem = {
      id: uuidv4(),
      userId,
      productId,
      created_at: now,
    };

    realm.write(() => {
      if (!realm) {
        throw new Error("Database not initialized");
      }
      realm?.create("Wishlist", wishlistItem);
    });

    return true;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return false;
  }
}

async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    await initRealm();
    if (!realm) throw new Error("Realm not initialized");

    const result = realm.write(() => {
      if (!realm) {
        throw new Error("Database not initialized");
      }
      const wishlistItem = realm
        ?.objects("Wishlist")
        .filtered("userId == $0 && productId == $1", userId, productId)[0];
      if (wishlistItem) {
        realm?.delete(wishlistItem);
        return true;
      }
      return false;
    });

    return result;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }
}

async function getWishlist(userId: string): Promise<string[]> {
  try {
    await initRealm();
    if (!realm) throw new Error("Realm not initialized");

    const wishlistItems = realm
      .objects<{ productId: string }>("Wishlist")
      .filtered("userId == $0", userId);
    return Array.from(wishlistItems).map((item) => item.productId);
  } catch (error) {
    console.error("Error getting wishlist:", error);
    return [];
  }
}

async function isInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    await initRealm();
    if (!realm) throw new Error("Realm not initialized");

    const wishlistItem = realm
      .objects("Wishlist")
      .filtered("userId == $0 && productId == $1", userId, productId)[0];
    return !!wishlistItem;
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }
}

// Cart-related functions
interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  selectedColor?: string;
  createdAt: Date;
  updatedAt: Date;
  cart?: Cart; // Reference to parent Cart
}

interface Cart {
  _id: string;
  userId: string;
  items: Realm.List<CartItem>;
  createdAt: Date;
  updatedAt: Date;
}

async function getCart(userId: string): Promise<any> {
  try {
    await ensureInitialized();
    if (!realm) throw new Error("Database not initialized");

    const cart = realm
      .objects<Cart>("Cart")
      .filtered("userId == $0", userId)[0] as unknown as Cart;
    if (!cart) {
      throw new Error("Cart not found for user: " + userId);
    }

    // Convert Realm objects to plain objects and include product details
    const items = Array.from(cart.items || [])
      .map((item: CartItem) => {
        const product = realm!.objectForPrimaryKey("Product", item.productId);
        if (!product) {
          console.warn(`Product not found for cart item: ${item.productId}`);
          return null;
        }
        return {
          id: item._id,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
          },
          quantity: item.quantity,
          selectedColor: item.selectedColor,
        };
      })
      .filter(Boolean); // Remove null items

    return {
      id: cart._id,
      userId: cart.userId,
      items: items,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  } catch (error) {
    console.error("Error in getCart:", error);
    throw new Error("Failed to fetch cart");
  }
}

async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1,
  selectedColor?: string
): Promise<any> {
  try {
    const realm = await initRealm();

    // Check if product exists first
    const product = realm.objectForPrimaryKey("Product", productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let cart: Cart | null = null;
    let result: any = null;

    await realm.write(() => {
      // Find or create cart
      cart = realm.objects<Cart>("Cart").filtered("userId == $0", userId)[0];
      if (!cart) {
        cart = realm.create<Cart>("Cart", {
          _id: new ObjectId().toString(),
          userId,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Find existing item with same product and color
      const existingItems = realm
        .objects<CartItem>("CartItem")
        .filtered(
          "cart._id == $0 AND productId == $1 AND selectedColor == $2",
          cart._id,
          productId,
          selectedColor || null
        );
      const existingItem = existingItems[0];

      if (existingItem) {
        console.log("Updating existing cart item:", {
          itemId: existingItem._id,
          productId,
          quantity: existingItem.quantity + quantity,
        });
        existingItem.quantity += quantity;
        existingItem.updatedAt = new Date();
      } else {
        console.log("Creating new cart item:", {
          productId,
          quantity,
          selectedColor,
        });
        const newItem = realm.create<CartItem>("CartItem", {
          _id: new ObjectId().toString(),
          cart,
          productId,
          quantity,
          selectedColor,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("Created new cart item:", { itemId: newItem._id });
      }

      cart.updatedAt = new Date();

      // Get all cart items
      const cartItems = realm
        .objects<CartItem>("CartItem")
        .filtered("cart._id == $0", cart._id);
      console.log(`Found ${cartItems.length} items in cart after update`);

      // Prepare result with product details
      result = {
        _id: cart._id,
        userId: cart.userId,
        items: Array.from(cartItems)
          .map((item: CartItem) => {
            const prod = realm!.objectForPrimaryKey<Product>(
              "Product",
              item.productId
            );
            if (!prod) {
              console.warn(
                `Product not found for cart item: ${item.productId}`
              );
              return null;
            }
            return {
              _id: item._id,
              product: {
                id: prod.id,
                name: prod.name,
                price: prod.price,
                image: prod.image,
              },
              quantity: item.quantity,
              selectedColor: item.selectedColor,
            };
          })
          .filter(Boolean), // Remove null items
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      };
    });

    console.log("Cart updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error in addToCart:", error);
    throw error;
  }
}

async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<any> {
  await ensureInitialized();
  if (!realm) throw new Error("Database not initialized");

  const cart = realm
    .objects<Cart>("Cart")
    .filtered("userId == $0", userId)[0] as unknown as Cart;
  if (!cart) {
    throw new Error("Cart not found for user: " + userId);
  }

  const item = realm
    .objects<CartItem>("CartItem")
    .filtered(
      "cart._id == $0 AND productId == $1",
      getCartId(cart),
      productId
    )[0];
  if (!item) throw new Error("Item not found in cart");

  realm.write(() => {
    if (!realm) {
      throw new Error("Database not initialized");
    }
    if (quantity <= 0) {
      realm.delete(item);
    } else {
      item.quantity = quantity;
      item.updatedAt = new Date();
    }
    if (cart) {
      cart.updatedAt = new Date();
    } else {
      throw new Error("Cart is undefined");
    }
  });

  return getCart(userId);
}

async function removeFromCart(userId: string, productId: string): Promise<any> {
  await ensureInitialized();
  if (!realm) throw new Error("Database not initialized");

  const cart = realm
    .objects<Cart>("Cart")
    .filtered("userId == $0", userId)[0] as unknown as Cart;
  if (!cart) {
    throw new Error("Cart not found for user: " + userId);
  }

  const item = realm
    .objects("CartItem")
    .filtered(
      "cart._id == $0 AND productId == $1",
      getCartId(cart),
      productId
    )[0];
  if (!item) throw new Error("Item not found in cart");

  realm.write(() => {
    if (!realm) {
      throw new Error("Database not initialized");
    }
    realm.delete(item);
    if (cart) {
      cart.updatedAt = new Date();
    } else {
      throw new Error("Cart is undefined");
    }
  });

  return getCart(userId);
}

async function clearCart(userId: string): Promise<void> {
  await ensureInitialized();
  if (!realm) throw new Error("Database not initialized");

  const cart = realm
    .objects("Cart")
    .filtered("userId == $0", userId)[0] as unknown as Cart;
  if (!cart) return;

  const items = realm
    .objects("CartItem")
    .filtered("cart._id == $0", getCartId(cart));

  realm.write(() => {
    if (!realm) {
      throw new Error("Database not initialized");
    }
    realm.delete(items);
    if (cart) {
      cart.updatedAt = new Date();
    } else {
      throw new Error("Cart is undefined");
    }
  });
}

// Order-related functions
async function getOrderById(id: string): Promise<Order | null> {
  const realm = await initRealm();
  if (!realm) {
    throw new Error("Failed to initialize Realm database");
  }
  try {
    const order = realm.objectForPrimaryKey("Order", id);
    if (!order) return null;
    return mapRealmOrderToOrder(order);
  } finally {
    realm.close();
  }
}

async function updateOrderInDb(
  id: string,
  orderData: Partial<Order>
): Promise<Order | null> {
  const realm = await initRealm();
  if (!realm) {
    throw new Error("Failed to initialize Realm database");
  }
  try {
    let updatedOrder: any = null;
    await realm.write(() => {
      const order = realm.objectForPrimaryKey("Order", id);
      if (!order) {
        return null;
      }

      // Create a copy of the order data
      const orderCopy = {
        _id: order._id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: orderData.status || order.status,
        items: Array.from(order.items as Realm.List<RealmOrderItem>).map(
          (item) => ({
            _id: item._id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            selectedColor: item.selectedColor,
          })
        ),
        paymentMethod: order.paymentMethod,
        slipUrl: order.slipUrl,
        shippingDetails: order.shippingDetails
          ? Object.fromEntries(Object.entries(order.shippingDetails))
          : {},
        createdAt: order.createdAt,
        updatedAt: new Date(),
      };

      // Update the order
      Object.assign(order, { ...orderData, updatedAt: new Date() });

      // Store the copy
      updatedOrder = orderCopy;
    });

    return updatedOrder;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  } finally {
    if (!realm.isClosed) {
      realm.close();
    }
  }
}

// Helper function to map Realm order object to Order interface
function mapRealmOrderToOrder(order: any): Order {
  const mappedOrder: Order = {
    _id: order._id,
    userId: order.userId,
    totalAmount: order.totalAmount,
    shippingDetails: {
      firstName: order.shippingDetails.firstName,
      lastName: order.shippingDetails.lastName,
      email: order.shippingDetails.email,
      phone: order.shippingDetails.phone,
      address: order.shippingDetails.address,
      city: order.shippingDetails.city,
      postalCode: order.shippingDetails.postalCode,
    },
    items: order.items.map((item: any) => ({
      _id: item._id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      selectedColor: item.selectedColor,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      order: null as any, // Will be set after order creation
    })),
    status: order.status,
    paymentMethod: order.paymentMethod,
    slipUrl: order.slipUrl,
    createdAt: order.createdAt || new Date(),
    updatedAt: order.updatedAt || new Date(),
  };
  // Set the order reference in items
  mappedOrder.items = mappedOrder.items.map((item) => ({
    ...item,
    order: mappedOrder,
  }));
  return mappedOrder;
}

// Product Type, Brand, and Category functions
async function getAllProductTypes(): Promise<{ _id: string; name: string }[]> {
  try {
    if (!realm) {
      await initRealm();
    }
    if (!realm) throw new Error("Realm database is not initialized");

    const types = realm.objects("ProductType").sorted("name");
    return Array.from(types).map((type) => ({
      _id: String(type._id),
      name: String(type.name),
    }));
  } catch (error) {
    console.error("Error fetching product types:", error);
    throw error;
  }
}

async function getAllBrands(): Promise<{ id: string; name: string }[]> {
  try {
    if (!realm) {
      await initRealm();
    }
    if (!realm) throw new Error("Realm database is not initialized");

    const brands = realm.objects("Brand").sorted("name");
    return Array.from(brands).map((brand) => ({
      id: String(brand.id),
      name: String(brand.name),
    }));
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw error;
  }
}

async function getAllCategories(): Promise<{ id: string; name: string }[]> {
  try {
    if (!realm) {
      await initRealm();
    }
    if (!realm) throw new Error("Realm database is not initialized");

    const categories = realm.objects("Category").sorted("name");
    return Array.from(categories).map((category) => ({
      id: String(category.id),
      name: String(category.name),
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

// Product Type functions
async function createProductType(data: { name: string; description?: string }) {
  try {
    if (!realm) {
      await initRealm();
    }
    if (!realm) throw new Error("Realm database is not initialized");

    let productType;
    realm.write(() => {
      productType = realm!.create("ProductType", {
        _id: new ObjectId(),
        name: data.name,
        slug: slugify(data.name, { lower: true }),
        description: data.description || "",
        created_at: new Date(),
        updated_at: new Date(),
      });
    });
    return productType;
  } catch (error) {
    console.error("Error creating product type:", error);
    throw error;
  }
}

async function updateProductType(
  id: string,
  data: { name?: string; description?: string }
) {
  try {
    if (!realm) {
      await initRealm();
    }
    if (!realm) throw new Error("Realm database is not initialized");

    const productType = realm.objectForPrimaryKey(
      "ProductType",
      new ObjectId(id)
    );
    if (!productType) {
      throw new Error("Product type not found");
    }

    realm.write(() => {
      if (!realm) {
        throw new Error("Realm database is not initialized");
      }
      if (data.name) {
        productType.name = data.name;
        productType.slug = slugify(data.name, { lower: true });
      }
      if (data.description !== undefined) {
        productType.description = data.description;
      }
      productType.updated_at = new Date();
    });
    return productType;
  } catch (error) {
    console.error("Error updating product type:", error);
    throw error;
  }
}

async function deleteProductType(id: string): Promise<boolean> {
  try {
    if (!realm) {
      await initRealm();
    }
    if (!realm) throw new Error("Realm database is not initialized");

    const productType = realm.objectForPrimaryKey(
      "ProductType",
      new ObjectId(id)
    );
    if (!productType) {
      return false;
    }

    realm.write(() => {
      if (!realm) {
        throw new Error("Realm database is not initialized");
      }
      realm!.delete(productType);
    });
    return true;
  } catch (error) {
    console.error("Error deleting product type:", error);
    throw error;
  }
}

function getCartId(cart: Cart | undefined): string {
  if (!cart) {
    throw new Error("Cart is undefined");
  }
  return cart._id;
}

export {
  realm,
  getAllUsers,
  getUser,
  getUserByUsername,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  login,
  adminLogin,
  updatePassword,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  isInWishlist,
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getOrderById,
  updateOrderInDb,
  mapRealmOrderToOrder,
  initRealm,
  ensureInitialized,
  getAllProductTypes,
  getAllBrands,
  getAllCategories,
  createProductType,
  updateProductType,
  deleteProductType,
  getCartId,
};
