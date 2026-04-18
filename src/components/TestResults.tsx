import React, { useState } from 'react';
import { Student, Test } from '../types';
import { 
  Download, 
  Search, 
  Trophy, 
  Medal, 
  BarChart2, 
  ArrowRight,
  ChevronDown,
  User,
  History,
  FileText,
  ChevronLeft,
  Globe,
  X,
  CheckCircle2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEPT_RANKINGS = [
  { dept: 'Computer Science', avg: 88, max: 98, trend: 'up' },
  { dept: 'Information Technology', avg: 76, max: 92, trend: 'up' },
  { dept: 'Electronics', avg: 64, max: 85, trend: 'down' },
  { dept: 'Civil Engineering', avg: 58, max: 78, trend: 'stable' },
];

export const TestResults: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [students, setStudents] = useState<Student[]>([]);
  const [localTests, setLocalTests] = useState<Test[]>([]);
  const [attendanceTestId, setAttendanceTestId] = useState<string>('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleTogglePublish = (id: string) => {
    setLocalTests(prev => prev.map(t => 
      t.id === id ? { ...t, isResultPublished: !t.isResultPublished } : t
    ));
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.readinessScore - a.readinessScore);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const data = await api.staff.getStudents();
      setStudents(data);
      
      const tests = await api.staff.getAssessments();
      setLocalTests(tests);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchResults();
  }, []);

  const downloadStudentReportPDF = () => {
    if (!selectedStudent) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("Student Performance Report", 14, 22);
    
    // Profile
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Student Name: ${selectedStudent.name}`, 14, 32);
    doc.text(`Department: ${selectedStudent.department}`, 14, 38);
    doc.text(`Current CGPA: ${selectedStudent.cgpa}`, 14, 44);
    doc.text(`Readiness Score: ${selectedStudent.readinessScore}%`, 14, 50);
    
    // Test History Table
    const tableData = selectedStudent.testHistory.map(test => [
      test.testName,
      test.date,
      test.score.toString()
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [['Assessment Name', 'Date Attempted', 'Score (%)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`${selectedStudent.name.toLowerCase().replace(/\s+/g, '_')}_report.pdf`);
  };

  const downloadGlobalScoreboardPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("Global Scoreboard & Rankings", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total Candidates Analyzed: ${MOCK_STUDENTS.length}`, 14, 32);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 38);
    
    const tableData = filteredStudents.map((s, idx) => [
      (idx + 1).toString(),
      s.name,
      s.department,
      s.cgpa.toString(),
      `${s.readinessScore}%`
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: [['Rank', 'Student Name', 'Department', 'CGPA', 'Overall Result']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`global_scoreboard_report.pdf`);
  };

  const downloadAbsenteesPDF = () => {
    const test = MOCK_TESTS.find(t => t.id === attendanceTestId);
    if (!test) return;

    // Filter students who have NOT attended the specific test
    const absentees = MOCK_STUDENTS.filter(s => 
      !s.testHistory.some(history => history.testName === test.name)
    );

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("Test Absentees List", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Test Name: ${test.name}`, 14, 32);
    doc.text(`Total Absentees Identified: ${absentees.length}`, 14, 38);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 44);
    
    const tableData = absentees.map(s => [
      s.registerNumber,
      s.name,
      s.department
    ]);
    
    autoTable(doc, {
      startY: 50,
      head: [['Register Number', 'Student Name', 'Department']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [225, 29, 72] } // Rose-600 color for absentees
    });
    
    doc.save(`absentees_${test.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  if (viewMode === 'detail' && selectedStudent) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setViewMode('list')}
            className="rounded-xl h-12 shadow-sm bg-white border border-slate-100 px-4"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back to Scoreboard
          </Button>
          <div className="h-8 w-px bg-slate-200" />
          <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.name} Performance Report</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card className="bg-indigo-600 text-white rounded-[2rem] border-none shadow-xl shadow-indigo-100">
              <CardContent className="p-8">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Overall Result</p>
                 <h4 className="text-5xl font-black">{selectedStudent.readinessScore}%</h4>
                 <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-indigo-200 font-bold uppercase tracking-widest">CGPA</span>
                       <span className="font-black">{selectedStudent.cgpa}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-indigo-200 font-bold uppercase tracking-widest">Department</span>
                       <span className="font-black">{selectedStudent.department}</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <div className="md:col-span-3">
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-slate-100/50 bg-slate-50/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">Assessment Breakdown</CardTitle>
                      <CardDescription className="font-medium text-slate-400">Chronological history of all attempts</CardDescription>
                    </div>
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                       <History className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                      {selectedStudent.testHistory.map((test, idx) => (
                        <div key={idx} className="p-8 hover:bg-slate-50 transition-colors group">
                           <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                 <FileText className="w-5 h-5 text-slate-400" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{test.date}</span>
                           </div>
                           <h5 className="font-black text-slate-900 mb-1 truncate">{test.testName}</h5>
                           <div className="flex items-end gap-2">
                              <span className="text-3xl font-black text-indigo-600">{test.score}</span>
                              <span className="text-xs font-bold text-slate-300 mb-1.5 underline decoration-indigo-200 decoration-2">Score</span>
                           </div>
                        </div>
                      ))}
                      {/* Empty fills for grid */}
                      <div className="p-8 bg-slate-50 flex flex-col items-center justify-center opacity-40">
                         <Medal className="w-8 h-8 text-slate-300 mb-2" />
                         <span className="text-[10px] font-bold uppercase text-slate-400">Future Milestone</span>
                      </div>
                   </div>
                </CardContent>
              </Card>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Performance Progression</CardTitle>
                  <CardDescription>Visual trend of scores over time</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={downloadStudentReportPDF}>
                  <Download className="w-4 h-4" /> Download Performance PDF
                </Button>
              </CardHeader>
              <CardContent className="h-80 pb-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={[
                    { name: 'Jan', score: 65 },
                    { name: 'Feb', score: 72 },
                    { name: 'Mar', score: selectedStudent.testHistory[0]?.score || 80 },
                    { name: 'Apr', score: selectedStudent.readinessScore },
                  ]}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#4f46e5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>

           <div className="space-y-6">
              <Card className="bg-slate-900 text-white p-2">
                 <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <Trophy className="w-6 h-6 text-white" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-indigo-400">Current Standing</p>
                          <h4 className="text-xl font-bold">Top 5% of Batch</h4>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Technical Proficiency</p>
                          <div className="flex justify-between items-end">
                             <span className="text-lg font-bold">Expert</span>
                             <span className="text-xs text-indigo-400 font-black">Lv. 4</span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                             <div className="w-[85%] h-full bg-indigo-500" />
                          </div>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-indigo-100 bg-indigo-50/30">
                 <CardContent className="p-6">
                    <h5 className="font-bold text-slate-900 mb-2">Automated Insight</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                       {selectedStudent.name}'s performance is consistent across all modules. Based on the current trend, they are eligible for premium placement drives starting next month.
                    </p>
                 </CardContent>
              </Card>
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Rankings & Analytics</h2>
          <p className="text-slate-500">Analyze performance across test cycles and departments.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex flex-col gap-1.5 w-full sm:w-64">
            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Select Assessment for Attendance</Label>
            <select 
              className="h-12 w-full bg-white border-2 border-slate-100 rounded-2xl px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={attendanceTestId}
              onChange={(e) => setAttendanceTestId(e.target.value)}
            >
              {MOCK_TESTS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={downloadAbsenteesPDF} variant="outline" className="gap-2 h-12 px-6 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 border-2">
            <FileText className="w-5 h-5" /> Download Absentees (PDF)
          </Button>
          <Button onClick={downloadGlobalScoreboardPDF} className="gap-2 h-12 px-6 rounded-2xl shadow-indigo-100 shadow-xl border-2 border-indigo-700">
            <Download className="w-5 h-5" /> Global Rankings PDF
          </Button>
          <Button onClick={() => setIsPublishModalOpen(true)} className="gap-2 h-12 px-6 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200 border-2 border-slate-900 hover:bg-slate-800">
            <Globe className="w-5 h-5" /> Publish Results
          </Button>
        </div>
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsPublishModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Broadcast Results</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Select assessments to publish</p>
                </div>
                <button onClick={() => setIsPublishModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                {localTests.map(test => (
                  <div 
                    key={test.id}
                    onClick={() => handleTogglePublish(test.id)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer",
                      test.isResultPublished 
                        ? "border-indigo-600 bg-indigo-50/50" 
                        : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        test.isResultPublished ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("font-bold", test.isResultPublished ? "text-indigo-900" : "text-slate-700")}>{test.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{test.questionCount} Questions | {test.status}</p>
                      </div>
                    </div>
                    {test.isResultPublished && <div className="bg-indigo-600 rounded-full p-1"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                  </div>
                ))}
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                <Button className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-indigo-100" onClick={() => setIsPublishModalOpen(false)}>
                  Done Publishing
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Overall Scoreboard */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Global Scoreboard</CardTitle>
                  <CardDescription>All students ranked by Overall Result</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search student..." 
                    className="pl-9 h-10 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Rank</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 font-sans">Full Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-center">CGPA</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-center">Overall Result</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => (
                      <tr 
                        key={s.id} 
                        className={cn(
                          "group hover:bg-slate-100 hover:shadow-md transition-all cursor-pointer relative z-10",
                          selectedStudentId === s.id ? "bg-indigo-50/50" : ""
                        )}
                        onClick={() => {
                           setSelectedStudentId(s.id);
                           setViewMode('detail');
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                            idx === 0 ? "bg-amber-100 text-amber-700" : 
                            idx === 1 ? "bg-slate-200 text-slate-700" :
                            idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-400"
                          )}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white transition-all">
                              <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="font-semibold text-slate-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm">{s.cgpa}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
                               <div className="bg-indigo-600 h-full" style={{ width: `${s.readinessScore}%` }} />
                             </div>
                             <span className="text-xs font-bold text-indigo-600">{s.readinessScore}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs font-bold uppercase ml-auto">
                             View Report <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Rankings (Always on List View) */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none shadow-2xl">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-500 rounded-2xl rotate-3 flex items-center justify-center mb-6 shadow-indigo-500/20 shadow-xl">
                 <Trophy className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-1">Elite Performer</h4>
              <p className="text-slate-400 text-sm mb-6">Current Topper List Overview</p>
              
              <div className="w-full space-y-4">
                {MOCK_STUDENTS.slice(0, 3).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
                     <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 font-bold rounded-lg flex items-center justify-center">
                        #{i + 1}
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{s.department}</p>
                     </div>
                     <div className="text-indigo-400 font-bold font-mono tracking-tighter">{s.readinessScore}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader className="pb-4">
               <CardTitle className="text-md flex items-center gap-2">
                 <Medal className="w-4 h-4 text-indigo-600" /> Dept Standings
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="space-y-px">
                  {DEPT_RANKINGS.map((d) => (
                    <div key={d.dept} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-t border-slate-100 group">
                       <div className="space-y-0.5">
                          <p className="text-sm font-semibold group-hover:text-indigo-600 transition-colors">{d.dept}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AVG: {d.avg}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-indigo-500">MAX: {d.max}%</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <BarChart2 className={cn(
                            "w-4 h-4",
                            d.trend === 'up' ? "text-emerald-500" : d.trend === 'stable' ? "text-amber-500" : "text-rose-500"
                          )} />
                       </div>
                    </div>
                  ))}
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
