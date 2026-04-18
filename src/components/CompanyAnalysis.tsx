import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle,
  Users,
  Briefcase,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  X,
  Trophy,
  Star,
  Zap,
  Clock,
  Mail,
  FileText,
  Bookmark,
  History,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Label } from './ui/Input';
import { Student, Company } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../lib/api';

export const CompanyAnalysis: React.FC = () => {
  const [minCgpa, setMinCgpa] = useState('8.5');
  const [maxBacklogs, setMaxBacklogs] = useState('0');
  const [aptitudeCutoff, setAptitudeCutoff] = useState('70');
  const [codingCutoff, setCodingCutoff] = useState('75');
  const [jobDescription, setJobDescription] = useState('Seeking a Full Stack Developer proficient in React, Node.js, and TypeScript.');
  const [companyName, setCompanyName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [matchingCompanies, setMatchingCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shortlistedStudents, setShortlistedStudents] = useState<Student[]>([]);
  const [savedCriteria, setSavedCriteria] = useState<any[]>([]);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [showSavedCriteria, setShowSavedCriteria] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'company'>('name');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [studentsData, companiesData] = await Promise.all([
        api.staff.getStudents(),
        api.staff.getCompanies()
      ]);
      setStudents(studentsData);
      setMatchingCompanies(companiesData);
      setSavedCriteria(companiesData);
    } catch (error) {
      console.error('Failed to fetch matching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allEvaluationUnits = React.useMemo(() => {
    // Treat saved DB companies as criteria
    const dbUnits = savedCriteria.map(c => ({
      ...c,
      isCustom: true
    }));

    const transientUnit = companyName ? [{
      id: 'active-transient',
      name: companyName,
      minCgpa: parseFloat(minCgpa || '0'),
      maxBacklogs: parseInt(maxBacklogs || '0'),
      aptitudeCutoff: parseFloat(aptitudeCutoff || '0'),
      codingCutoff: parseFloat(codingCutoff || '0'),
      jobDescription: jobDescription,
      isCustom: true,
      isActiveTransient: true
    }] : [];

    const combined = [...matchingCompanies, ...dbUnits, ...transientUnit];
    const uniqueMap = new Map();
    combined.forEach(unit => uniqueMap.set(unit.name.toLowerCase().trim(), unit));
    return Array.from(uniqueMap.values()) as (Company & { isCustom?: boolean, isActiveTransient?: boolean })[];
  }, [savedCriteria, companyName, minCgpa, maxBacklogs, aptitudeCutoff, codingCutoff, jobDescription, matchingCompanies]);

  const getMatchAnalysis = (student: Student, jd: string) => {
    if (!jd) return { score: 0, matched: [] as string[], missing: [] as string[] };
    const jdWords = Array.from(new Set(jd.toLowerCase().split(/\W+/).filter(w => w.length >= 2)));
    if (jdWords.length === 0) return { score: 0, matched: [] as string[], missing: [] as string[] };
    
    // Skills are numeric in Student type, need keys
    const studentContent = `${student.bio || ''} ${student.department} ${Object.keys(student.skills || {}).join(' ')}`.toLowerCase();
    const matched = jdWords.filter(word => studentContent.includes(word));
    const missing = jdWords.filter(word => !studentContent.includes(word));
    
    const score = Math.round((matched.length / jdWords.length) * 100);
    return { score, matched, missing };
  };

  const calculateMatchPercentage = (student: Student, jd: string) => {
    return getMatchAnalysis(student, jd).score;
  };

  useEffect(() => {
    const filtered = students.filter(s => 
      s.cgpa >= parseFloat(minCgpa || '0') && 
      s.backlogs <= parseInt(maxBacklogs || '0') && 
      (s.skills?.Aptitude || 0) >= parseFloat(aptitudeCutoff || '0') &&
      ((s.skills?.Python || 0) >= parseFloat(codingCutoff || '0') || (s.skills?.Java || 0) >= parseFloat(codingCutoff || '0'))
    );
    setShortlistedStudents(filtered);
  }, [minCgpa, maxBacklogs, aptitudeCutoff, codingCutoff, students]);

  const handleSave = async () => {
    try {
      const newCompany = {
        name: companyName || 'Unnamed Criteria',
        minCgpa,
        maxBacklogs,
        aptitudeCutoff,
        codingCutoff,
        visitDate: new Date().toISOString()
      };
      
      const saved = await api.staff.createCompany(newCompany);
      setMatchingCompanies(prev => [...prev, saved]);
      setSavedCriteria(prev => [saved, ...prev]);
      setIsSaved(true);
      
      setTimeout(() => {
        setIsSaved(false);
        setShowSavedCriteria(true);
      }, 1500);
    } catch (error) {
      console.error('Failed to save criteria:', error);
      alert('Failed to save criteria to database.');
    }
  };

  const displayedStudents = React.useMemo(() => {
    let result = shortlistedStudents.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'company') {
      const getFirstCompany = (s: Student) => {
        const matches = allEvaluationUnits.filter(c => 
          s.cgpa >= c.minCgpa && 
          s.backlogs <= c.maxBacklogs && 
          s.skills.Aptitude >= c.aptitudeCutoff &&
          (s.skills.Python >= c.codingCutoff || s.skills.Java >= c.codingCutoff)
        );
        return matches.length > 0 ? matches[0].name : 'ZZZ';
      };
      result = [...result].sort((a, b) => getFirstCompany(a).localeCompare(getFirstCompany(b)));
    }

    return result;
  }, [shortlistedStudents, searchQuery, sortBy, allEvaluationUnits]);


  const applyCriteria = (criteria: any) => {
    setCompanyName(criteria.companyName);
    setMinCgpa(criteria.minCgpa);
    setMaxBacklogs(criteria.maxBacklogs);
    setAptitudeCutoff(criteria.aptitudeCutoff);
    setCodingCutoff(criteria.codingCutoff);
    setJobDescription(criteria.jobDescription);
    setShowSavedCriteria(false);
    setShowCriteriaForm(false);
  };

  const deleteCriteria = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCriteria(prev => prev.filter(c => c.id !== id));
  };

  const downloadShortlistPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Qualified Candidates Shortlist", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Target Company: ${companyName || 'General Selection'}`, 14, 30);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 36);
    
    const tableData = displayedStudents.map(s => {
      const eligible = allEvaluationUnits.filter(c => 
        s.cgpa >= c.minCgpa && 
        s.backlogs <= c.maxBacklogs && 
        s.skills.Aptitude >= c.aptitudeCutoff &&
        (s.skills.Python >= c.codingCutoff || s.skills.Java >= c.codingCutoff)
      ).map(c => c.name).join(', ');
      
      return [s.name, s.department, s.cgpa.toString(), eligible || 'N/A'];
    });
    
    autoTable(doc, {
      startY: 45,
      head: [['Student Name', 'Department', 'CGPA', 'Eligible Companies']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save(`shortlist_${companyName?.toLowerCase().replace(/\s+/g, '_') || 'candidates'}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Matching Engine</h2>
          <p className="text-slate-500">Define hiring criteria and automatically identify qualified candidates.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => setShowSavedCriteria(true)} className="gap-2 p-5 rounded-2xl bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-slate-50 shadow-lg shadow-indigo-100/50">
             <History className="w-5 h-5" /> Apply Criteria
           </Button>
           {!showCriteriaForm && (
             <Button onClick={() => setShowCriteriaForm(true)} className="gap-2 p-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
               <Briefcase className="w-5 h-5" /> {companyName ? 'Adjust Criteria' : 'Add New Criteria'}
             </Button>
           )}
           <Button onClick={downloadShortlistPDF} className="gap-2 p-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
             <Download className="w-5 h-5" /> Download Shortlist PDF
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {showCriteriaForm && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="lg:col-span-1">
              <Card className="border-indigo-100 shadow-md">
                 <CardHeader className="bg-slate-50/50 pb-6 relative">
                   <button onClick={() => setShowCriteriaForm(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-lg transition-colors">
                     <ChevronRight className="w-4 h-4 rotate-180" />
                   </button>
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                      <Briefcase className="w-6 h-6 text-indigo-600" />
                   </div>
                   <CardTitle>Hiring Module</CardTitle>
                   <CardDescription>Update filters to see real-time matches.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-5 p-8">
                   <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input placeholder="e.g. Google India" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <Label>Minimum Academic CGPA</Label>
                      <div className="relative">
                        <Input type="number" step="0.1" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Scale 10.0</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Max Allowable Backlogs</Label>
                      <Input type="number" value={maxBacklogs} onChange={(e) => setMaxBacklogs(e.target.value)} />
                   </div>
                   <div className="space-y-2 pt-4 border-t border-slate-100">
                      <Label>Aptitude % Cut-off</Label>
                      <Input type="number" value={aptitudeCutoff} onChange={(e) => setAptitudeCutoff(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <Label>Coding Proficiency %</Label>
                      <Input type="number" value={codingCutoff} onChange={(e) => setCodingCutoff(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <Label>Job Description (JD)</Label>
                      <textarea 
                        className="w-full min-h-[120px] p-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm leading-relaxed"
                        placeholder="Paste the company job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">JD will be matched against all student profiles</p>
                   </div>
                   <Button className="w-full mt-4 h-12 rounded-2xl gap-2 transition-all relative overflow-hidden" onClick={handleSave}>
                     <AnimatePresence mode="wait">
                       {isSaved ? (
                         <motion.span key="saved" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                           <CheckCircle2 className="w-5 h-5" /> Preferences Saved
                         </motion.span>
                       ) : (
                         <motion.span key="save" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                           Save Configuration
                         </motion.span>
                       )}
                     </AnimatePresence>
                   </Button>
                 </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("space-y-4 transition-all duration-500", showCriteriaForm ? "lg:col-span-2" : "lg:col-span-3")}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
               <div className="flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    Qualified Candidates
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{displayedStudents.length} Found</span>
                  </h3>
                  {companyName && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Shortlisting for: {companyName}</p>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{minCgpa}+ CGPA • {aptitudeCutoff}% Apt • {codingCutoff}% Code</p>
                    </div>
                  )}
               </div>
               <div className="flex flex-1 max-w-md items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                 <Search className="w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Search by name or department..."
                   className="bg-transparent border-none outline-none text-sm w-full"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <Label className="text-[10px] uppercase font-bold text-slate-400">Sort By</Label>
                   <select 
                     className="text-xs font-bold bg-slate-50 border-none rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value as 'name' | 'company')}
                   >
                     <option value="name">Name</option>
                     <option value="company">Company</option>
                   </select>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                   <Users className="w-4 h-4" /> Real-time active
                 </div>
               </div>
            </div>

           <div className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {displayedStudents.length > 0 ? (
                  displayedStudents.map((s) => (
                    <motion.div key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <Card className="hover:border-indigo-600 transition-all group border-slate-200">
                        <CardContent className="p-6">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                               <div className="flex flex-col items-center shrink-0">
                                 <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-slate-100 flex flex-col items-center justify-center group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all">
                                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Score</span>
                                    <span className={cn(
                                       "text-xl font-black",
                                       calculateMatchPercentage(s, jobDescription) > 70 ? "text-emerald-500" : calculateMatchPercentage(s, jobDescription) > 40 ? "text-indigo-600" : "text-slate-400"
                                    )}>
                                       {calculateMatchPercentage(s, jobDescription)}%
                                    </span>
                                 </div>
                               </div>

                               <div className="flex items-start gap-4 flex-1">
                                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-indigo-100">
                                    {s.cgpa}
                                 </div>
                               <div className="space-y-1">
                                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-lg">{s.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.department}</p>
                               </div>
                             </div>

                             <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1.5">Qualified For</span>
                                      <div className="flex flex-wrap gap-1">
                                        {allEvaluationUnits.filter(c => 
                                          s.cgpa >= c.minCgpa && 
                                          s.backlogs <= c.maxBacklogs && 
                                          s.skills.Aptitude >= c.aptitudeCutoff &&
                                          (s.skills.Python >= c.codingCutoff || s.skills.Java >= c.codingCutoff)
                                        ).map(c => {
                                          const companyMatch = calculateMatchPercentage(s, c.jobDescription || '');
                                          const isActive = (c as any).isActiveTransient;
                                          return (
                                            <span key={c.id} className={cn(
                                              "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border flex items-center gap-1.5 transition-all shadow-sm",
                                              isActive ? "bg-indigo-600 text-white border-indigo-700" :
                                              'isCustom' in c ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                            )}>
                                              {c.name}
                                              <span className={cn(
                                                "font-black border-l pl-1.5",
                                                isActive ? "text-white/80 border-white/20" : "text-indigo-600 border-slate-300"
                                              )}>{companyMatch}%</span>
                                            </span>
                                          );
                                        })}
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-start gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                   <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(s.skills).map(([name, val]) => (
                                        <span key={name} className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-medium border border-slate-100">
                                          {name}: <span className="text-slate-900 font-bold">{val}%</span>
                                        </span>
                                      ))}
                                   </div>
                                </div>
                             </div>

                             <div className="shrink-0 flex items-center md:pl-6 md:border-l border-slate-100">
                                <button onClick={() => setSelectedStudent(s)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all flex items-center gap-2 text-xs font-bold uppercase">
                                  Full Profile <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                             </div>
                           </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center flex flex-col items-center">
                     <XCircle className="w-12 h-12 text-slate-300 mb-4" />
                     <p className="text-slate-500 font-medium">No candidates match your search or criteria.</p>
                     <p className="text-xs text-slate-400 mt-1">Try adjusting the filters or search query.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedStudent(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col uppercase tracking-tight">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                    {selectedStudent.cgpa}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedStudent.name}</h3>
                    <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">{selectedStudent.department}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <FileText className="w-3.5 h-3.5" /> Professional Summary
                      </h4>
                      <div className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        {selectedStudent.bio}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Academic Rank</p>
                          <p className="text-lg font-black text-slate-900">TOP 5% OF BATCH</p>
                       </div>
                       <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Standing Backlogs</p>
                          <p className={cn("text-lg font-black", selectedStudent.backlogs > 0 ? "text-rose-500" : "text-emerald-500")}>
                            {selectedStudent.backlogs === 0 ? 'CLEAN RECORD' : `${selectedStudent.backlogs} ACTIVE`}
                          </p>
                       </div>
                    </div>

                    <div className="space-y-3 border-b border-slate-100 pb-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Zap className="w-3.5 h-3.5" /> Skill Proficiency
                      </h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {Object.entries(selectedStudent.skills).map(([skill, value]) => (
                          <div key={skill} className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-slate-500">{skill}</span>
                              <span className="text-indigo-600">{value}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className="h-full bg-indigo-600 rounded-full transition-all" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <CheckCircle2 className="w-3.5 h-3.5" /> Eligibility & Qualification Breakdown
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Academic Standing', value: selectedStudent.cgpa >= parseFloat(minCgpa || '0'), text: `CGPA ${selectedStudent.cgpa} (Min ${minCgpa} Required)` },
                          { label: 'Backlog Status', value: selectedStudent.backlogs <= parseInt(maxBacklogs || '0'), text: `${selectedStudent.backlogs} Active (Max ${maxBacklogs} Allowed)` },
                          { label: 'Aptitude Test', value: selectedStudent.skills.Aptitude >= parseFloat(aptitudeCutoff || '0'), text: `${selectedStudent.skills.Aptitude}% (Cutoff ${aptitudeCutoff}% Required)` },
                          { label: 'Coding Proficiency', value: selectedStudent.skills.Python >= parseFloat(codingCutoff || '0') || selectedStudent.skills.Java >= parseFloat(codingCutoff || '0'), text: `${Math.max(selectedStudent.skills.Python, selectedStudent.skills.Java)}% (Cutoff ${codingCutoff}% Required)` }
                        ].map((item, i) => (
                          <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{item.label}</p>
                              <p className="text-xs font-bold text-slate-700">{item.text}</p>
                            </div>
                            {item.value ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Building2 className="w-3.5 h-3.5" /> Company Matching Insights
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {allEvaluationUnits.filter(c => 
                          selectedStudent.cgpa >= c.minCgpa && 
                          selectedStudent.backlogs <= c.maxBacklogs && 
                          selectedStudent.skills.Aptitude >= c.aptitudeCutoff &&
                          (selectedStudent.skills.Python >= c.codingCutoff || selectedStudent.skills.Java >= c.codingCutoff)
                        ).map(c => {
                          const analysis = getMatchAnalysis(selectedStudent, c.jobDescription || '');
                          return (
                            <div key={c.id} className="p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 space-y-3">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className={cn(
                                       "w-8 h-8 rounded-lg shadow-sm flex items-center justify-center font-black border uppercase text-xs",
                                       'isCustom' in c ? "bg-indigo-600 text-white border-indigo-500" : "bg-white text-indigo-600 border-slate-100"
                                     )}>
                                        {c.name.charAt(0)}
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-slate-900 leading-none text-sm">{c.name}</p>
                                          {'isCustom' in c && <span className="bg-indigo-100 text-indigo-700 text-[8px] px-1 rounded-sm font-black uppercase">Custom</span>}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest leading-none">Qualified</p>
                                     </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                     <span className={cn("text-lg font-black", analysis.score > 70 ? "text-emerald-500" : analysis.score > 40 ? "text-indigo-600" : "text-slate-400")}>
                                        {analysis.score}%
                                     </span>
                                  </div>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                  <div className="space-y-1.5">
                                     <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Matched</p>
                                     <div className="flex flex-wrap gap-1">
                                        {analysis.matched.slice(0, 8).map(word => <span key={word} className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase border border-emerald-100/50">{word}</span>)}
                                     </div>
                                  </div>
                                  <div className="space-y-1.5">
                                     <p className="text-[9px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-1"><XCircle className="w-3 h-3" /> Missing</p>
                                     <div className="flex flex-wrap gap-1">
                                        {analysis.missing.slice(0, 8).map(word => <span key={word} className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase border border-rose-100/50">{word}</span>)}
                                     </div>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                      <Trophy className="w-8 h-8 mb-3 text-indigo-200" />
                      <h5 className="text-lg font-black mb-1">Placement Ready</h5>
                      <p className="text-indigo-100/80 text-[10px] font-bold leading-relaxed">Cleared academic and aptitude thresholds.</p>
                      <div className="mt-4 flex items-center gap-2 bg-white/10 p-3 rounded-xl overflow-hidden">
                         <Mail className="w-4 h-4 text-indigo-200 shrink-0" />
                         <span className="text-[10px] font-bold truncate">{selectedStudent.email}</span>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-4">
                       <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <h5 className="font-bold text-slate-900 text-sm">Progress</h5>
                       </div>
                       <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500 font-bold uppercase">Resume</span><span className="text-emerald-500 font-black">EXCELLENT</span></div>
                          <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500 font-bold uppercase">Attendance</span><span className="text-emerald-500 font-black">100%</span></div>
                          <div className="flex items-center justify-between text-[10px]"><span className="text-slate-500 font-bold uppercase">Aptitude</span><span className="text-indigo-600 font-black">{selectedStudent.skills.Aptitude}%</span></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                <Button className="flex-1 h-12 text-sm font-black rounded-2xl shadow-lg shadow-indigo-100 uppercase tracking-widest">Download Resume</Button>
                <Button variant="outline" className="flex-1 h-12 text-sm font-black rounded-2xl border-2 border-indigo-100 text-indigo-600 bg-white hover:bg-slate-50 uppercase tracking-widest" onClick={() => setSelectedStudent(null)}>Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSavedCriteria && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSavedCriteria(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><History className="w-5 h-5 text-indigo-600" /></div>
                  <div><h3 className="text-xl font-black text-slate-900">Apply Existing Criteria</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Select a preset to filter candidates</p></div>
                </div>
                <button onClick={() => setShowSavedCriteria(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {savedCriteria.length === 0 ? (
                  <div className="py-12 text-center"><Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-500 font-medium">No saved criteria yet.</p></div>
                ) : (
                  savedCriteria.map((criteria) => (
                    <div key={criteria.id} onClick={() => applyCriteria(criteria)} className="group p-5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 rounded-3xl transition-all cursor-pointer relative overflow-hidden">
                      <div className="flex justify-between items-start mb-3">
                        <div><h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{criteria.companyName}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{criteria.date}</p></div>
                        <button onClick={(e) => deleteCriteria(criteria.id, e)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Min CGPA</span><span className="text-xs font-bold text-slate-700">{criteria.minCgpa}</span></div>
                        <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Backlogs</span><span className="text-xs font-bold text-slate-700">{criteria.maxBacklogs}</span></div>
                        <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Aptitude</span><span className="text-xs font-bold text-slate-700">{criteria.aptitudeCutoff}%</span></div>
                        <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase">Coding</span><span className="text-xs font-bold text-slate-700">{criteria.codingCutoff}%</span></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
