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
                      <Button className="rounded-xl px-8 shadow-lg shadow-indigo-100">Save Intelligence</Button>
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
           <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">University ID</Label>
           <Input defaultValue={student?.registerNumber || ''} placeholder="ID assigned by clg" className="h-12 border-slate-100 bg-slate-50" readOnly />
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

const AcademicForm = () => (
   <div className="space-y-10">
      {[
        { title: 'Undergraduate (Current)', type: 'B.Tech CSE', score: '8.45 CGPA', year: '2020-24' },
        { title: 'Higher Secondary (12th)', type: 'PCM + CS', score: '94.2%', year: '2020' },
        { title: 'Secondary School (10th)', type: 'CBSE', score: '9.8 CGPA', year: '2018' },
      ].map((edu, idx) => (
        <div key={idx} className="flex gap-6 relative">
           {idx < 2 && <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-100" />}
           <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 z-10 transition-transform hover:scale-110">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
           </div>
           <div className="flex-1 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                 <h4 className="font-bold text-slate-900">{edu.title}</h4>
                 <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{edu.year}</span>
              </div>
              <p className="text-sm text-slate-500 font-medium mb-4">{edu.type}</p>
              <div className="flex items-center gap-2">
                 <Award className="w-4 h-4 text-emerald-500" />
                 <span className="text-sm font-bold text-slate-700">{edu.score}</span>
              </div>
           </div>
        </div>
      ))}
   </div>
);

const TechnicalForm = () => (
  <div className="space-y-8">
     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { name: 'Python', icon: '🐍', score: 85 },
          { name: 'React', icon: '⚛️', score: 92 },
          { name: 'Node.js', icon: '🟢', score: 78 },
          { name: 'AWS', icon: '☁️', score: 65 },
          { name: 'SQL', icon: '🗄️', score: 88 },
          { name: 'Docker', icon: '🐋', score: 72 },
        ].map((skill, idx) => (
          <div key={idx} className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{skill.icon}</span>
                <span className="text-xs font-bold text-indigo-600">{skill.score}%</span>
             </div>
             <p className="font-bold text-slate-800 text-sm mb-3">{skill.name}</p>
             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.score}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className="h-full bg-indigo-500"
                />
             </div>
          </div>
        ))}
     </div>
     <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 gap-2 hover:border-indigo-300 hover:text-indigo-600">
        <Plus className="w-5 h-5" /> Add New Skill Certificate
     </Button>
  </div>
);

const ExperienceForm = () => (
  <div className="space-y-10">
     {[
       { title: 'Frontend Developer Intern', company: 'Global Flow SA', date: 'May - July 2023', details: 'Built interactive dashboard components using React and Tailwind CSS.', type: 'Internship' },
       { title: 'E-Commerce Engine', company: 'Self-Project', date: 'Dec 2022', details: 'Implemented a full-stack e-commerce system with Stripe integration.', type: 'Project' },
     ].map((exp, idx) => (
       <div key={idx} className="flex gap-6 relative group">
          <div className="w-1.5 h-full bg-slate-50 rounded-full absolute left-[23px] top-0 -z-10" />
          <div className="w-12 h-12 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center shrink-0 z-10 shadow-sm group-hover:border-indigo-100 transition-colors">
             <div className="w-4 h-4 bg-indigo-500 rounded-full" />
          </div>
          <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01] hover:shadow-indigo-100/30">
             <div className="flex justify-between items-start mb-2">
                <div>
                   <h4 className="font-bold text-slate-900">{exp.title}</h4>
                   <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">{exp.company}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{exp.date}</span>
             </div>
             <p className="text-sm text-slate-500 font-medium mt-4">{exp.details}</p>
             <div className="mt-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-full uppercase">{exp.type}</span>
             </div>
          </div>
       </div>
     ))}
     <Button className="w-full h-14 rounded-2xl shadow-lg shadow-indigo-100 gap-2">
        <Plus className="w-5 h-5" /> Add Internship or Project
     </Button>
  </div>
);

const ResumeHub = () => (
  <div className="space-y-8">
     <div className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-center flex flex-col items-center group hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-pointer">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
           <FileUp className="w-10 h-10 text-indigo-600" />
        </div>
        <h4 className="text-2xl font-bold text-slate-900 mb-2">Upload Master Resume</h4>
        <p className="text-slate-400 font-medium max-w-sm mb-8">
           Drag and drop your latest PDF resume here. Our AI will analyze it to update your skill scores.
        </p>
        <div className="flex items-center gap-3">
           <Button className="rounded-xl px-10 h-12 shadow-lg shadow-indigo-100">Browse Files</Button>
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
