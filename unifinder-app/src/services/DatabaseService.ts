// Database Service - AsyncStorage based mock database for development
// This simulates a real database for testing purposes

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const USERS_KEY = 'unifinder_users';
const MATCHES_KEY = 'unifinder_matches';
const MESSAGES_KEY = 'unifinder_messages';

// User type for database
export interface DBUser {
  id: string;
  email: string;
  password: string; // In production, this would be hashed!
  fullName: string;
  department: string;
  classYear: string;
  bio: string;
  photos: string[]; // URLs in production, empty for now due to storage limits
  interests: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Match type
export interface DBMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

// Message type
export interface DBMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

// Database Service Class
class DatabaseService {
  // ==================== USER OPERATIONS ====================

  /**
   * Get all users from database
   */
  async getAllUsers(): Promise<DBUser[]> {
    try {
      const data = await AsyncStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('DB Error - getAllUsers:', error);
      return [];
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<DBUser | null> {
    try {
      const users = await this.getAllUsers();
      return users.find(user => user.id === id) || null;
    } catch (error) {
      console.error('DB Error - getUserById:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<DBUser | null> {
    try {
      const users = await this.getAllUsers();
      return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('DB Error - getUserByEmail:', error);
      return null;
    }
  }

  /**
   * Create a new user (Register)
   */
  async createUser(userData: {
    email: string;
    password: string;
    fullName: string;
    department: string;
    classYear: string;
    bio: string;
    interests: string[];
  }): Promise<{ success: boolean; user?: DBUser; error?: string }> {
    try {
      // Check if email already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        return { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' };
      }

      const users = await this.getAllUsers();
      
      const newUser: DBUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        email: userData.email.toLowerCase(),
        password: userData.password, // In production: hash this!
        fullName: userData.fullName,
        department: userData.department,
        classYear: userData.classYear,
        bio: userData.bio,
        photos: [], // Not storing photos in AsyncStorage due to size limits
        interests: userData.interests,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      console.log('DB: User created successfully:', newUser.email);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('DB Error - createUser:', error);
      return { success: false, error: 'Kullanıcı oluşturulurken bir hata oluştu.' };
    }
  }

  /**
   * Validate user login
   */
  async validateLogin(email: string, password: string): Promise<{ success: boolean; user?: DBUser; error?: string }> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        return { success: false, error: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.' };
      }

      if (user.password !== password) {
        return { success: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' };
      }

      console.log('DB: Login validated for:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('DB Error - validateLogin:', error);
      return { success: false, error: 'Giriş yapılırken bir hata oluştu.' };
    }
  }

  /**
   * Update user data
   */
  async updateUser(userId: string, updates: Partial<DBUser>): Promise<{ success: boolean; user?: DBUser; error?: string }> {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, error: 'Kullanıcı bulunamadı.' };
      }

      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      console.log('DB: User updated:', userId);
      return { success: true, user: users[userIndex] };
    } catch (error) {
      console.error('DB Error - updateUser:', error);
      return { success: false, error: 'Kullanıcı güncellenirken bir hata oluştu.' };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
      console.log('DB: User deleted:', userId);
      return true;
    } catch (error) {
      console.error('DB Error - deleteUser:', error);
      return false;
    }
  }

  /**
   * Get users for discovery (exclude current user and already matched)
   */
  async getDiscoverUsers(currentUserId: string): Promise<DBUser[]> {
    try {
      const users = await this.getAllUsers();
      const matches = await this.getMatchesForUser(currentUserId);
      const matchedUserIds = matches.map(m => m.user1Id === currentUserId ? m.user2Id : m.user1Id);
      
      return users.filter(u => u.id !== currentUserId && !matchedUserIds.includes(u.id));
    } catch (error) {
      console.error('DB Error - getDiscoverUsers:', error);
      return [];
    }
  }

  // ==================== MATCH OPERATIONS ====================

