import Database from 'better-sqlite3'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'

// Database interface for TypeScript
export interface ChatMessage {
  id: number
  ip_address: string
  message: string
  role: 'user' | 'bot'
  timestamp: string
  session_id?: string
  user_agent?: string
}

export interface ChatSession {
  ip_address: string
  session_id: string
  first_seen: string
  last_seen: string
  message_count: number
}

class ChatDatabase {
  private db: Database.Database

  constructor() {
    // Create database directory if it doesn't exist
    const dbDir = path.join(process.cwd(), 'data')
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    // Initialize database
    const dbPath = path.join(dbDir, 'hackathon-chat.db')
    this.db = new Database(dbPath)
    
    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL')
    
    this.initializeTables()
  }

  private initializeTables() {
    // Create chat_messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        session_id TEXT,
        message TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'bot')),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        message_length INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create chat_sessions table for analytics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        session_id TEXT UNIQUE NOT NULL,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_ip ON chat_messages(ip_address);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON chat_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_ip ON chat_sessions(ip_address);
    `)

    console.log('✅ Database tables initialized')
  }

  // Save a chat message
  saveMessage(
    ipAddress: string,
    message: string,
    role: 'user' | 'bot',
    sessionId?: string,
    userAgent?: string
  ): number {
    const stmt = this.db.prepare(`
      INSERT INTO chat_messages (ip_address, session_id, message, role, user_agent, message_length)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      ipAddress,
      sessionId || null,
      message,
      role,
      userAgent || null,
      message.length
    )

    // Update session info
    if (sessionId) {
      this.updateSession(ipAddress, sessionId, userAgent)
    }

    return result.lastInsertRowid as number
  }

  // Get chat history for an IP address
  getChatHistory(ipAddress: string, limit: number = 50): ChatMessage[] {
    const stmt = this.db.prepare(`
      SELECT id, ip_address, session_id, message, role, timestamp, user_agent
      FROM chat_messages 
      WHERE ip_address = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `)
    
    return stmt.all(ipAddress, limit) as ChatMessage[]
  }

  // Get recent chat history for a session
  getSessionHistory(sessionId: string, limit: number = 50): ChatMessage[] {
    const stmt = this.db.prepare(`
      SELECT id, ip_address, session_id, message, role, timestamp, user_agent
      FROM chat_messages 
      WHERE session_id = ?
      ORDER BY timestamp ASC
      LIMIT ?
    `)
    
    return stmt.all(sessionId, limit) as ChatMessage[]
  }

  // Update or create session info
  private updateSession(ipAddress: string, sessionId: string, userAgent?: string) {
    const stmt = this.db.prepare(`
      INSERT INTO chat_sessions (ip_address, session_id, user_agent, message_count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen = CURRENT_TIMESTAMP,
        message_count = message_count + 1
    `)
    
    stmt.run(ipAddress, sessionId, userAgent || null)
  }

  // Get analytics data
  getAnalytics() {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(DISTINCT ip_address) as unique_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages,
        AVG(message_length) as avg_message_length
      FROM chat_messages
    `).get()

    const recentActivity = this.db.prepare(`
      SELECT 
        COUNT(*) as messages_last_hour
      FROM chat_messages
      WHERE timestamp > datetime('now', '-1 hour')
    `).get()

    const topUsers = this.db.prepare(`
      SELECT 
        ip_address,
        COUNT(*) as message_count,
        MAX(timestamp) as last_seen
      FROM chat_messages
      GROUP BY ip_address
      ORDER BY message_count DESC
      LIMIT 10
    `).all()

    return {
      ...stats,
      ...recentActivity,
      topUsers
    }
  }

  // Close database connection
  close() {
    this.db.close()
  }

  // Get database instance for custom queries
  getDb() {
    return this.db
  }
}

// Singleton instance
let dbInstance: ChatDatabase | null = null

export function getDatabase(): ChatDatabase {
  if (!dbInstance) {
    dbInstance = new ChatDatabase()
  }
  return dbInstance
}

export default ChatDatabase
