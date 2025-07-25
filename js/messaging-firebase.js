// Firebase Messaging System Module
import { 
    db,
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    limit
} from './firebase-config.js';

import { logUserAction } from './logger-firebase.js';
import { authManager } from './auth-firebase.js';

export class MessagingManager {
    constructor() {
        this.conversations = [];
        this.messages = [];
        this.messageListeners = [];
        this.setupRealtimeListener();
    }

    // Setup real-time listener for messages
    setupRealtimeListener() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        // Listen to messages where user is sender or recipient
        const messagesQuery = query(
            collection(db, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        onSnapshot(messagesQuery, (snapshot) => {
            this.messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.updateConversations();
            this.notifyMessageChange();
        });
    }

    // Add message change listener
    onMessageChange(callback) {
        this.messageListeners.push(callback);
    }

    // Notify all listeners of message changes
    notifyMessageChange() {
        this.messageListeners.forEach(callback => {
            callback(this.messages, this.conversations);
        });
    }

    // Update conversations from messages
    updateConversations() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return;

        const conversationMap = new Map();

        this.messages
            .filter(msg => msg.senderId === currentUser.uid || msg.recipientId === currentUser.uid)
            .forEach(message => {
                const otherUserId = message.senderId === currentUser.uid ? message.recipientId : message.senderId;
                const conversationKey = [currentUser.uid, otherUserId].sort().join('-');

                if (!conversationMap.has(conversationKey)) {
                    conversationMap.set(conversationKey, {
                        id: conversationKey,
                        participants: [currentUser.uid, otherUserId],
                        otherUser: {
                            id: otherUserId,
                            name: message.senderId === currentUser.uid ? message.recipientName : message.senderName,
                            email: message.senderId === currentUser.uid ? message.recipientEmail : message.senderEmail
                        },
                        lastMessage: message,
                        unreadCount: 0
                    });
                }

                const conversation = conversationMap.get(conversationKey);
                if (message.timestamp > conversation.lastMessage.timestamp) {
                    conversation.lastMessage = message;
                }

                // Count unread messages
                if (message.recipientId === currentUser.uid && !message.read) {
                    conversation.unreadCount++;
                }
            });

        this.conversations = Array.from(conversationMap.values())
            .sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
    }

    // Send message
    async sendMessage(recipientId, recipientName, recipientEmail, subject, content, appointmentId = null) {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const message = {
                senderId: currentUser.uid,
                senderName: currentUser.name,
                senderEmail: currentUser.email,
                senderRole: currentUser.role,
                recipientId: recipientId,
                recipientName: recipientName,
                recipientEmail: recipientEmail,
                subject: subject,
                content: content,
                appointmentId: appointmentId,
                timestamp: new Date().toISOString(),
                read: false,
                starred: false
            };

            const docRef = await addDoc(collection(db, 'messages'), message);

            logUserAction(currentUser.uid, 'MESSAGE_SENT', 
                `Message sent to ${recipientName}: ${subject}`);

            return { success: true, messageId: docRef.id };
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }

    // Reply to message
    async replyToMessage(originalMessageId, content) {
        try {
            const originalMessage = this.messages.find(msg => msg.id === originalMessageId);
            if (!originalMessage) {
                throw new Error('Original message not found');
            }

            const currentUser = authManager.getCurrentUserProfile();
            const isReplying = originalMessage.recipientId === currentUser.uid;
            
            const recipientId = isReplying ? originalMessage.senderId : originalMessage.recipientId;
            const recipientName = isReplying ? originalMessage.senderName : originalMessage.recipientName;
            const recipientEmail = isReplying ? originalMessage.senderEmail : originalMessage.recipientEmail;
            
            const subject = originalMessage.subject.startsWith('Re: ') 
                ? originalMessage.subject 
                : `Re: ${originalMessage.subject}`;

            return await this.sendMessage(
                recipientId, 
                recipientName, 
                recipientEmail, 
                subject, 
                content, 
                originalMessage.appointmentId
            );
        } catch (error) {
            console.error('Error replying to message:', error);
            throw new Error('Failed to reply to message');
        }
    }

