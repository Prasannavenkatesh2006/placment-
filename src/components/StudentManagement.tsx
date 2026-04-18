import React, { useState, useEffect } from 'react';
// ... (keep lucide imports)
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Student } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../lib/api';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.staff.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadStudentResumePDF = (student: Student) => {
// ... existing PDF logic ...
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text(student.name, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${student.department} | ${student.email}`, 14, 28);
    
    // Profile Bio
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Professional Summary", 14, 40);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const splitBio = doc.splitTextToSize(student.bio, 180);
    doc.text(splitBio, 14, 46);
    
    // Academic Snapshot
    const academicData = [
      ["Cumulative CGPA", student.cgpa.toString()],
      ["Active Backlogs", student.backlogs.toString()],
      ["Placement Readiness", `${student.readinessScore}%`]
    ];
    
    autoTable(doc, {
      startY: 55 + (splitBio.length * 5),
      head: [['Academic Pillar', 'Metric']],
      body: academicData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    // Skill Matrix
    const skillData = Object.entries(student.skills).map(([skill, val]) => [skill, `${val}%`]);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Skill Set', 'Proficiency level']],
      body: skillData,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] }
    });
    
    doc.save(`${student.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`);
  };

  const getImprovementPlan = (student: Student) => {
    const plans = [];
    if (student.cgpa < 7.5) plans.push(`Maintain CGPA above 8.0 for top-tier companies.`);
    if (Object.values(student.skills).some(v => v < 60)) {
      const lowSkill = Object.entries(student.skills).find(([_, v]) => v < 60)?.[0];
      plans.push(`Join a ${lowSkill} bootcamp to reach the 80% threshold required for Tier-1 roles.`);
    }
    if (student.skills.Aptitude < 85) plans.push(`Aptitude score is ${student.skills.Aptitude}%. Aim for 15% more for TCS/Infosys eligibility.`);
    return plans.length > 0 ? plans : ["Candidate is well-prepared. Focus on mock interviews."];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Student Deep Dive</h2>
          <p className="text-slate-500">Detailed analytics and performance tracking for all candidates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="gap-2">
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search by name, department, or email..." 
            className="pl-12 border-none bg-transparent focus:ring-0 shadow-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Dept</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">CGPA</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Backlogs</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Readiness</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <motion.tr 
                  key={student.id} 
                  whileHover={{ backgroundColor: '#f8fafc', scale: 0.998 }}
                  transition={{ duration: 0.2 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.department}</td>
                  <td className="px-6 py-4 text-center font-mono font-medium">{student.cgpa.toFixed(1)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                      student.backlogs === 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {student.backlogs}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden min-w-[80px]">
                        <div 
                          className="bg-indigo-600 h-full rounded-full" 
                          style={{ width: `${student.readinessScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600">{student.readinessScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      student.cgpa >= 7.5 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {student.cgpa >= 7.5 ? 'Market Ready' : 'Needs Polish'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-over Drawer */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
              onClick={() => setSelectedStudent(null)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h3>
                      <p className="text-slate-500">{selectedStudent.department} · ID: {selectedStudent.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                       Student Biography
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                      "{selectedStudent.bio}"
                    </p>
                  </section>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-50/50 border-none shadow-none p-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Academic CGPA</p>
                      <p className="text-2xl font-bold font-mono text-indigo-600">{selectedStudent.cgpa}</p>
                    </Card>
                    <Card className="bg-slate-50/50 border-none shadow-none p-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Active Backlogs</p>
                      <p className={cn("text-2xl font-bold font-mono", selectedStudent.backlogs === 0 ? "text-emerald-600" : "text-rose-600")}>
                        {selectedStudent.backlogs}
                      </p>
                    </Card>
                  </div>

                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Skills Proficiency</h4>
                    <div className="space-y-4">
                      {Object.entries(selectedStudent.skills).map(([skill, value]) => (
                        <div key={skill} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-medium">
                            <span>{skill}</span>
                            <span className="text-indigo-600 font-bold">{value}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="bg-indigo-600 h-full rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> Improvement Plan
                    </h4>
                    <div className="space-y-3">
                      {getImprovementPlan(selectedStudent).map((item, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
                          <span className="font-bold shrink-0">Step {i + 1}:</span>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <History className="w-4 h-4" /> Test History
                    </h4>
                    <div className="space-y-2">
                      {selectedStudent.testHistory.map((test, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                          <div>
                            <p className="text-sm font-semibold">{test.testName}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{test.date}</p>
                          </div>
                          <span className="font-bold text-indigo-600">{test.score}%</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pt-4 sticky bottom-8">
                    <Button 
                      className="w-full gap-2 p-6 rounded-2xl shadow-lg border-2 border-indigo-700"
                      onClick={() => downloadStudentResumePDF(selectedStudent)}
                    >
                      <FileText className="w-5 h-5" /> Download Profile PDF
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </Button>
                  </section>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
