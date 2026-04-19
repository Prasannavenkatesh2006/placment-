import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  ChevronRight, 
  ShieldAlert, 
  CheckCircle2, 
  History,
  AlertTriangle,
  LayoutGrid,
  ChevronLeft,
  Maximize2,
  Building2,
  Download,
  Trophy,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TestStatus = 'pending' | 'completed' | 'expired';

const COLORS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-t-indigo-500', shadow: 'shadow-indigo-100/50' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-t-emerald-500', shadow: 'shadow-emerald-100/50' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-t-amber-500', shadow: 'shadow-amber-100/50' },
  { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-t-sky-500', shadow: 'shadow-sky-100/50' },
];

export const StudentTests: React.FC<{ user: any }> = ({ user }) => {
  const [activeStatus, setActiveStatus] = useState<TestStatus>('pending');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const data = await api.staff.getAssessments();
      setAssessments(data);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Transform API assessments into display format
  const testList = assessments.map((a: any) => ({
    id: a.id,
    name: a.title,
    company: 'PlacementOS',
    duration: `${a.duration || 60} min`,
    date: a.status === 'LIVE' ? 'Scheduled' : a.status === 'COMPLETED' ? 'Completed' : 'Draft',
    status: a.status === 'LIVE' ? 'pending' as TestStatus : a.status === 'COMPLETED' ? 'completed' as TestStatus : 'expired' as TestStatus,
    score: a._count?.results > 0 ? '85%' : undefined,
    questions: a.questions,
    questionCount: a.questions?.length || 0,
  }));

  const publishedTests = assessments.filter((a: any) => a.isResultPublished);

  const startTest = (test: any) => {
    setActiveTest(test);
    setIsPlaying(true);
  };

  const downloadHallTicket = (test: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Entrance Hall Ticket", 14, 22);
    doc.setFontSize(10);
    doc.text(`Candidate Registry ID: AIS-STUDENT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, 14, 30);
    
    const data = [
      ["Assessment Name", test.name],
      ["Organizing Entity", test.company],
      ["Scheduled Duration", test.duration],
      ["Protocol", "Strict Virtual Proctoring"],
      ["Valid Until", test.date]
    ];
    
    autoTable(doc, {
      startY: 40,
      head: [['Identity Field', 'Authorization Detail']],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`hall_ticket_${test.id}.pdf`);
  };

  const downloadScorecard = (test: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Official Assessment Scorecard", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Completed On: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const data = [
      ["Test Title", test.name],
      ["Host Company", test.company],
      ["Final Result", test.score || 'N/A'],
      ["Verification", "AI-Verified Integrity"]
    ];
    
    autoTable(doc, {
      startY: 40,
      head: [['Attribute', 'Performance Metric']],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    doc.save(`scorecard_${test.id}.pdf`);
  };

  if (isPlaying && activeTest) {
    return <TestPlayer onExit={() => { setIsPlaying(false); fetchAssessments(); }} test={activeTest} studentId={user.email} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Test Portal</h2>
          <p className="text-slate-500 font-medium">Attempt assigned assessments and view your performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsResultModalOpen(true)} className="gap-2 h-14 px-8 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
             <Trophy className="w-5 h-5" /> View Results
          </Button>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {(['pending', 'completed', 'expired'] as TestStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeStatus === status 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              {status}
            </button>
          ))}
          </div>
        </div>
      </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testList.filter(t => t.status === activeStatus).map((test, idx) => {
          const color = COLORS[idx % COLORS.length];
          return (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn(
                "group border-none shadow-xl bg-white hover:scale-105 transition-all rounded-[2rem] overflow-hidden border-t-4",
                color.shadow,
                test.status === 'pending' ? color.border : 'border-t-slate-200'
              )}>
                 <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                       <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          test.status === 'pending' ? color.bg : 
                          test.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                       )}>
                          {test.status === 'pending' ? <Clock className={cn("w-6 h-6", color.text)} /> : 
                           test.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <History className="w-6 h-6" />}
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">ID: {test.id.slice(0,8)}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{test.name}</h3>
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2",
                      color.text
                    )}>
                       <Building2 className="w-3 h-3" /> {test.company}
                    </p>

                  <div className="space-y-3 mb-8">
                     <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400 uppercase tracking-widest">Duration</span>
                        <span className="text-slate-700">{test.duration}</span>
                     </div>
                     <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400 uppercase tracking-widest">Questions</span>
                        <span className="text-slate-700">{test.questionCount}</span>
                     </div>
                     <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400 uppercase tracking-widest">{test.status === 'completed' ? 'Final Score' : 'Status'}</span>
                        <span className={cn(
                           "px-2 py-0.5 rounded-full text-[9px] uppercase",
                           test.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                           test.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        )}>{test.date}</span>
                     </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant={test.status === 'pending' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1 rounded-2xl h-12 shadow-lg",
                        test.status === 'pending' ? "shadow-indigo-100" : "border-slate-200"
                      )}
                      disabled={test.status === 'expired'}
                      onClick={() => test.status === 'pending' && startTest(test)}
                    >
                      {test.status === 'pending' ? 'Start Assessment' : 
                       test.status === 'completed' ? 'View Feedback' : 'Expired'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-12 h-12 rounded-2xl shrink-0 border-slate-200"
                      onClick={() => test.status === 'pending' ? downloadHallTicket(test) : downloadScorecard(test)}
                      disabled={test.status === 'expired'}
                    >
                      <Download className="w-5 h-5 text-slate-400" />
                    </Button>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        );
      })}
      </div>

      {testList.filter(t => t.status === activeStatus).length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
               <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Tests Found</h3>
            <p className="text-slate-400 font-medium">Everything is quiet on this end. Enjoy your break!</p>
         </div>
      )}

      {/* Published Results Modal */}
      <AnimatePresence>
        {isResultModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsResultModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <div>
                  <h3 className="text-2xl font-black">Official Results Portal</h3>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mt-1">Verified scores & analytics</p>
                </div>
                <button onClick={() => setIsResultModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {publishedTests.length > 0 ? (
                  publishedTests.map((test: any) => (
                    <div key={test.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <Trophy className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900">{test.title}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{test.questions?.length || 0} Questions | Proctored</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <div className="px-5 py-2 bg-indigo-600 rounded-2xl text-white font-black text-xl shadow-lg shadow-indigo-100">
                             {test._count?.results || 0} Attempts
                           </div>
                           <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Published</span>
                        </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h5 className="font-bold text-slate-900">No Results Published Yet</h5>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">Check back later once the staff has finalized the assessments.</p>
                  </div>
                )}
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100">
                <Button className="w-full py-8 text-lg font-black rounded-3xl shadow-xl shadow-indigo-100 uppercase tracking-widest" onClick={() => setIsResultModalOpen(false)}>
                  I Understand
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TestPlayer: React.FC<{ onExit: () => void; test: any; studentId: string }> = ({ onExit, test, studentId }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState((test.duration || 60) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);
  const [hasWarning, setHasWarning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    const triggerWarning = () => {
      setHasWarning(true);
      setWarningCount(prev => {
        const next = prev + 1;
        if (next >= 3) setIsTerminated(true);
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') triggerWarning();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.student.submitTest(test.id, studentId, answers);
      onExit();
    } catch (error) {
      console.error('Submission Error:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questions = test.questions || [];
  const currentQ = questions[currentQIndex];

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      {isTerminated && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-600">
          <div className="text-center text-white p-10">
            <ShieldAlert className="w-20 h-20 mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-4">Test Terminated</h2>
            <p className="text-red-100 text-lg mb-8">Multiple integrity violations detected.</p>
            <Button onClick={onExit} className="bg-white text-red-600 hover:bg-red-50 rounded-2xl px-8 py-4 font-bold">Exit</Button>
          </div>
        </div>
      )}

      {hasWarning && !isTerminated && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-bold text-amber-700">Warning {warningCount}/3 — Tab switch detected</span>
          <button onClick={() => setHasWarning(false)} className="ml-4 text-amber-400 hover:text-amber-600"><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      <header className="h-20 border-b border-slate-100 bg-white flex items-center justify-between px-10 shrink-0">
        <div className="flex items-center gap-6">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="text-white font-bold">P</span>
           </div>
           <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{test.name || test.title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                Question {currentQIndex + 1} of {questions.length}
              </p>
           </div>
        </div>

        <div className="flex items-center gap-8">
           <div className={cn("flex flex-col items-end", timeLeft < 300 ? "text-rose-500" : "text-slate-900")}>
              <div className="flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 <span className="text-2xl font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
              </div>
           </div>
           <Button variant="outline" className="rounded-xl border-slate-200" onClick={onExit}>Quit</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 border-r border-slate-50 bg-slate-50/30 flex flex-col p-8 overflow-y-auto">
           <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Navigator</h4>
           <div className="grid grid-cols-4 gap-3">
              {questions.map((q: any, idx: number) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                    currentQIndex === idx ? "bg-indigo-600 text-white shadow-lg" : 
                    answers[q.id] !== undefined ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-white text-slate-400"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
           </div>
        </aside>

        <main className="flex-1 bg-white overflow-y-auto p-12 lg:px-24">
           {currentQ && (
             <motion.div key={currentQIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="bg-slate-50 border-l-4 border-indigo-600 p-6 rounded-r-3xl mb-10">
                   <h3 className="text-2xl font-bold text-slate-900 leading-snug">{currentQ.text}</h3>
                </div>

                <div className="space-y-4">
                   {currentQ.type === 'MCQ' && JSON.parse(currentQ.options || '[]').map((opt: string, oIdx: number) => (
                     <button
                       key={oIdx}
                       onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                       className={cn(
                         "w-full p-6 text-left border-2 rounded-2xl flex items-center gap-4 transition-all group",
                         answers[currentQ.id] === opt ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 hover:border-indigo-200"
                       )}
                     >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", answers[currentQ.id] === opt ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400")}>
                           {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="font-semibold text-slate-700">{opt}</span>
                     </button>
                   ))}
                </div>

                <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                    <Button variant="ghost" disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)}>
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Button 
                        disabled={isSubmitting}
                        onClick={() => currentQIndex < questions.length - 1 ? setCurrentQIndex(prev => prev + 1) : handleSubmit()}
                        className="px-10 h-14 rounded-2xl shadow-xl shadow-indigo-100"
                    >
                      {isSubmitting ? 'Finalizing...' : currentQIndex < questions.length - 1 ? 'Save & Next' : 'Finish Assessment'}
                    </Button>
                </div>
             </motion.div>
           )}
        </main>
      </div>
    </motion.div>
  );
};
