import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Download, 
  Image as ImageIcon, 
  FileBox,
  Brain,
  Clock,
  ShieldCheck,
  MousePointer2,
  Table as TableIcon,
  HelpCircle,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Binary,
  Type,
  Target,
  Search,
  Calendar,
  Building2,
  X,
  Settings2,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { cn } from '../lib/utils';
import { Question, QuestionOption, Test } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_TESTS, MOCK_STUDENTS } from '../lib/mockData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type View = 'list' | 'editor';
type EditorStep = 'info' | 'import' | 'preview' | 'manual';

export const TestManagement: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [tests, setTests] = useState<Test[]>([]);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [selectedSpecificStudents, setSelectedSpecificStudents] = useState<string[]>([]);
  const [instantResults, setInstantResults] = useState(true);
  const [assignmentDates, setAssignmentDates] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]); // To be fetched for assignment

  React.useEffect(() => {
    // TODO: Fetch from /api/tests and /api/students
  }, []);

  // Editor State
  const [editorStep, setEditorStep] = useState<EditorStep>('info');
  const [testName, setTestName] = useState('');
  const [timeLimit, setTimeLimit] = useState('60');
  const [isStrict, setIsStrict] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logic: View Transitions
  const handleSave = (status: 'draft' | 'active') => {
    if (!testName.trim()) return;

    const testData: Test = {
      id: activeTest?.id || Math.random().toString(36).substr(2, 9),
      name: testName,
      questionCount: questions.length,
      timeLimit: parseInt(timeLimit),
      isStrict,
      status
    };

    if (activeTest) {
      setTests(prev => prev.map(t => t.id === activeTest.id ? testData : t));
    } else {
      setTests(prev => [testData, ...prev]);
    }

    setView('list');
  };

  const startCreate = () => {
    setActiveTest(null);
    setTestName('');
    setTimeLimit('60');
    setIsStrict(true);
    setQuestions([]);
    setActiveQuestionIndex(0);
    setEditorStep('info');
    setView('editor');
  };

  const startEdit = (test: Test) => {
    setActiveTest(test);
    setTestName(test.name);
    setTimeLimit(test.timeLimit.toString());
    setIsStrict(test.isStrict);
    // In a real app, fetch questions. Mocking some:
    setQuestions([
      { 
        id: '1', 
        type: 'mcq', 
        title: 'Primary programming language for Android development?', 
        isValid: true,
        options: [
          { id: 'a', text: 'Swift' },
          { id: 'b', text: 'Kotlin', isImageMode: false },
          { id: 'c', text: 'PHP' },
          { id: 'd', text: 'Rust' }
        ],
        correctAnswer: 'b'
      }
    ]);
    setActiveQuestionIndex(0);
    setEditorStep('manual');
    setView('editor');
  };

  // Logic: Question Management
  const goToEditor = () => {
    if (!testName.trim()) return;
    setEditorStep('manual');
    if (questions.length === 0) {
      addNewQuestion();
    }
  };

  const addNewQuestion = () => {
    const newQ: Question = {
      id: Math.random().toString(),
      type: 'mcq',
      title: 'New Question',
      isValid: false,
      options: [
        { id: '1', text: 'Option 1' },
        { id: '2', text: 'Option 2' },
        { id: '3', text: 'Option 3' },
        { id: '4', text: 'Option 4' },
      ]
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const removeQuestion = (qId: string) => {
    setQuestions(prev => {
      const filtered = prev.filter(q => q.id !== qId);
      if (activeQuestionIndex >= filtered.length && filtered.length > 0) {
        setActiveQuestionIndex(filtered.length - 1);
      }
      return filtered;
    });
  };

  const handleCorrectAnswerChange = (qId: string, optId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, correctAnswer: optId, isValid: !!q.title && !!optId };
      }
      return q;
    }));
  };

  const updateActiveQuestion = (patch: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => i === activeQuestionIndex ? { ...q, ...patch } : q));
  };

  const updateOption = (optId: string, patch: Partial<QuestionOption>) => {
    const q = questions[activeQuestionIndex];
    if (!q.options) return;
    const newOptions = q.options.map(o => o.id === optId ? { ...o, ...patch } : o);
    updateActiveQuestion({ options: newOptions });
  };

  const deleteTest = (id: string) => {
    setTests(prev => prev.filter(t => t.id !== id));
  };

  const downloadTestData = (test: Test) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Assessment Configuration", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    const data = [
      ["Test Name", test.name],
      ["Test ID", test.id],
      ["Question Count", test.questionCount.toString()],
      ["Time Limit", `${test.timeLimit} minutes`],
      ["Proctoring", test.isStrict ? "Strict" : "Standard"],
      ["Status", test.status]
    ];
    
    autoTable(doc, {
      startY: 40,
      head: [['Field', 'Configuration Detail']],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`${test.name.toLowerCase().replace(/\s+/g, '_')}_spec.pdf`);
  };

  const downloadAllTests = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Batch Assessment Registry", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = tests.map(test => [
      test.name,
      test.id.slice(0, 8),
      test.questionCount,
      `${test.timeLimit}m`,
      test.isStrict ? "Strict" : "Standard",
      test.status
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Test Name', 'ID', 'Items', 'Limit', 'Protocol', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`all_tests_registry.pdf`);
  };

  // Logic: Assignment
  const openAssignModal = (testId: string) => {
    setSelectedTestId(testId);
    setSelectedTargets([]);
    setSelectedSpecificStudents([]);
    setAssignSearchTerm('');
    setIsAssignModalOpen(true);
  };

  const filteredStudentsForAssign = MOCK_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) || 
    s.registerNumber.toLowerCase().includes(assignSearchTerm.toLowerCase())
  );

  const toggleTarget = (target: string) => {
    setSelectedTargets(prev => 
      prev.includes(target) ? prev.filter(t => t !== target) : [...prev, target]
    );
  };

  const toggleSpecificStudent = (id: string) => {
    setSelectedSpecificStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (view === 'list') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Test Portal</h2>
            <p className="text-slate-500">Manage, create, and assign assessments to batches.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={downloadAllTests} className="gap-2 p-6 rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50">
              <Download className="w-5 h-5" /> Download Registry PDF
            </Button>
            <Button onClick={startCreate} className="gap-2 p-6 rounded-2xl shadow-indigo-100 shadow-xl">
              <Plus className="w-5 h-5" /> Create New Test
            </Button>
          </div>
        </div>

        <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Test Name / Identity</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Content</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Protocols</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((test) => (
                  <motion.tr 
                    key={test.id} 
                    whileHover={{ backgroundColor: '#f8fafc', scale: 0.998 }}
                    transition={{ duration: 0.2 }}
                    className="group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{test.name}</p>
                          <p className="text-xs text-slate-400">ID: {test.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="text-center px-3 py-1 bg-slate-100 rounded-lg">
                           <p className="text-[10px] font-bold text-slate-900">{test.questionCount}</p>
                           <p className="text-[8px] text-slate-400 uppercase">Items</p>
                        </div>
                        <div className="text-center px-3 py-1 bg-slate-100 rounded-lg">
                           <p className="text-[10px] font-bold text-slate-900">{test.timeLimit}m</p>
                           <p className="text-[8px] text-slate-400 uppercase">Limit</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border",
                        test.isStrict 
                          ? "bg-rose-50 text-rose-600 border-rose-100" 
                          : "bg-sky-50 text-sky-600 border-sky-100"
                      )}>
                        <ShieldCheck className="w-3 h-3" /> {test.isStrict ? 'Strict' : 'Standard'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                        test.status === 'active' ? "bg-emerald-50 text-emerald-600" : 
                        test.status === 'draft' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                           test.status === 'active' ? "bg-emerald-600" : 
                           test.status === 'draft' ? "bg-amber-600" : "bg-slate-600"
                        )} />
                        {test.status}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(test)} className="gap-2">
                          <Settings2 className="w-4 h-4 text-slate-400" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadTestData(test)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Download Test Data">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openAssignModal(test.id)} className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                          Assign Test
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTest(test.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Assign Modal */}
        <AnimatePresence>
          {isAssignModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={() => setIsAssignModalOpen(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Assign Assessment</h3>
                      <p className="text-sm text-slate-400 font-semibold tracking-tight">Configure deployment targets and scheduling.</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAssignModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                    <X className="w-7 h-7 text-slate-300" />
                  </button>
                </div>

                <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Target Groups */}
                  <div className="space-y-4">
                    <Label className="uppercase text-[11px] font-black text-slate-400 tracking-widest ml-1">Target Selection</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Batch of 2025', 'Batch of 2026', 'CSE Department', 'ECE Department'].map((item) => (
                        <div 
                          key={item} 
                          onClick={() => toggleTarget(item)}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300",
                            selectedTargets.includes(item)
                              ? "border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100/50"
                              : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                            selectedTargets.includes(item) ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                          )}>
                            {selectedTargets.includes(item) && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <span className={cn(
                            "text-sm font-bold",
                            selectedTargets.includes(item) ? "text-indigo-900" : "text-slate-600"
                          )}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specific Students */}
                  <div className="space-y-4">
                    <Label className="uppercase text-[11px] font-black text-slate-400 tracking-widest ml-1 flex justify-between items-center">
                      <span>Specific Students Attachment</span>
                      {selectedSpecificStudents.length > 0 && (
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{selectedSpecificStudents.length} Selected</span>
                      )}
                    </Label>
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input 
                        placeholder="Search student by name or register number..." 
                        value={assignSearchTerm}
                        onChange={(e) => setAssignSearchTerm(e.target.value)}
                        className="pl-14 h-16 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white text-md font-semibold"
                      />
                    </div>
                    {assignSearchTerm && (
                      <Card className="rounded-2xl border-slate-100 shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        <div className="divide-y divide-slate-50">
                          {filteredStudentsForAssign.map(s => (
                            <div 
                              key={s.id}
                              onClick={() => toggleSpecificStudent(s.id)}
                              className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{s.registerNumber} | {s.department}</p>
                                </div>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                selectedSpecificStudents.includes(s.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                              )}>
                                {selectedSpecificStudents.includes(s.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Scheduling */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="uppercase text-[11px] font-black text-slate-400 tracking-widest ml-1">Start Date/Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                          type="datetime-local" 
                          className="pl-14 h-16 rounded-2xl border-slate-100 font-bold text-slate-900" 
                          value={assignmentDates.start}
                          onChange={(e) => setAssignmentDates(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="uppercase text-[11px] font-black text-slate-400 tracking-widest ml-1">End Date/Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                          type="datetime-local" 
                          className="pl-14 h-16 rounded-2xl border-slate-100 font-bold text-slate-900" 
                          value={assignmentDates.end}
                          onChange={(e) => setAssignmentDates(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings Toggle */}
                  <div className="flex items-center justify-between p-8 bg-indigo-50/40 rounded-[2rem] border-2 border-indigo-100/50">
                    <div className="space-y-1">
                      <p className="text-lg font-black text-indigo-900">Instant Results</p>
                      <p className="text-[11px] text-indigo-700/60 uppercase font-black tracking-widest">Allow students to view scores immediately</p>
                    </div>
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-inner border border-indigo-100">
                      <button 
                        onClick={() => setInstantResults(true)}
                        className={cn(
                          "px-6 py-2.5 text-xs font-black rounded-[0.85rem] transition-all",
                          instantResults ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 hover:text-slate-600"
                        )}
                      >Yes</button>
                      <button 
                        onClick={() => setInstantResults(false)}
                        className={cn(
                          "px-6 py-2.5 text-xs font-black rounded-[0.85rem] transition-all",
                          !instantResults ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 hover:text-slate-600"
                        )}
                      >No</button>
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-5">
                  <Button 
                    className="flex-1 py-10 text-lg font-black rounded-[1.75rem] shadow-2xl shadow-indigo-100 uppercase tracking-widest"
                    onClick={() => setIsAssignModalOpen(false)}
                  >
                    Confirm Assignment
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="px-10 rounded-[1.75rem] text-slate-400 font-bold hover:text-slate-900"
                    onClick={() => setIsAssignModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- EDITOR VIEW ---
  const currentQ = questions[activeQuestionIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Editor Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('list')}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {activeTest ? `Editing: ${testName}` : 'New Assessment Engine'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => handleSave('draft')}>Save Draft</Button>
          <Button className="rounded-xl shadow-indigo-100 shadow-lg px-6" onClick={() => handleSave('active')}>Publish Test</Button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Left Sidebar: Navigator */}
        <aside className="w-64 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col rounded-[2rem] border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Question Bank</span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{questions.length} Items</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group",
                    activeQuestionIndex === idx 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    activeQuestionIndex === idx ? "bg-white/20" : "bg-slate-100"
                  )}>{idx + 1}</div>
                  <span className="text-xs font-semibold truncate flex-1">{q.title}</span>
                  {!q.isValid && <AlertCircle className="w-3 h-3 text-rose-400" />}
                </button>
              ))}
              <button 
                onClick={addNewQuestion}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/20 text-indigo-600 transition-all group"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Add Question</span>
              </button>
            </div>
            <div className="p-6 border-t border-slate-100">
               <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span>Audit Score</span>
                  <span className="text-emerald-500">100% Valid</span>
               </div>
               <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full" />
               </div>
            </div>
          </Card>

          <Button variant="outline" className="rounded-2xl border-slate-200 h-14 gap-3 bg-white" onClick={() => setEditorStep('import')}>
             <Upload className="w-4 h-4 text-slate-400" />
             <span className="text-xs font-bold text-slate-600">Bulk Multi-Editor</span>
          </Button>
        </aside>

        {/* Center: Editor Canvas */}
        <main className="flex-1 overflow-y-auto pr-2 pb-10">
          <AnimatePresence mode="wait">
            {editorStep === 'info' ? (
              <motion.div
                key="step-info"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto py-10"
              >
                <Card className="rounded-[2.5rem] border-slate-200 shadow-2xl shadow-indigo-100/50 overflow-hidden">
                  <div className="p-10 bg-indigo-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                        <Settings2 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold tracking-tight">Setup Assessment</h3>
                      <p className="text-indigo-100 font-medium mt-2">Configure the core parameters for your new test.</p>
                    </div>
                  </div>

                  <CardContent className="p-10 space-y-8 bg-white">
                    <div className="space-y-3">
                      <Label className="uppercase text-[10px] font-bold text-slate-400 tracking-widest px-1">Assessment Title</Label>
                      <Input 
                        placeholder="e.g., Q3 Technical Aptitude - Final" 
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        className="h-14 rounded-2xl text-lg font-semibold border-2 focus:border-indigo-600 bg-slate-50/50"
                      />
                      {!testName && <p className="text-[10px] text-rose-500 font-bold px-1 animate-pulse italic">* Please provide a descriptive title to continue</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="uppercase text-[10px] font-bold text-slate-400 tracking-widest px-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Duration (min)
                        </Label>
                        <Input 
                          type="number" 
                          value={timeLimit}
                          onChange={(e) => setTimeLimit(e.target.value)}
                          className="h-14 rounded-2xl font-bold bg-slate-50/50"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="uppercase text-[10px] font-bold text-slate-400 tracking-widest px-1 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" /> Proctoring
                        </Label>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                          <button 
                            onClick={() => setIsStrict(true)}
                            className={cn(
                              "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                              isStrict ? "bg-white text-indigo-600 shadow-md" : "text-slate-500"
                            )}
                          >Strict Mode</button>
                          <button 
                            onClick={() => setIsStrict(false)}
                            className={cn(
                              "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                              !isStrict ? "bg-white text-indigo-600 shadow-md" : "text-slate-500"
                            )}
                          >Standard</button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        disabled={!testName.trim()}
                        className="w-full py-8 text-md font-bold rounded-[1.5rem] shadow-xl shadow-indigo-100 disabled:opacity-30 transition-all uppercase tracking-widest"
                        onClick={goToEditor}
                      >
                        Start Building Questions
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                      <p className="text-[10px] text-center text-slate-400 mt-6 font-medium">You can always adjust these settings later in the Publish menu.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : !currentQ ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                      <Target className="w-10 h-10" />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-900">Canvas Is Empty</h4>
                      <p className="text-sm text-slate-400 max-w-xs">Start building your assessment by selecting a question or adding a new one.</p>
                   </div>
                </motion.div>
             ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key={currentQ.id} className="space-y-6">
                   {/* Multimodal Templates Bar */}
                   <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-3xl overflow-x-auto">
                      {[
                        { id: 'mcq', label: 'Standard MCQ', icon: MousePointer2 },
                        { id: 'visual-mcq', label: 'Image-Split', icon: ImageIcon },
                        { id: 'passage', label: 'Passage Base', icon: FileText },
                        { id: 'numeric', label: 'Numeric Only', icon: Binary },
                        { id: 'situational', label: 'Situational', icon: Target },
                      ].map((t) => (
                        <button 
                          key={t.id}
                          onClick={() => updateActiveQuestion({ type: t.id as any })}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-2xl whitespace-nowrap text-xs font-bold transition-all",
                            currentQ.type === t.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          <t.icon className="w-3 h-3" /> {t.label}
                        </button>
                      ))}
                      <div className="ml-auto flex items-center gap-2 pr-2">
                         <button className="p-2 text-slate-400 hover:text-indigo-600"><Plus className="w-4 h-4" /></button>
                         <button className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" onClick={() => removeQuestion(currentQ.id)} /></button>
                      </div>
                   </div>

                   {/* Main Question Interface */}
                   <Card className="rounded-[2.5rem] border-slate-200 overflow-hidden shadow-2xl shadow-slate-100">
                      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-[11px] text-white font-bold italic shadow-lg shadow-indigo-100">Q{activeQuestionIndex + 1}</div>
                           <CardTitle className="text-md capitalize">{currentQ.type.replace('-', ' ')} Layout</CardTitle>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex bg-slate-200/50 p-1 rounded-xl">
                               <button 
                                 onClick={() => updateActiveQuestion({ isTitleImageMode: false })}
                                 className={cn("px-4 py-1.5 text-[9px] font-bold rounded-lg transition-all", !currentQ.isTitleImageMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
                               >Text</button>
                               <button 
                                 onClick={() => updateActiveQuestion({ isTitleImageMode: true })}
                                 className={cn("px-4 py-1.5 text-[9px] font-bold rounded-lg transition-all", currentQ.isTitleImageMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500")}
                               >Image</button>
                            </div>
                         </div>
                      </CardHeader>
                      <CardContent className="p-0">
                         <div className="flex flex-col lg:flex-row min-h-[450px]">
                            {/* Visual Asset Panel */}
                            <div className="flex-1 p-10 border-r border-slate-100 bg-white space-y-6">
                               <div className="flex items-center justify-between">
                                  <Label className="uppercase text-[10px] font-bold text-slate-400 tracking-widest">Question Asset</Label>
                               </div>
                               <div className={cn(
                                 "aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all overflow-hidden relative",
                                 currentQ.imageUrl ? "border-indigo-100 bg-indigo-50/10" : "border-slate-100 bg-slate-50/50"
                               )}>
                                  {currentQ.imageUrl ? (
                                     <img src={currentQ.imageUrl} alt="Asset" className="w-full h-full object-cover" />
                                  ) : (
                                     <>
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-slate-200/50">
                                           <ImageIcon className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-xs text-slate-400 mb-6 max-w-[180px]">Drag an image here or click the button below to upload</p>
                                     </>
                                  )}
                                  <div className="mt-auto">
                                     <Button 
                                       variant="outline" 
                                       className="rounded-xl border-slate-200 bg-white"
                                       onClick={() => updateActiveQuestion({ imageUrl: 'https://picsum.photos/seed/question/800/450' })}
                                     >
                                        {currentQ.imageUrl ? 'Change Image' : 'Add Question Image'}
                                     </Button>
                                  </div>
                               </div>
                            </div>

                            {/* Logic Designer Panel */}
                            <div className="flex-1 p-10 bg-slate-50/30 space-y-8">
                               <div className="space-y-3">
                                  <Label className="uppercase text-[10px] font-bold text-slate-400 tracking-widest">Question Prompt</Label>
                                  <textarea 
                                    className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold p-0 min-h-[100px] placeholder:text-slate-200" 
                                    placeholder="Type your question prompt here..." 
                                    value={currentQ.title} 
                                    onChange={e => updateActiveQuestion({ title: e.target.value })}
                                  />
                               </div>
                               
                               <div className="space-y-4">
                                  <Label className="uppercase text-[10px] font-bold text-slate-400 tracking-widest flex items-center justify-between">
                                     <span>MCQ Options</span>
                                     <span className="text-indigo-600">Select 1 correct Answer</span>
                                  </Label>
                                  <div className="space-y-3">
                                     {currentQ.options?.map((opt, i) => (
                                       <div key={opt.id} className={cn(
                                         "flex items-center gap-5 p-4 bg-white rounded-3xl border transition-all group/opt",
                                         currentQ.correctAnswer === opt.id 
                                            ? "border-emerald-200 ring-4 ring-emerald-50 shadow-lg shadow-emerald-100" 
                                            : "border-slate-100 hover:border-slate-200"
                                       )}>
                                          <button 
                                            onClick={() => handleCorrectAnswerChange(currentQ.id, opt.id)}
                                            className={cn(
                                              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                              currentQ.correctAnswer === opt.id 
                                                 ? "bg-emerald-500 text-white" 
                                                 : "bg-slate-100 text-slate-400 hover:bg-slate-200 cursor-pointer"
                                            )}
                                          >
                                            {currentQ.correctAnswer === opt.id ? '✓' : String.fromCharCode(65 + i)}
                                          </button>
                                          
                                          <div className="flex-1 space-y-1">
                                             {opt.isImageMode ? (
                                                <div className="h-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 overflow-hidden relative">
                                                   {opt.imageUrl ? <img src={opt.imageUrl} className="w-full h-full object-cover" /> : 'Drag option image'}
                                                   <button 
                                                      className="absolute inset-0 bg-slate-900/40 text-white opacity-0 hover:opacity-100 transition-opacity text-[8px] font-bold"
                                                      onClick={() => updateOption(opt.id, { imageUrl: 'https://picsum.photos/seed/opt/200/100' })}
                                                   >
                                                      UPLOAD IMAGE
                                                   </button>
                                                </div>
                                             ) : (
                                                <input 
                                                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold p-0" 
                                                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                  value={opt.text}
                                                  onChange={e => updateOption(opt.id, { text: e.target.value })}
                                                />
                                             )}
                                          </div>

                                          <div className="flex items-center gap-3">
                                             <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                                <button 
                                                   onClick={() => updateOption(opt.id, { isImageMode: false })}
                                                   className={cn("px-2.5 py-1 text-[8px] font-bold rounded transition-all", !opt.isImageMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
                                                >Text</button>
                                                <button 
                                                   onClick={() => updateOption(opt.id, { isImageMode: true })}
                                                   className={cn("px-2.5 py-1 text-[8px] font-bold rounded transition-all", opt.isImageMode ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
                                                >Image</button>
                                             </div>
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                </motion.div>
             )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
