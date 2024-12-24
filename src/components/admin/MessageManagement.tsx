import { useState, useEffect } from 'react';
import { Search, Archive, Trash2, Mail, MailOpen, Send } from 'lucide-react';
import api from '../../services/api.js';
import { useSearchParams } from 'react-router-dom';
import ChatRoom from './ChatRoom.js';

interface Message {
  _id: string;
  userId: string;
  sender: string;
  content: string;
  isRead: boolean;
  timestamp: string;
}

interface Conversation {
  userId: string;
  customerName: string;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessageManagement() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchMessages();
    // If userId is provided in URL params, open that conversation
    const userId = searchParams.get('userId');
    if (userId) {
      setSearchQuery(userId);
    }
  }, [searchParams]);

  useEffect(() => {
    // Group messages into conversations
    const conversationMap = new Map<string, Message[]>();
    messages.forEach(message => {
      const messages = conversationMap.get(message.userId) || [];
      messages.push(message);
      conversationMap.set(message.userId, messages);
    });

    const newConversations: Conversation[] = Array.from(conversationMap.entries()).map(([userId, messages]) => {
      const lastMessage = messages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      return {
        userId,
        customerName: messages.find(m => m.sender !== 'Admin')?.sender || 'Unknown',
        lastMessage,
        unreadCount: messages.filter(m => !m.isRead).length
      };
    });

    // Sort conversations by last message timestamp
    newConversations.sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    setConversations(newConversations);
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleStatusChange = async (messageId: string, newStatus: boolean) => {
    try {
      await api.patch(`/messages/${messageId}/status`, { isRead: newStatus });
      fetchMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this entire conversation?')) {
      try {
        await api.delete(`/messages/conversation/${userId}`);
        fetchMessages();
        setSelectedConversation(null);
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'unread' && conversation.unreadCount > 0) || 
                         (selectedStatus === 'read' && conversation.unreadCount === 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Message Management</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y">
          {filteredConversations.map((conversation) => (
            <div key={conversation.userId} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{conversation.customerName}</h3>
                    {conversation.unreadCount > 0 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                        {conversation.unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{conversation.lastMessage.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <span>
                      {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(conversation.userId)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete conversation"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* Chat Room Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-white">
          <ChatRoom
            userId={selectedConversation.userId}
            customerName={selectedConversation.customerName}
            onClose={() => setSelectedConversation(null)}
          />
        </div>
      )}
    </div>
  );
}