  /**
   * Create a match between two users
   */
  async createMatch(user1Id: string, user2Id: string): Promise<DBMatch | null> {
    try {
      const matches = await this.getAllMatches();
      
      // Check if match already exists
      const existingMatch = matches.find(
        m => (m.user1Id === user1Id && m.user2Id === user2Id) ||
             (m.user1Id === user2Id && m.user2Id === user1Id)
      );
      
      if (existingMatch) return existingMatch;

      const newMatch: DBMatch = {
        id: 'match_' + Date.now(),
        user1Id,
        user2Id,
        createdAt: new Date().toISOString(),
      };

      matches.push(newMatch);
      await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
      
      console.log('DB: Match created:', newMatch.id);
      return newMatch;
    } catch (error) {
      console.error('DB Error - createMatch:', error);
      return null;
    }
  }

  /**
   * Get all matches
   */
  async getAllMatches(): Promise<DBMatch[]> {
    try {
      const data = await AsyncStorage.getItem(MATCHES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('DB Error - getAllMatches:', error);
      return [];
    }
  }

  /**
   * Get matches for a specific user
   */
  async getMatchesForUser(userId: string): Promise<DBMatch[]> {
    try {
      const matches = await this.getAllMatches();
      return matches.filter(m => m.user1Id === userId || m.user2Id === userId);
    } catch (error) {
      console.error('DB Error - getMatchesForUser:', error);
      return [];
    }
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Send a message
   */
  async sendMessage(matchId: string, senderId: string, content: string): Promise<DBMessage | null> {
    try {
      const messages = await this.getAllMessages();
      
      const newMessage: DBMessage = {
        id: 'msg_' + Date.now(),
        matchId,
        senderId,
        content,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      messages.push(newMessage);
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      
      return newMessage;
    } catch (error) {
      console.error('DB Error - sendMessage:', error);
      return null;
    }
  }

  /**
   * Get all messages
   */
  async getAllMessages(): Promise<DBMessage[]> {
    try {
      const data = await AsyncStorage.getItem(MESSAGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('DB Error - getAllMessages:', error);
      return [];
    }
  }

  /**
   * Get messages for a match
   */
  async getMessagesForMatch(matchId: string): Promise<DBMessage[]> {
    try {
      const messages = await this.getAllMessages();
      return messages.filter(m => m.matchId === matchId).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error('DB Error - getMessagesForMatch:', error);
      return [];
    }
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Clear all database (for testing)
   */
  async clearDatabase(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([USERS_KEY, MATCHES_KEY, MESSAGES_KEY]);
      console.log('DB: Database cleared');
    } catch (error) {
      console.error('DB Error - clearDatabase:', error);
    }
  }

  /**
   * Get database stats (for debugging)
   */
  async getStats(): Promise<{ users: number; matches: number; messages: number }> {
    const users = await this.getAllUsers();
    const matches = await this.getAllMatches();
    const messages = await this.getAllMessages();
    
    return {
      users: users.length,
      matches: matches.length,
      messages: messages.length,
    };
  }

  /**
   * Seed database with test users (for development)
   */
  async seedTestUsers(): Promise<void> {
    const testUsers = [
      {
        email: 'test@edu.tr',
        password: '123456',
        fullName: 'Test Kullanıcı',
        department: 'Bilgisayar Mühendisliği',
        classYear: 'junior',
        bio: 'Merhaba! Ben test kullanıcısıyım.',
        interests: ['gaming', 'music', 'coding'],
      },
      {
        email: 'ayse@edu.tr',
        password: '123456',
        fullName: 'Ayşe Yılmaz',
        department: 'Psikoloji',
        classYear: 'sophomore',
        bio: 'Kitap okumayı ve kahve içmeyi severim ☕',
        interests: ['reading', 'cafe', 'psychology'],
      },
      {
        email: 'mehmet@edu.tr',
        password: '123456',
        fullName: 'Mehmet Kaya',
        department: 'Elektrik Elektronik Mühendisliği',
        classYear: 'senior',
        bio: 'Elektronik projeleri ve müzik ile ilgileniyorum.',
        interests: ['music', 'engineering', 'gaming'],
      },
    ];

    for (const user of testUsers) {
      await this.createUser(user);
    }
    
    console.log('DB: Test users seeded');
  }
}

// Export singleton instance
export const db = new DatabaseService();
export default db;
