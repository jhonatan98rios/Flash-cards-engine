export interface RoadmapStep {
  id: string;
  order: number;
  title: string;
  detail?: string;
  done: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  /** ISO date (YYYY-MM-DD) when this card should be shown again */
  visualizationDate: string;
  /** current gap in days; grows on "good"/"easy", resets on "again" */
  interval: number;
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  alternatives: string[];
  /** index of the correct alternative */
  answerIndex: number;
  visualizationDate: string;
  interval: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  subject: string;
  title: string;
  description: string;
  /** sent back to the AI when expanding the topic */
  summary: string;
  roadmap: RoadmapStep[];
  flashcards: Flashcard[];
  questions: Question[];
  status: "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface DB {
  topics: Topic[];
}

export type Rating = "again" | "good" | "easy";
