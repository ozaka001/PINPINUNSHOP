import { useState, useEffect } from 'react';
import { MessageSquare, Search, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import toast from '../services/toast.js';

interface Message {
  _id: string;
  sender: string;
  userId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  adminId: string;
  adminName: string;
  lastMessage: Message;
  unreadCount: number;
}

export function UserMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileMessageOpen, setIsMobileMessageOpen] = useState(false);
  const { user } = useAuth();

  const isUserMessage = (message: Message) => {
    if (!user) return false;
    return message.sender === user.email;
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    // For customer view, we only have one conversation with the admin
    const adminMessages = messages.filter(message => 
      message.sender === 'Admin' || isUserMessage(message)
    );

    if (adminMessages.length > 0) {
      const sortedMessages = adminMessages.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const newConversations: Conversation[] = [{
        adminId: 'Admin',
        adminName: 'Shop Admin',
        lastMessage: sortedMessages[0],
        unreadCount: sortedMessages.filter(m => !m.isRead && m.sender === 'Admin').length
      }];

      setConversations(newConversations);
    } else {
      setConversations([]);
    }
  }, [messages, user]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages');
      setMessages(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch messages');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileMessageOpen(true);
  };

  const handleBackToList = () => {
    setIsMobileMessageOpen(false);
    setSelectedConversation(null);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return;
    
    try {
      const response = await api.post('/messages', { content });
      const newMessage = {
        _id: response.data._id || Date.now().toString(),
        sender: user.email,
        userId: user.id,
        content,
        timestamp: new Date().toISOString(),
        isRead: true
      };
      setMessages(prev => [...prev, newMessage]);
      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!conversation.lastMessage || !conversation.adminName) return false;
    
    return conversation.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.adminName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchMessages}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-gray-600">View and manage your messages</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="lg:grid lg:grid-cols-3">
          {/* Messages List */}
          <div className={`border-r ${isMobileMessageOpen ? 'hidden lg:block' : 'block'}`}>
            {/* Search */}
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="divide-y overflow-auto" style={{ maxHeight: '500px' }}>
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.adminId}
                  onClick={() => handleMessageClick(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedConversation?.adminId === conversation.adminId ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{conversation.adminName}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px] md:max-w-[300px]">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {conversation.unreadCount > 0 && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-600 rounded-full mb-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                      <p>{new Date(conversation.lastMessage.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No messages found
                </div>
              )}
            </div>
          </div>

          {/* Chat Content */}
          <div className={`lg:col-span-2 ${isMobileMessageOpen ? 'block' : 'hidden lg:block'}`}>
            {selectedConversation ? (
              <div>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3 bg-white sticky top-0">
                  <button
                    onClick={handleBackToList}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-medium">{selectedConversation.adminName}</h3>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="overflow-y-auto" style={{ height: '500px' }}>
                  <div className="p-4 space-y-4">
                    {messages
                      .filter(msg => msg.sender === 'Admin' || isUserMessage(msg))
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.sender !== 'Admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.sender !== 'Admin'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            {message.sender === 'Admin' && (
                              <p className="text-xs text-gray-500 mb-1">{message.sender}</p>
                            )}
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${message.sender !== 'Admin' ? 'text-white/70' : 'text-gray-500'}`}>
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                      if (input.value.trim()) {
                        handleSendMessage(input.value);
                        input.value = '';
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      name="message"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-lg"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}