    // Mark message as read
    async markAsRead(messageId) {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const message = this.messages.find(msg => msg.id === messageId);
            if (!message || message.recipientId !== currentUser.uid) {
                throw new Error('Message not found or unauthorized');
            }

            await updateDoc(doc(db, 'messages', messageId), {
                read: true,
                readAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw new Error('Failed to mark message as read');
        }
    }

    // Star/unstar message
    async toggleStar(messageId) {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const message = this.messages.find(msg => msg.id === messageId);
            if (!message || (message.senderId !== currentUser.uid && message.recipientId !== currentUser.uid)) {
                throw new Error('Message not found or unauthorized');
            }

            await updateDoc(doc(db, 'messages', messageId), {
                starred: !message.starred
            });

            return { success: true };
        } catch (error) {
            console.error('Error toggling star:', error);
            throw new Error('Failed to toggle star');
        }
    }

    // Delete message
    async deleteMessage(messageId) {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const message = this.messages.find(msg => msg.id === messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Only sender or admin can delete messages
            if (message.senderId !== currentUser.uid && currentUser.role !== 'admin') {
                throw new Error('Unauthorized to delete this message');
            }

            await deleteDoc(doc(db, 'messages', messageId));

            logUserAction(currentUser.uid, 'MESSAGE_DELETE', 
                `Message deleted: ${message.subject}`);

            return { success: true };
        } catch (error) {
            console.error('Error deleting message:', error);
            throw new Error('Failed to delete message');
        }
    }

    // Get messages for current user
    getMyMessages() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return [];

        return this.messages.filter(message => 
            message.senderId === currentUser.uid || message.recipientId === currentUser.uid
        );
    }

    // Get conversation messages
    getConversationMessages(otherUserId) {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return [];

        return this.messages
            .filter(message => 
                (message.senderId === currentUser.uid && message.recipientId === otherUserId) ||
                (message.senderId === otherUserId && message.recipientId === currentUser.uid)
            )
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // Get unread messages
    getUnreadMessages() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return [];

        return this.messages.filter(message => 
            message.recipientId === currentUser.uid && !message.read
        );
    }

    // Get starred messages
    getStarredMessages() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return [];

        return this.messages.filter(message => 
            (message.senderId === currentUser.uid || message.recipientId === currentUser.uid) &&
            message.starred
        );
    }

    // Get sent messages
    getSentMessages() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return [];

        return this.messages.filter(message => message.senderId === currentUser.uid);
    }

    // Get received messages
    getReceivedMessages() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return [];

        return this.messages.filter(message => message.recipientId === currentUser.uid);
    }

    // Get conversations
    getConversations() {
        return this.conversations;
    }

    // Get message statistics
    getMessageStats() {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser) return {};

        const myMessages = this.getMyMessages();
        const unreadCount = this.getUnreadMessages().length;
        const sentCount = this.getSentMessages().length;
        const receivedCount = this.getReceivedMessages().length;
        const starredCount = this.getStarredMessages().length;

        const stats = {
            total: myMessages.length,
            unread: unreadCount,
            sent: sentCount,
            received: receivedCount,
            starred: starredCount,
            conversations: this.conversations.length
        };

        if (currentUser.role === 'admin') {
            stats.totalSystem = this.messages.length;
        }

        return stats;
    }

    // Search messages
    searchMessages(searchTerm) {
        const currentUser = authManager.getCurrentUserProfile();
        if (!currentUser || !searchTerm) return [];

        const myMessages = this.getMyMessages();
        const lowercaseSearch = searchTerm.toLowerCase();

        return myMessages.filter(message => 
            message.subject.toLowerCase().includes(lowercaseSearch) ||
            message.content.toLowerCase().includes(lowercaseSearch) ||
            message.senderName.toLowerCase().includes(lowercaseSearch) ||
            message.recipientName.toLowerCase().includes(lowercaseSearch)
        );
    }

    // Mark all messages as read
    async markAllAsRead() {
        try {
            const currentUser = authManager.getCurrentUserProfile();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const unreadMessages = this.getUnreadMessages();
            const updatePromises = unreadMessages.map(message => 
                updateDoc(doc(db, 'messages', message.id), {
                    read: true,
                    readAt: new Date().toISOString()
                })
            );

            await Promise.all(updatePromises);

            logUserAction(currentUser.uid, 'MESSAGES_MARK_ALL_READ', 
                `Marked ${unreadMessages.length} messages as read`);

            return { success: true };
        } catch (error) {
            console.error('Error marking all messages as read:', error);
            throw new Error('Failed to mark all messages as read');
        }
    }
}

// Export singleton instance
export const messagingManager = new MessagingManager();
