import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Prisma 7 serverless-safe initialization
// Must pass env vars explicitly since prisma.config.ts is not available at runtime
declare global { var __prisma: PrismaClient | undefined; }
const prisma = global.__prisma ?? new PrismaClient();
global.__prisma = prisma;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Debug Route (removes sensitive info, safe for production) ---
app.get('/api/debug', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  res.json({
    hasDbUrl: !!dbUrl,
    dbUrlStart: dbUrl ? dbUrl.substring(0, 30) + '...' : 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    prismaVersion: '7.7.0',
  });
});

// --- Health Check ---
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.json({ status: 'ok', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// --- Auth Routes ---
// Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ error: 'Missing credential' });
  }

  try {
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
    const { email, name, sub: googleId } = payload;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true, staffProfile: true }
    });

    if (!user) {
      const studentRegex = /^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)\d{6}@smvec\.ac\.in$/;
      const staffRegex = /^[a-z]+\.((cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca))@smvec\.ac\.in$/;

      let role = 'STUDENT';
      if (staffRegex.test(email)) {
        role = 'STAFF';
      } else if (studentRegex.test(email)) {
        role = 'STUDENT';
      }

      user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          googleId,
          ...(role === 'STUDENT' ? {
            studentProfile: {
              create: {
                registerNumber: email.split('@')[0],
                department: email.match(/^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)/)?.[0].toUpperCase() || 'UNKNOWN'
              }
            }
          } : {
            staffProfile: {
              create: {
                department: email.split('.')[1]?.split('@')[0].toUpperCase() || 'GENERAL'
              }
            }
          })
        },
        include: { studentProfile: true, staffProfile: true }
      });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Auth Error:', error?.message || error);
    res.status(500).json({ error: 'Authentication failed', detail: error?.message });
  }
});

// Email-based Login (no OTP needed — direct lookup/creation)
app.post('/api/auth/email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true, staffProfile: true }
    });

    if (!user) {
      const studentRegex = /^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)\d{6}@smvec\.ac\.in$/;
      const staffRegex = /^[a-z]+\.((cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca))@smvec\.ac\.in$/;

      // Validate the email is an SMVEC email
      if (!studentRegex.test(email) && !staffRegex.test(email)) {
        return res.status(400).json({ error: 'Please use a valid SMVEC email address (e.g. cse123456@smvec.ac.in)' });
      }

      let role = staffRegex.test(email) ? 'STAFF' : 'STUDENT';
      const name = email.split('@')[0];

      user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          ...(role === 'STUDENT' ? {
            studentProfile: {
              create: {
                registerNumber: email.split('@')[0],
                department: email.match(/^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)/)?.[0].toUpperCase() || 'UNKNOWN'
              }
            }
          } : {
            staffProfile: {
              create: {
                department: email.split('.')[1]?.split('@')[0].toUpperCase() || 'GENERAL'
              }
            }
          })
        },
        include: { studentProfile: true, staffProfile: true }
      });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Email Auth Error:', error?.message || error);
    res.status(500).json({ error: 'Authentication failed', detail: error?.message });
  }
});

import { AIService } from './services/ai.service';

// --- Dashboard Stats ---
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalStudents = await prisma.studentProfile.count();
    const activeTests = await prisma.createdAssessment.count({ where: { status: 'LIVE' } });
    const students = await prisma.studentProfile.findMany();
    
    const eligibleCount = students.filter(s => s.cgpa >= 7.5).length;
    const avgReadiness = students.length > 0 
      ? Math.round(students.reduce((acc, s) => acc + s.readinessScore, 0) / students.length) 
      : 0;

    res.json({ totalStudents, activeTests, eligibleCount, avgReadiness });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// --- Company Routes ---
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', async (req, res) => {
  const { name, minCgpa, maxBacklogs, aptitudeCutoff, codingCutoff } = req.body;
  try {
    const company = await prisma.company.create({
      data: {
        name,
        minCgpa: parseFloat(minCgpa),
        maxBacklogs: parseInt(maxBacklogs),
        aptitudeCutoff: parseFloat(aptitudeCutoff),
        codingCutoff: parseFloat(codingCutoff),
      }
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: { user: true, results: true }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// --- AI Insights Route ---
app.get('/api/student/ai-insights/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { results: true }
    });
    
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    const insights = await AIService.generatePerformanceInsights(student);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'AI Insight failed' });
  }
});

// --- Assessment Routes ---
app.get('/api/assessments', async (req, res) => {
  try {
    const assessments = await prisma.createdAssessment.findMany({
      include: { 
        questions: true,
        _count: { select: { results: true } }
      }
    });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

app.post('/api/assessments', async (req, res) => {
  const { title, description, duration, questions, creatorId } = req.body;
  try {
    const assessment = await prisma.createdAssessment.create({
      data: {
        title,
        description,
        duration,
        creatorId,
        status: 'LIVE',
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            type: q.type,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            points: q.points
          }))
        }
      },
      include: { questions: true }
    });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

app.post('/api/assessments/:id/submit', async (req, res) => {
  const { id: assessmentId } = req.params;
  const { studentId, answers } = req.body;

  try {
    const assessment = await prisma.createdAssessment.findUnique({
      where: { id: assessmentId },
      include: { questions: true }
    });

    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    let score = 0;
    assessment.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score += q.points;
      }
    });

    const result = await prisma.assessmentResult.create({
      data: {
        studentId,
        assessmentId,
        score,
        answers: JSON.stringify(answers)
      }
    });

    // Update student readiness score based on results
    const allResults = await prisma.assessmentResult.findMany({
      where: { studentId }
    });
    const avgScore = allResults.reduce((acc, r) => acc + r.score, 0) / allResults.length;
    
    await prisma.studentProfile.update({
      where: { id: studentId },
      data: { readinessScore: Math.round(avgScore) }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Submission failed' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
