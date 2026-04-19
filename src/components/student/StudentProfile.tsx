import React, { useState, useRef } from 'react';
import { 
  UserCircle, 
  MapPin, 
  Mail, 
  Phone, 
  GraduationCap, 
  Award, 
  Briefcase, 
  FileUp, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Cpu,
  Globe,
  Star,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import { cn } from '../../lib/utils';

type Section = 'personal' | 'academic' | 'technical' | 'experience' | 'resume';

export const StudentProfile: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [resumeScore, setResumeScore] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null); // To be fetched from /api/student/profile
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // TODO: Fetch from /api/student/profile
    setIsLoading(false);
  }, []);

  const sections: { id: Section; label: string; icon: any }[] = [
    { id: 'personal', label: 'Personal Details', icon: UserCircle },
    { id: 'academic', label: 'Academic History', icon: GraduationCap },
    { id: 'technical', label: 'Technical Skills', icon: Cpu },
    { id: 'experience', label: 'Internships & Projects', icon: Briefcase },
    { id: 'resume', label: 'Resume Hub', icon: FileUp },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Career Profile</h2>
          <p className="text-slate-500 font-medium">Keep your credentials updated to attract top recruiters.</p>
        </div>
        
        <div className="flex items-center gap-6 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Portfolio Strength</p>
              <p className="text-2xl font-bold text-slate-900">{resumeScore}%</p>
           </div>
           <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                 <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                 <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * resumeScore) / 100} className="text-indigo-600 transition-all duration-1000" />
              </svg>
              <Star className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
           </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Rail */}
        <aside className="lg:w-72 shrink-0">
          <Card className="border-none shadow-xl shadow-indigo-100/20 bg-white rounded-[2rem] overflow-hidden">
             <div className="p-2">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
                      activeSection === sec.id 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <sec.icon className={cn("w-5 h-5", activeSection === sec.id ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                    <span className="font-bold text-sm">{sec.label}</span>
                    <AnimatePresence>
                      {activeSection === sec.id && (
                        <motion.div 
                          layoutId="active-pill"
                          className="ml-auto w-1.5 h-6 bg-white/40 rounded-full"
                        />
                      )}
                    </AnimatePresence>
                  </button>
                ))}
             </div>
          </Card>
        </aside>

        {/* Form Area */}
        <main className="flex-1">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeSection}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.2 }}
             >
                <Card className="border-none shadow-xl shadow-indigo-100/20 bg-white rounded-[2.5rem] overflow-hidden">
                   <div className="p-10">
                      {activeSection === 'personal' && <PersonalForm profileImage={profileImage} setProfileImage={setProfileImage} student={student} />}
                      {activeSection === 'academic' && <AcademicForm />}
                      {activeSection === 'technical' && <TechnicalForm />}
                      {activeSection === 'experience' && <ExperienceForm />}
                      {activeSection === 'resume' && <ResumeHub />}
                   </div>
                   <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <Button variant="ghost" className="rounded-xl">Reset Changes</Button>
                      <Button className="rounded-xl px-8 shadow-lg shadow-indigo-100">Save</Button>
                   </div>
                </Card>
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
};

const PersonalForm: React.FC<{ profileImage: string | null; setProfileImage: (url: string) => void; student: any }> = ({ profileImage, setProfileImage, student }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-6 mb-10">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center border-2 border-indigo-100 relative group overflow-hidden cursor-pointer"
          >
             {profileImage ? (
               <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <UserCircle className="w-10 h-10 text-indigo-600" />
             )}
             <div className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col text-[10px] text-white font-bold">
                 <FileUp className="w-4 h-4 mb-1" /> Update
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
               accept="image/*" 
             />
          </div>
          <div>
             <h3 className="text-2xl font-bold text-slate-900">{student?.name || 'Candidate Name'}</h3>
             <p className="text-slate-400 font-medium">{student?.courseDetail || 'Course Detail'}</p>
          </div>
       </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
           <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</Label>
           <Input defaultValue={student?.name || ''} placeholder="Type Here" className="h-12 border-slate-100 focus:ring-4 transition-all" />
        </div>
        <div className="space-y-2">
           <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">College Register Number</Label>
           <Input defaultValue={student?.registerNumber || ''} placeholder="e.g. cce230407" className="h-12 border-slate-100 bg-white" />
        </div>
        <div className="space-y-2">
           <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</Label>
           <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input defaultValue={student?.email || ''} placeholder="mail@smvec.ac.in" className="pl-10 h-12 border-slate-100" />
           </div>
        </div>
        <div className="space-y-2">
           <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</Label>
           <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input defaultValue={student?.phone || ''} placeholder="+91 00000 00000" className="pl-10 h-12 border-slate-100" />
           </div>
        </div>
     </div>
  </div>
  );
};

