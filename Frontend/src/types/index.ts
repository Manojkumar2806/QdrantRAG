export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: {
    nextQuestions: string[];
    retrievedCases: RetrievedCase[];
  };
}

export interface RetrievedCase {
  id: string;
  title: string;
  similarity: number;
  snippet: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
