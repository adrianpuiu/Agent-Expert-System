
export enum ExpertType {
  DATABASE = 'Database',
  API = 'API',
  WEBSOCKET = 'WebSocket',
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  DEVOPS = 'DevOps',
  SECURITY = 'Security',
  MOBILE = 'Mobile',
  QA = 'QA',
  UX = 'UX',
  DATA = 'Data',
  META = 'Meta',
  PRODUCT = 'Product',
  AI_RESEARCH = 'AI Research',
  DOCS = 'Docs'
}

export enum ExpertStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  LEARNING = 'learning',
  THINKING = 'thinking',
  QUEUED = 'queued',
  COLLABORATING = 'collaborating'
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
  type: 'CHAT' | 'IMPROVE' | 'TRAIN' | 'COLLABORATION' | 'RESEARCH';
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
  collaboratingWith?: string;
  collaborationTopic?: string;
}

export interface ToolLogData {
  toolName: string;
  input: any;
  output: string;
}

export interface LogEntry {
  id: string;
  expertId: string;
  expertName: string;
  action: 'Created' | 'Self-Improved' | 'Queried' | 'Error' | 'Collaboration' | 'Reverted' | 'Task Queued' | 'Task Complete' | 'Tool Used';
  details: string;
  toolData?: ToolLogData;
  timestamp: string;
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  image?: string; // Base64 Data URL
  timestamp: number;
  sources?: SearchSource[];
}

export interface WarRoomMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  role: 'expert' | 'moderator';
  content: string;
  timestamp: number;
  isConsensus?: boolean;
  sources?: SearchSource[];
}