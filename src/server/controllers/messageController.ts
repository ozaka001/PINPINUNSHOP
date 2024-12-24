import { Request, Response } from 'express';
import { ObjectId } from 'bson';
import { realm, ensureInitialized } from '../database/db.js';

interface Message {
  _id: ObjectId;
  userId: ObjectId;
  sender: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export const getMessages = async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    const realmInstance = realm;
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }
    const userId = new ObjectId(req.user.id);
    const messages = realmInstance.objects('Message').filtered('userId == $0', userId).sorted('timestamp', true);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    const realmInstance = realm;
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }
    const { content } = req.body;
    const userId = new ObjectId(req.user.id);

    realmInstance.write(() => {
      realmInstance.create('Message', {
        _id: new ObjectId(),
        userId,
        sender: 'Fashion Store Support',
        content,
        timestamp: new Date(),
        isRead: false
      });
    });

    res.status(201).json({ message: 'Message created successfully' });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Failed to create message' });
  }
};

export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    const realmInstance = realm;
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }
    const messageId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user.id);

    realmInstance.write(() => {
      const message = realmInstance.objectForPrimaryKey<Message>('Message', messageId);
      if (message && message.userId.equals(userId)) {
        message.isRead = true;
      }
    });

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    const realmInstance = realm;
    if (!realmInstance) {
      throw new Error('Database not initialized');
    }
    const messageId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user.id);

    realmInstance.write(() => {
      const message = realmInstance.objectForPrimaryKey<Message>('Message', messageId);
      if (message && message.userId.equals(userId)) {
        realmInstance.delete(message);
      }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};
