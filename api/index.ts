import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Prisma singleton for serverless
declare global { var __prisma: PrismaClient | undefined; }
const prisma = global.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

// Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const studentRegex = /^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)\d{6}@smvec\.ac\.in$/;
const staffRegex = /^[a-z]+\.((cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca))@smvec\.ac\.in$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url = '/', method = 'GET' } = req;
  const path = url.replace(/\?.*$/, ''); // strip query string

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') return res.status(200).end();

  try {
    // Debug
    if (path === '/api/debug') {
      return res.json({
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlStart: process.env.DATABASE_URL?.substring(0, 35) + '...',
        nodeEnv: process.env.NODE_ENV,
        path,
        method,
      });
    }

    // Health
    if (path === '/api/health') {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return res.json({ status: 'ok', db: 'connected' });
      } catch {
        return res.json({ status: 'ok', db: 'error' });
      }
    }

    // Google Auth
    if (path === '/api/auth/google' && method === 'POST') {
      const { credential } = req.body;
      if (!credential) return res.status(400).json({ error: 'Missing credential' });

      const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
      const { email, name, sub: googleId } = payload;

      let user = await prisma.user.findUnique({
        where: { email },
        include: { studentProfile: true, staffProfile: true }
      });

      if (!user) {
        const role = staffRegex.test(email) ? 'STAFF' : 'STUDENT';
        user = await prisma.user.create({
          data: {
            email, name, role, googleId,
            ...(role === 'STUDENT' ? {
              studentProfile: { create: {
                registerNumber: email.split('@')[0],
                department: email.match(/^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)/)?.[0].toUpperCase() || 'UNKNOWN'
              }}
            } : {
              staffProfile: { create: {
                department: email.split('.')[1]?.split('@')[0].toUpperCase() || 'GENERAL'
              }}
            })
          },
          include: { studentProfile: true, staffProfile: true }
        });
      }
      return res.json(user);
    }

    // Email Auth
    if (path === '/api/auth/email' && method === 'POST') {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Missing email' });

      // Allow admin credentials
      const isAdmin = email === 'admin.clg.com' || email === 'admin@smvec.ac.in';

      if (!isAdmin && !studentRegex.test(email) && !staffRegex.test(email)) {
        return res.status(400).json({ error: 'Please use a valid SMVEC email (e.g. cse123456@smvec.ac.in)' });
      }

      let user = await prisma.user.findUnique({
        where: { email },
        include: { studentProfile: true, staffProfile: true }
      });

      if (!user) {
        const role = isAdmin || staffRegex.test(email) ? 'STAFF' : 'STUDENT';
        user = await prisma.user.create({
          data: {
            email, name: isAdmin ? 'Admin' : email.split('@')[0], role,
            ...(role === 'STUDENT' ? {
              studentProfile: { create: {
                registerNumber: email.split('@')[0],
                department: email.match(/^(cse|ece|eee|it|ice|mech|civil|bme|mechtr|cce|aids|arch|mba|mca)/)?.[0].toUpperCase() || 'UNKNOWN'
              }}
            } : {
              staffProfile: { create: {
                department: isAdmin ? 'ADMIN' : (email.split('.')[1]?.split('@')[0].toUpperCase() || 'GENERAL')
              }}
            })
          },
          include: { studentProfile: true, staffProfile: true }
        });
      }
      return res.json(user);
    }

    // Dashboard Stats
    if (path === '/api/dashboard/stats' && method === 'GET') {
      const [totalStudents, activeTests, students] = await Promise.all([
        prisma.studentProfile.count(),
        prisma.createdAssessment.count({ where: { status: 'LIVE' } }),
        prisma.studentProfile.findMany(),
      ]);
      const eligibleCount = students.filter(s => s.cgpa >= 7.5).length;
      const avgReadiness = students.length > 0
        ? Math.round(students.reduce((acc, s) => acc + s.readinessScore, 0) / students.length)
        : 0;
      return res.json({ totalStudents, activeTests, eligibleCount, avgReadiness });
    }

    // Companies
    if (path === '/api/companies') {
      if (method === 'GET') {
        const companies = await prisma.company.findMany();
        return res.json(companies);
      }
      if (method === 'POST') {
        const { name, minCgpa, maxBacklogs, aptitudeCutoff, codingCutoff } = req.body;
        const company = await prisma.company.create({
          data: { name, minCgpa: parseFloat(minCgpa), maxBacklogs: parseInt(maxBacklogs), aptitudeCutoff: parseFloat(aptitudeCutoff), codingCutoff: parseFloat(codingCutoff) }
        });
        return res.json(company);
      }
    }

    // Students
    if (path === '/api/students' && method === 'GET') {
      const students = await prisma.studentProfile.findMany({ include: { user: true, results: true } });
      return res.json(students);
    }

    // AI Insights
    if (path.startsWith('/api/student/ai-insights/') && method === 'GET') {
      const studentId = path.split('/').pop();
      const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, include: { results: true } });
      if (!student) return res.status(404).json({ error: 'Student not found' });

      const prompt = `You are a placement officer. Analyze this student and give 3 tips.
CGPA: ${student.cgpa}, Dept: ${student.department}, Scores: ${JSON.stringify(student.results?.map(r => r.score))}
Return JSON array: [{"title":"...","detail":"...","icon":"Zap|Trophy|Lightbulb","color":"indigo|emerald|amber"}]`;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const match = text.match(/\[.*\]/s);
        return res.json(match ? JSON.parse(match[0]) : []);
      } catch {
        return res.json([]);
      }
    }

    // Assessments
    if (path === '/api/assessments') {
      if (method === 'GET') {
        const assessments = await prisma.createdAssessment.findMany({ include: { questions: true, _count: { select: { results: true } } } });
        return res.json(assessments);
      }
      if (method === 'POST') {
        const { title, description, duration, questions, creatorId } = req.body;
        const assessment = await prisma.createdAssessment.create({
          data: { title, description, duration, creatorId, status: 'LIVE',
            questions: { create: questions.map((q: any) => ({ text: q.text, type: q.type, options: JSON.stringify(q.options), correctAnswer: q.correctAnswer, points: q.points })) }
          },
          include: { questions: true }
        });
        return res.json(assessment);
      }
    }

    // Submit Assessment
    if (path.match(/^\/api\/assessments\/.+\/submit$/) && method === 'POST') {
      const assessmentId = path.split('/')[3];
      const { studentId, answers } = req.body;
      const assessment = await prisma.createdAssessment.findUnique({ where: { id: assessmentId }, include: { questions: true } });
      if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

      let score = 0;
      assessment.questions.forEach(q => { if (answers[q.id] === q.correctAnswer) score += q.points; });

      const result = await prisma.assessmentResult.create({ data: { studentId, assessmentId, score, answers: JSON.stringify(answers) } });
      const allResults = await prisma.assessmentResult.findMany({ where: { studentId } });
      const avgScore = allResults.reduce((acc, r) => acc + r.score, 0) / allResults.length;
      await prisma.studentProfile.update({ where: { id: studentId }, data: { readinessScore: Math.round(avgScore) } });
      return res.json(result);
    }

    return res.status(404).json({ error: 'Route not found', path });
  } catch (error: any) {
    console.error('[API Error]', error?.message);
    return res.status(500).json({ error: 'Internal server error', detail: error?.message });
  }
}
