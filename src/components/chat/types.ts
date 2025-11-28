export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  hasArtifact?: boolean;
  artifactData?: any;
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
