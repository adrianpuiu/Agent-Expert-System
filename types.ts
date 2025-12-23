export enum ExpertType {
  DATABASE = 'Database',
  API = 'API',
  WEBSOCKET = 'WebSocket',
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  META = 'Meta'
}

export enum ExpertStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  LEARNING = 'learning',
  THINKING = 'thinking',
  QUEUED = 'queued'
}

export enum TaskPriority {
  LOW = 0,      // Background optimization, self-improvement
  MEDIUM = 1,   // Standard analysis
  HIGH = 2,     // Manual training, explicit requests
  CRITICAL = 3  // User chat interactions
}

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface AgentTask {
  id: string;
  expertId: string;
  type: 'CHAT' | 'IMPROVE' | 'TRAIN' | 'COLLABORATION';
  priority: TaskPriority;
  status: TaskStatus;
  payload: any;
  timestamp: number;
  description: string;
}

export interface ExpertiseHistory {
  version: number;
  content: string;
  timestamp: string;
  reason: string;
}

export interface Expert {
  id: string;
  name: string;
  type: ExpertType;
  description: string;
  status: ExpertStatus;
  learnings: number;
  lastUpdated: string;
  expertise: string; // YAML string representing the mental model
  version: number;
  history: ExpertiseHistory[];
}

export interface LogEntry {
  id: string;
  expertId: string;
  expertName: string;
  action: 'Created' | 'Self-Improved' | 'Queried' | 'Error' | 'Collaboration' | 'Reverted' | 'Task Queued' | 'Task Complete';
  details: string;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}