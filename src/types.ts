export type Role = 'staff' | 'admin' | 'guest' | 'student';

export interface Student {
  id: string;
  registerNumber: string;
  name: string;
  email: string;
  department: string;
  cgpa: number;
  marks10th: number;
  marks12th: number;
  backlogs: number;
  readinessScore: number;
  skills: { [key: string]: number };
  resumeUrl: string;
  bio: string;
  testHistory: { testName: string; score: number; date: string }[];
}

export interface Test {
  id: string;
  name: string;
  timeLimit: number; // in minutes
  isStrict: boolean;
  questionCount: number;
  status: 'active' | 'draft' | 'completed';
  isResultPublished?: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
  isImageMode?: boolean;
}

export interface Question {
  id: string;
  type: 'mcq' | 'visual-mcq' | 'passage' | 'numeric' | 'situational';
  title: string;
  isTitleImageMode?: boolean;
  content?: string; // For passage
  imageUrl?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  points?: number;
  isValid: boolean;
}

export interface Company {
  id: string;
  name: string;
  minCgpa: number;
  min10th: number;
  min12th: number;
  maxBacklogs: number;
  aptitudeCutoff: number;
  codingCutoff: number;
  skills: string[];
  visitDate: string;
  jobDescription?: string;
}

export interface TestAssignment {
  testId: string;
  targets: string[]; // ['Batch of 2025', 'CSE', etc.]
  studentIds: string[]; // Specific students
  startDate: string;
  endDate: string;
  instantResults: boolean;
}

export type Page = 
  | 'dashboard' 
  | 'students' 
  | 'tests' 
  | 'results' 
  | 'company-analysis'
  | 'student-dashboard'
  | 'student-tests'
  | 'student-profile'
  | 'student-analytics';
