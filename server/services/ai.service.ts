import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class AIService {
  private static model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * Generates localized career and technical tips for a student based on their data.
   */
  static async generatePerformanceInsights(studentData: any) {
    const prompt = `
      You are an expert Placement Officer at an engineering college. 
      Analyze the following student profile and provide 3 actionable, professional improvement tips.
      
      Student Profile:
      - CGPA: ${studentData.cgpa}
      - Department: ${studentData.department}
      - Skills: ${studentData.skills || 'Not provided'}
      - Recent Scores: ${JSON.stringify(studentData.results || [])}
      
      Format the response as a JSON array of objects:
      [
        { "title": "...", "detail": "...", "icon": "Zap | Trophy | Lightbulb", "color": "indigo | emerald | amber" }
      ]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      // Basic JSON extraction to ensure resilience
      const jsonMatch = text.match(/\[.*\]/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error('AI Insights Error:', error);
      return [];
    }
  }

  /**
   * Analyzes a student's match for a specific company based on the criteria.
   */
  static async analyzeCompanyMatch(student: any, company: any) {
    const prompt = `
      Compare this student with the company requirements and provide a match analysis.
      
      Student:
      - CGPA: ${student.cgpa}
      - Backlogs: ${student.backlogs}
      - Skills: ${student.skills || 'Not specified'}
      
      Company Requirements:
      - Min CGPA: ${company.minCgpa}
      - Max Backlogs: ${company.maxBacklogs}
      - Cutoffs: Aptitude ${company.aptitudeCutoff}, Coding ${company.codingCutoff}
      
      Provide a match percentage (0-100) and a brief reason.
      Format: { "match": 85, "reason": "Reasoning here..." }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { match: 0, reason: "Analysis unavailable" };
    } catch (error) {
      console.error('AI Matching Error:', error);
      return { match: 0, reason: "Error in analysis" };
    }
  }
}
