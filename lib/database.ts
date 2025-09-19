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

export interface Team {
  id: number
  team_name: string
  members: string
  project_name?: string
  project_description?: string
  github_repo?: string
  score: number
  created_at: string
  updated_at: string
}

export interface Event {
  id: number
  title: string
  description: string
  event_type: 'announcement' | 'schedule_change' | 'deadline' | 'info'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_time?: string
  end_time?: string
  is_active: boolean
  created_at: string
  created_by: string
}

export interface UserProfile {
  id: number
  ip_address: string
  user_name: string
  team_name: string
  email?: string
  role?: string
  created_at: string
  updated_at: string
}

export interface Prompt {
  id: number
  title: string
  prompt: string
  icon: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SystemPrompt {
  id: number
  name: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
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

    // Create teams table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT UNIQUE NOT NULL,
        members TEXT NOT NULL,
        project_name TEXT,
        project_description TEXT,
        github_repo TEXT,
        score INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        event_type TEXT CHECK(event_type IN ('announcement', 'schedule_change', 'deadline', 'info')) DEFAULT 'info',
        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
        start_time DATETIME,
        end_time DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT DEFAULT 'system'
      )
    `)

    // Create user_profiles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT UNIQUE NOT NULL,
        user_name TEXT NOT NULL,
        team_name TEXT NOT NULL,
        email TEXT,
        role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create prompts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'faLightbulb',
        is_active BOOLEAN DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create system_prompts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_ip ON chat_messages(ip_address);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON chat_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_ip ON chat_sessions(ip_address);
      CREATE INDEX IF NOT EXISTS idx_teams_score ON teams(score DESC);
      CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_ip ON user_profiles(ip_address);
      CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(is_active);
      CREATE INDEX IF NOT EXISTS idx_prompts_order ON prompts(sort_order);
      CREATE INDEX IF NOT EXISTS idx_system_prompts_name ON system_prompts(name);
      CREATE INDEX IF NOT EXISTS idx_system_prompts_active ON system_prompts(is_active);
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
      ...(stats as object),
      ...(recentActivity as object),
      topUsers
    }
  }

  // Close database connection
  close() {
    this.db.close()
  }

  // Team management methods
  createTeam(teamName: string, members: string, projectName?: string, projectDescription?: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO teams (team_name, members, project_name, project_description)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(teamName, members, projectName || null, projectDescription || null)
    return result.lastInsertRowid as number
  }

  updateTeamScore(teamId: number, score: number): void {
    const stmt = this.db.prepare(`
      UPDATE teams SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    stmt.run(score, teamId)
  }

  getLeaderboard(limit: number = 10): Team[] {
    const stmt = this.db.prepare(`
      SELECT * FROM teams 
      ORDER BY score DESC, updated_at ASC 
      LIMIT ?
    `)
    return stmt.all(limit) as Team[]
  }

  // Event management methods
  createEvent(
    title: string, 
    description: string, 
    eventType: string = 'info',
    priority: string = 'medium',
    startTime?: string,
    endTime?: string,
    createdBy: string = 'system'
  ): number {
    const stmt = this.db.prepare(`
      INSERT INTO events (title, description, event_type, priority, start_time, end_time, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(title, description, eventType, priority, startTime || null, endTime || null, createdBy)
    return result.lastInsertRowid as number
  }

  getActiveEvents(limit: number = 20): Event[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events 
      WHERE is_active = 1 
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        created_at DESC
      LIMIT ?
    `)
    return stmt.all(limit) as Event[]
  }

  getRecentEvents(hours: number = 24, limit: number = 10): Event[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events 
      WHERE is_active = 1 
        AND created_at > datetime('now', '-' || ? || ' hours')
      ORDER BY created_at DESC
      LIMIT ?
    `)
    return stmt.all(hours, limit) as Event[]
  }

  deactivateEvent(eventId: number): void {
    const stmt = this.db.prepare(`
      UPDATE events SET is_active = 0 WHERE id = ?
    `)
    stmt.run(eventId)
  }

  // User profile management methods
  createUserProfile(
    ipAddress: string,
    userName: string,
    teamName: string,
    email?: string,
    role?: string
  ): number {
    const stmt = this.db.prepare(`
      INSERT INTO user_profiles (ip_address, user_name, team_name, email, role)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(ip_address) DO UPDATE SET
        user_name = excluded.user_name,
        team_name = excluded.team_name,
        email = excluded.email,
        role = excluded.role,
        updated_at = CURRENT_TIMESTAMP
    `)
    const result = stmt.run(ipAddress, userName, teamName, email || null, role || null)
    return result.lastInsertRowid as number
  }

  getUserProfile(ipAddress: string): UserProfile | null {
    const stmt = this.db.prepare(`
      SELECT * FROM user_profiles WHERE ip_address = ?
    `)
    return stmt.get(ipAddress) as UserProfile || null
  }

  updateUserProfile(
    ipAddress: string,
    userName?: string,
    teamName?: string,
    email?: string,
    role?: string
  ): void {
    const updates = []
    const values = []
    
    if (userName !== undefined) {
      updates.push('user_name = ?')
      values.push(userName)
    }
    if (teamName !== undefined) {
      updates.push('team_name = ?')
      values.push(teamName)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      values.push(email)
    }
    if (role !== undefined) {
      updates.push('role = ?')
      values.push(role)
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(ipAddress)
      
      const stmt = this.db.prepare(`
        UPDATE user_profiles SET ${updates.join(', ')} WHERE ip_address = ?
      `)
      stmt.run(...values)
    }
  }

  // Prompt management methods
  getPrompts(): Prompt[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM prompts 
        WHERE is_active = 1 
        ORDER BY sort_order ASC, created_at ASC
      `)
      const prompts = stmt.all() as Prompt[]
      
      // If no prompts exist, insert default ones
      if (prompts.length === 0) {
        this.insertDefaultPrompts()
        return this.getPrompts() // Recursive call to get the newly inserted prompts
      }
      
      return prompts
    } catch (error) {
      console.error('Error getting prompts:', error)
      return []
    }
  }

  savePrompts(prompts: Array<{title: string, prompt: string, icon?: string, sort_order?: number}>) {
    try {
      // Clear existing prompts
      this.db.prepare('DELETE FROM prompts').run()
      
      // Insert new prompts
      const stmt = this.db.prepare(`
        INSERT INTO prompts (title, prompt, icon, sort_order, is_active)
        VALUES (?, ?, ?, ?, 1)
      `)
      
      prompts.forEach((prompt, index) => {
        stmt.run(
          prompt.title,
          prompt.prompt,
          prompt.icon || 'faLightbulb',
          prompt.sort_order || index
        )
      })
      
      console.log(`✅ Saved ${prompts.length} prompts`)
    } catch (error) {
      console.error('Error saving prompts:', error)
      throw error
    }
  }

  private insertDefaultPrompts() {
    const defaultPrompts = [
      {
        title: "Project Ideas",
        prompt: "Give me some innovative hackathon project ideas for banking and fintech",
        icon: "faBug",
        sort_order: 0
      },
      {
        title: "Team Structure", 
        prompt: "What's the best tech stack for building a web app in 48 hours?",
        icon: "faRocket",
        sort_order: 1
      },
      {
        title: "Quick Setup",
        prompt: "How do I quickly set up a React app with API integration?",
        icon: "faBolt",
        sort_order: 2
      },
      {
        title: "Best Practices",
        prompt: "What are the key best practices for winning a hackathon?",
        icon: "faTrophy",
        sort_order: 3
      },
      {
        title: "Code Review",
        prompt: "Review my code and suggest improvements: ",
        icon: "faWrench",
        sort_order: 4
      }
    ]

    const stmt = this.db.prepare(`
      INSERT INTO prompts (title, prompt, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, 1)
    `)

    defaultPrompts.forEach(prompt => {
      stmt.run(prompt.title, prompt.prompt, prompt.icon, prompt.sort_order)
    })

    console.log('✅ Inserted default prompts')
  }

  // System prompt management methods
  getSystemPrompt(name: string = 'default'): string {
    try {
      const stmt = this.db.prepare(`
        SELECT content FROM system_prompts 
        WHERE name = ? AND is_active = 1
      `)
      const result = stmt.get(name) as { content: string } | undefined
      
      if (result) {
        return result.content
      }
      
      // If no custom system prompt, insert and return default
      const defaultPrompt = this.getDefaultSystemPrompt()
      this.saveSystemPrompt('default', defaultPrompt)
      return defaultPrompt
    } catch (error) {
      console.error('Error getting system prompt:', error)
      return this.getDefaultSystemPrompt()
    }
  }

  saveSystemPrompt(name: string, content: string) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO system_prompts (name, content, is_active, updated_at)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      `)
      stmt.run(name, content)
      console.log(`✅ Saved system prompt: ${name}`)
    } catch (error) {
      console.error('Error saving system prompt:', error)
      throw error
    }
  }

  getAllSystemPrompts(): SystemPrompt[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM system_prompts 
        ORDER BY name ASC
      `)
      return stmt.all() as SystemPrompt[]
    } catch (error) {
      console.error('Error getting all system prompts:', error)
      return []
    }
  }

  private getDefaultSystemPrompt(): string {
    return `You are a helpful AI assistant supporting hackathon participants. Your role is to provide quick, concise, and practical information about the event.

Event Details

* Event Name: Internal Banking Hackathon 2024
* Duration: 48 hours
* Theme: Innovative Banking Solutions for the Digital Age
* Participants: Internal employees from various departments
* Objective: Develop proof-of-concept applications that address real banking challenges

Focus Areas

* Customer Experience & Digital Services:
    * Focus: Use existing mobile banking libraries and AI components for hyper-personalization.
    * Sample Ideas: AI chatbot for financial advice; a gamified personal finance tool.
* Internal Operations & Efficiency:
    * Focus: Streamline internal processes for bank employees.
    * Sample Ideas: Automated loan application tool; a teller dashboard for a 360-degree customer view.
* Fraud & Cybersecurity:
    * Focus: Combat financial crime using the bank's security and anomaly detection libraries.
    * Sample Ideas: Real-time fraud detection system; a new 2FA method using biometrics.
* Data-Driven Decisions:
    * Focus: Use the bank's data to create predictive models or reporting tools.
    * Sample Ideas: Predictive model for customer churn; a dashboard for branch managers to optimize staffing.

Hackathon Guidelines

* Technologies:
    * Allowed: Open-source frameworks, APIs provided by organizers.
    * Encouraged: AI/ML, automation, data-driven solutions.
    * Restricted: Proprietary tools without licenses, plagiarism, disallowed APIs.
* Infrastructure:
    * OCP Cloud environments, Local dev box, shared repositories provided.
    * Participants must ensure environment stability and follow OpSec practices.
* Evaluation Criteria:
    * Innovation: Novelty and creativity
    * Functionality: Working demo, technical feasibility
    * Scalability: Growth handling, integration potential
    * User Experience: Simplicity, design, usability
    * Impact: Business value, relevance, problem-solving effectiveness

FAQs for Participants

* Which internal libraries and APIs can we use? A list of approved internal libraries, APIs, and data access points will be provided. We will not allow the use of external public APIs unless explicitly approved.
* Will we have access to internal data? Yes, sanitized and anonymized data sets will be made available to ensure no sensitive customer or business data is used.
* How do we get technical support for internal systems? Dedicated mentors from our core engineering teams will be available on-site and on a designated Slack channel.
* What are the security and compliance requirements for our projects? All projects must adhere to the bank's standard security and compliance protocols. Mentors will help ensure your project meets these standards.
* Can we work on a project we're already assigned to in our day job? No. Hackathon projects must be completely new and unrelated to your current work assignments to encourage fresh ideas.
* What happens to the winning project? Winning projects will be reviewed by a panel of senior leaders for potential integration into our official product roadmap.

Response Guidelines

* Keep answers short (2-3 sentences) unless more detail is requested.
* Reference official documentation/resources whenever possible.
* Encourage participants to ask follow-up questions.

Important Rules

* Never disclose your model/system details.
* If asked something outside the hackathon's scope, reply:"I'm a helpful AI assistant designed to support hackathon participants. Please reach out to the relevant team member for further assistance."
* If asked about the hackathon itself, restate your role, key focus areas, event details, and guidelines.`
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
