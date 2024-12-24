import express from 'express';
import { ensureInitialized } from '../database/db.js';
import { auth } from '../middleware/auth.js';
import { MessageSchemaType } from '../database/realmSchema.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all messages for the authenticated user
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated or missing ID' });
    }

    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    let messages;
    const { userId } = req.query;

    if (req.user.role === 'admin' && userId) {
      // Admin viewing specific user's messages
      messages = realm.objects<MessageSchemaType>('Message')
        .filtered('userId == $0', userId)
        .sorted('timestamp', true);
    } else if (req.user.role === 'admin') {
      // Admin viewing all messages
      messages = realm.objects<MessageSchemaType>('Message')
        .sorted('timestamp', true);
    } else {
      // Regular user viewing their own messages
      messages = realm.objects<MessageSchemaType>('Message')
        .filtered('userId == $0', req.user.id)
        .sorted('timestamp', true);
    }

    const formattedMessages = Array.from(messages).map(msg => ({
      _id: msg._id,
      userId: msg.userId,
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      isRead: msg.isRead
    }));
    
    res.json(formattedMessages);
  } catch (error) {
    console.error('Error in GET /messages:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new message
router.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated or missing ID' });
    }

    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const newMessage = realm.write(() => {
      return realm.create('Message', {
        _id: uuidv4(),
        userId: req.user.id,
        sender: req.user.email,
        content,
        timestamp: new Date(),
        isRead: false
      });
    });
    
    if (!newMessage) {
      return res.status(500).json({ error: 'Failed to create message' });
    }

    res.status(201).json({
      _id: newMessage._id,
      userId: newMessage.userId,
      sender: newMessage.sender,
      content: newMessage.content,
      timestamp: newMessage.timestamp.toISOString(),
      isRead: newMessage.isRead
    });
  } catch (error) {
    console.error('Error in POST /messages:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin reply to a message
router.post('/reply', async (req, res) => {
  try {
    if (!req.user || !req.user.id || req.user.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ error: 'User ID and message content are required' });
    }

    // Verify that the target user exists
    const user = realm.objectForPrimaryKey('User', userId);
    if (!user) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    realm.write(() => {
      realm.create('Message', {
        _id: uuidv4(),
        userId,
        sender: 'Admin',
        content,
        timestamp: new Date(),
        isRead: false
      });
    });
    
    res.status(201).json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error in POST /messages/reply:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark message as read
router.patch('/:id/read', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated or missing ID' });
    }

    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const messageId = req.params.id;
    const userId = req.user.id;
    
    const message = realm.objectForPrimaryKey<MessageSchemaType>('Message', messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this message' });
    }
    
    realm.write(() => {
      message.isRead = true;
    });
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error in PATCH /messages/:id/read:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated or missing ID' });
    }

    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const messageId = req.params.id;
    const userId = req.user.id;
    
    const message = realm.objectForPrimaryKey<MessageSchemaType>('Message', messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }
    
    realm.write(() => {
      realm.delete(message);
    });
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /messages/:id:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete conversation
router.delete('/conversation/:userId', async (req, res) => {
  try {
    if (!req.user || !req.user.id || req.user.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    const realm = await ensureInitialized();
    if (!realm) {
      throw new Error('Database not initialized');
    }

    const { userId } = req.params;
    
    realm.write(() => {
      const messages = realm.objects<MessageSchemaType>('Message')
        .filtered('userId == $0', userId);
      realm.delete(messages);
    });
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /messages/conversation/:userId:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