const AcademicForm = () => {
  const [records, setRecords] = React.useState([
    { title: 'Undergraduate (Current)', type: '', score: '', year: '' },
    { title: 'Higher Secondary (12th)', type: '', score: '', year: '' },
    { title: 'Secondary School (10th)', type: '', score: '', year: '' },
  ]);

  const updateRecord = (idx: number, field: string, value: string) => {
    setRecords(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  return (
   <div className="space-y-10">
      {records.map((edu, idx) => (
        <div key={idx} className="flex gap-6 relative">
           {idx < records.length - 1 && <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-100" />}
           <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 z-10 transition-transform hover:scale-110">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
           </div>
           <div className="flex-1 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-900">{edu.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Stream / Board</Label>
                  <Input value={edu.type} onChange={e => updateRecord(idx, 'type', e.target.value)} placeholder="e.g. B.Tech CSE" className="h-10 border-slate-200" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Score / CGPA</Label>
                  <Input value={edu.score} onChange={e => updateRecord(idx, 'score', e.target.value)} placeholder="e.g. 8.45" className="h-10 border-slate-200" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Year</Label>
                  <Input value={edu.year} onChange={e => updateRecord(idx, 'year', e.target.value)} placeholder="e.g. 2020-24" className="h-10 border-slate-200" />
                </div>
              </div>
           </div>
        </div>
      ))}
   </div>
  );
};

const TechnicalForm = () => {
  const [skills, setSkills] = React.useState([
    { name: '', icon: '💻', score: 0 },
  ]);
  const [newSkill, setNewSkill] = React.useState('');

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills(prev => [...prev, { name: newSkill.trim(), icon: '⚡', score: 50 }]);
    setNewSkill('');
  };

  const removeSkill = (idx: number) => setSkills(prev => prev.filter((_, i) => i !== idx));
  const updateSkill = (idx: number, field: string, value: any) => setSkills(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  return (
  <div className="space-y-8">
     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {skills.map((skill, idx) => (
          <div key={idx} className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow relative group">
             <button onClick={() => removeSkill(idx)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-50 rounded-lg">
               <Trash2 className="w-3 h-3 text-rose-400" />
             </button>
             <div className="space-y-3">
                <Input value={skill.name} onChange={e => updateSkill(idx, 'name', e.target.value)} placeholder="Skill name" className="h-9 text-sm font-bold border-slate-200" />
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" value={skill.score} onChange={e => updateSkill(idx, 'score', parseInt(e.target.value))} className="flex-1 accent-indigo-600" />
                  <span className="text-xs font-bold text-indigo-600 w-10 text-right">{skill.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${skill.score}%` }} transition={{ duration: 0.5 }} className="h-full bg-indigo-500" />
                </div>
             </div>
          </div>
        ))}
     </div>
     <div className="flex gap-3">
        <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Enter a new skill (e.g. Python, React)" className="h-14 rounded-2xl flex-1" />
        <Button onClick={addSkill} className="h-14 rounded-2xl px-8 shadow-lg shadow-indigo-100 gap-2">
           <Plus className="w-5 h-5" /> Add Skill
        </Button>
     </div>

     <div className="pt-8 border-t border-slate-100">
        <h4 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          Earned Certificates
          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Official Verification</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                    <Medal className="w-5 h-5 text-indigo-600" />
                 </div>
                 <div>
                    <p className="font-bold text-slate-900">AWS Certified Developer</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Amazon Web Services • 2024</p>
                 </div>
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">View</Button>
           </div>
           <Button variant="outline" className="h-full min-h-[82px] border-dashed border-2 rounded-3xl border-slate-200 text-slate-400 gap-2 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all">
              <Plus className="w-5 h-5" /> Add Certificate
           </Button>
        </div>
     </div>
  </div>
  );
};

const ExperienceForm = () => {
  const [entries, setEntries] = React.useState<{ title: string; company: string; date: string; details: string; type: string }[]>([]);

  const addEntry = () => setEntries(prev => [...prev, { title: '', company: '', date: '', details: '', type: 'Internship' }]);
  const removeEntry = (idx: number) => setEntries(prev => prev.filter((_, i) => i !== idx));
  const updateEntry = (idx: number, field: string, value: string) => setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  return (
  <div className="space-y-10">
     {entries.length === 0 && (
       <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
         <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
         <h5 className="font-bold text-slate-900">No Entries Yet</h5>
         <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">Add your internships, projects, and work experience below.</p>
       </div>
     )}
     {entries.map((exp, idx) => (
       <div key={idx} className="flex gap-6 relative group">
          <div className="w-1.5 h-full bg-slate-50 rounded-full absolute left-[23px] top-0 -z-10" />
          <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center shrink-0 z-10 shadow-sm group-hover:border-indigo-100 transition-colors">
             <div className="w-4 h-4 bg-indigo-500 rounded-full" />
          </div>
          <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
             <div className="flex justify-between items-start">
               <button onClick={() => removeEntry(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-50 rounded-lg absolute top-4 right-4">
                 <Trash2 className="w-4 h-4 text-rose-400" />
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <Label className="text-[10px] font-bold text-slate-400 uppercase">Role / Title</Label>
                 <Input value={exp.title} onChange={e => updateEntry(idx, 'title', e.target.value)} placeholder="e.g. Frontend Developer Intern" className="h-10 border-slate-200" />
               </div>
               <div className="space-y-1">
                 <Label className="text-[10px] font-bold text-slate-400 uppercase">Company / Organization</Label>
                 <Input value={exp.company} onChange={e => updateEntry(idx, 'company', e.target.value)} placeholder="e.g. Google" className="h-10 border-slate-200" />
               </div>
               <div className="space-y-1">
                 <Label className="text-[10px] font-bold text-slate-400 uppercase">Duration</Label>
                 <Input value={exp.date} onChange={e => updateEntry(idx, 'date', e.target.value)} placeholder="e.g. May - July 2023" className="h-10 border-slate-200" />
               </div>
               <div className="space-y-1">
                 <Label className="text-[10px] font-bold text-slate-400 uppercase">Type</Label>
                 <select value={exp.type} onChange={e => updateEntry(idx, 'type', e.target.value)} className="h-10 w-full px-3 border border-slate-200 rounded-lg text-sm font-medium bg-white">
                   <option>Internship</option>
                   <option>Project</option>
                   <option>Full-Time</option>
                   <option>Freelance</option>
                 </select>
               </div>
             </div>
             <div className="space-y-1">
               <Label className="text-[10px] font-bold text-slate-400 uppercase">Description</Label>
               <textarea value={exp.details} onChange={e => updateEntry(idx, 'details', e.target.value)} placeholder="Describe what you did..." className="w-full p-3 border border-slate-200 rounded-xl text-sm min-h-[80px] resize-none" />
             </div>
          </div>
       </div>
     ))}
     <Button onClick={addEntry} className="w-full h-14 rounded-2xl shadow-lg shadow-indigo-100 gap-2">
        <Plus className="w-5 h-5" /> Add Internship or Project
     </Button>
  </div>
  );
};

const ResumeHub = () => {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  return (
  <div className="space-y-8">
     <div 
        onClick={() => fileRef.current?.click()}
        className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-center flex flex-col items-center group hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-pointer"
     >
        <input 
          type="file" 
          ref={fileRef} 
          className="hidden" 
          accept=".pdf" 
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
           <FileUp className="w-10 h-10 text-indigo-600" />
        </div>
        <h4 className="text-2xl font-bold text-slate-900 mb-2">
          {selectedFile ? 'File Ready for Upload' : 'Upload Master Resume'}
        </h4>
        <p className="text-slate-400 font-medium max-w-sm mb-8">
           {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop your latest PDF resume here. Our AI will analyze it to update your skill scores.'}
        </p>
        <div className="flex items-center gap-3">
           <Button className="rounded-xl px-10 h-12 shadow-lg shadow-indigo-100">
             {selectedFile ? 'Upload Now' : 'Browse Files'}
           </Button>
           <Button variant="ghost" className="rounded-xl h-12">Connect LinkedIn</Button>
        </div>
     </div>

     <Card className="border-none shadow-sm bg-slate-50 rounded-[2rem] overflow-hidden">
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200">
                 <Globe className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-900">ArjunMehta_Resume_2024.pdf</p>
                 <p className="text-xs text-slate-400 font-medium">Uploaded on 12 April • 1.2 MB</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none border border-emerald-100">
                 <CheckCircle2 className="w-3 h-3" /> Latest
              </div>
              <Button variant="ghost" className="h-10 w-10 p-0 text-slate-400 hover:text-rose-500 rounded-xl">
                 <Trash2 className="w-4 h-4" />
              </Button>
           </div>
        </div>
     </Card>

     <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4">
        <TrendingUp className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
           <p className="font-bold text-amber-900 text-sm">Resume Strength Advice</p>
           <p className="text-xs text-amber-700 font-medium mt-1 leading-relaxed">
             Add more emphasis on your "Docker" and "AWS" skills to increase your visibility for 4 major ongoing company drives (Goldman Sachs, AWS Internships).
           </p>
        </div>
     </div>
     </div>
  );
};
