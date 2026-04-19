import React from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Target,
  Trophy,
  Lightbulb,
  Zap,
  ArrowUpRight
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
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { api } from '../../lib/api';

const QUALITY_TREND_DATA = [
  { month: 'Jan', score: 62, avg: 55 },
  { month: 'Feb', score: 68, avg: 57 },
  { month: 'Mar', score: 71, avg: 58 },
  { month: 'Apr', score: 74, avg: 60 },
  { month: 'May', score: 80, avg: 62 },
  { month: 'Jun', score: 85, avg: 64 },
];

const MATCH_DATA = [
  { name: 'TCS Digital', role: 'SDE Intern', match: 94, reason: 'CGPA + Coding Score', location: 'Chennai' },
  { name: 'Infosys', role: 'Systems Engineer', match: 88, reason: 'Aptitude Score', location: 'Bengaluru' },
  { name: 'Zoho Corp', role: 'Software Developer', match: 76, reason: 'CGPA Criteria Met', location: 'Chennai' },
  { name: 'Wipro', role: 'Project Engineer', match: 71, reason: 'Department Match', location: 'Hyderabad' },
];

const matchData = MATCH_DATA;

export const StudentAnalytics: React.FC<{ user: any }> = ({ user }) => {
  const [tips, setTips] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const data = await api.student.getAIInsights(user.email); // Using email as ID for now or lookup ID
      setTips(data);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInsights();
  }, []);

  const downloadAnalyticsPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("Performance Intelligence Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Summary Data
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Opportunity Matching Results", 14, 45);
    
    const tableData = matchData.map(m => [
      m.name,
      m.role,
      `${m.match}%`,
      m.reason
    ]);
    
    autoTable(doc, {
      startY: 50,
      head: [['Company', 'Role', 'Match %', 'Match Logic']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save("student_intelligence_report.pdf");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Performance Intelligence</h2>
          <p className="text-slate-500 font-medium">Deep dive into your assessment trends and eligibility matching.</p>
        </div>
        <Button onClick={downloadAnalyticsPDF} className="gap-2 p-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
           <Download className="w-5 h-5" /> Export Insights PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Trends Area Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-indigo-100/20 bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Growth Velocity</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Average vs. Your Performance</CardDescription>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={QUALITY_TREND_DATA}>
                <defs>
                   <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                   dataKey="month" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                   dy={10}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                   type="monotone" 
                   dataKey="score" 
                   stroke="#4f46e5" 
                   strokeWidth={4}
                   fillOpacity={1} 
                   fill="url(#colorScore)" 
                   animationDuration={2000}
                />
                <Line 
                   type="monotone" 
                   dataKey="avg" 
                   stroke="#cbd5e1" 
                   strokeDasharray="5 5"
                   strokeWidth={2}
                   dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Achievement / Badge */}
        <Card className="lg:col-span-1 border-none shadow-xl shadow-indigo-100/20 bg-indigo-600 rounded-[2.5rem] overflow-hidden text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-10 h-full flex flex-col justify-between relative z-10">
             <div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                   <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-4">Elite Performer</h3>
                <p className="text-indigo-100 font-medium leading-relaxed">
                   You ranked in the 98th percentile for the "Aptitude Masters" mock drive. 4 companies just prioritized your profile.
                </p>
             </div>
             <div className="pt-8">
                <Button className="w-full h-12 rounded-xl bg-white text-indigo-600 hover:bg-slate-100 border-none font-bold">Claim Badge</Button>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Matching Engine UI */}
         <Card className="lg:col-span-2 border-none shadow-xl shadow-indigo-100/20 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-xl font-bold">Eligibility & Matching</CardTitle>
                  <CardDescription className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Real-time placement opportunities</CardDescription>
               </div>
               <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Target className="w-6 h-6 text-indigo-600" />
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-100">
                  {MATCH_DATA.map((company, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                             <Building2 className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-900 flex items-center gap-2">
                               {company.name}
                               <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{company.role}</span>
                             </h4>
                             <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                               <MapPin className="w-3 h-3" /> {company.location}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6 w-full sm:w-auto">
                          <div className="text-right flex-1 sm:flex-none">
                             <div className="flex items-center justify-end gap-2 mb-1">
                                <span className={cn(
                                   "text-xs font-bold",
                                   company.match >= 90 ? 'text-emerald-500' : company.match >= 75 ? 'text-indigo-500' : 'text-amber-500'
                                )}>{company.match}% Match</span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className={cn(
                                      "h-full",
                                      company.match >= 90 ? 'bg-emerald-500' : company.match >= 75 ? 'bg-indigo-500' : 'bg-amber-500'
                                   )} style={{ width: `${company.match}%` }} />
                                </div>
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{company.reason}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-8 text-center bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">Load More Opportunities</p>
               </div>
            </CardContent>
         </Card>

         {/* AI Improvement Cards */}
         <div className="lg:col-span-1 space-y-6">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-4">AI Prep Intelligence</h4>
            {tips.length > 0 ? tips.map((tip, idx) => {
              const Icon = tip.icon === 'Zap' ? Zap : tip.icon === 'Trophy' ? Trophy : Lightbulb;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-none shadow-xl shadow-indigo-100/10 bg-white rounded-3xl group cursor-pointer hover:shadow-indigo-100/20 transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                          tip.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : tip.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                             <h5 className="font-bold text-slate-900">{tip.title}</h5>
                             <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2">{tip.detail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }) : (
              <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                   {isLoading ? 'AI is analyzing your performance...' : 'Take your first test to unlock AI insights.'}
                 </p>
              </div>
            )}
         </div>
      </div>
    </motion.div>
  );
};
