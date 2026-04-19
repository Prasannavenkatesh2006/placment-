import React from 'react';
import { 
  TrendingUp, 
  FileTerminal, 
  FileCheck2, 
  Building2,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Target,
  Zap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip
} from 'recharts';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const RADAR_DATA = [
  { subject: 'Aptitude', A: 90, fullMark: 100 },
  { subject: 'Technical', A: 75, fullMark: 100 },
  { subject: 'Verbal', A: 85, fullMark: 100 },
  { subject: 'Logical', A: 92, fullMark: 100 },
];

const READINESS_DATA = [
  { name: 'Completed', value: 88 },
  { name: 'Remaining', value: 12 },
];

const COLORS = ['#4f46e5', '#f1f5f9'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export const StudentDashboard: React.FC<{ onStartAssessments?: () => void }> = ({ onStartAssessments }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [studentData, setStudentData] = React.useState<any>(null); // To be fetched from /api/student/dashboard
  const [radarData, setRadarData] = React.useState(RADAR_DATA);
  const [readinessData, setReadinessData] = React.useState(READINESS_DATA);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await api.student.getDashboard();
        setStudentData(data.profile);
        
        if (data.profile.skills) {
          try {
            const parsedSkills = typeof data.profile.skills === 'string' ? JSON.parse(data.profile.skills) : data.profile.skills;
            const formattedRadar = Object.entries(parsedSkills).map(([subject, val]) => ({
              subject,
              A: val as number,
              fullMark: 100
            }));
            if (formattedRadar.length > 0) setRadarData(formattedRadar);
          } catch (e) { console.error('Failed to parse skills for dashboard'); }
        }

        setReadinessData([
          { name: 'Completed', value: data.profile.readinessScore || 0 },
          { name: 'Remaining', value: 100 - (data.profile.readinessScore || 0) },
        ]);

        if (data.upcomingAssessments) {
          setUpcomingTasks(data.upcomingAssessments.map((a: any) => ({
            title: a.name,
            time: `Starts ${new Date(a.startDate).toLocaleDateString()}`,
            type: 'Test',
            color: 'indigo'
          })));
        }
      } catch (error) {
        console.error('Failed to fetch student dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const [upcomingTasks, setUpcomingTasks] = React.useState([
    { title: 'Resume Update Required', time: 'Deadline: Tonight', type: 'Profile', color: 'amber' },
    { title: 'Aptitude Practice Set 4', time: 'Self-paced', type: 'Prep', color: 'emerald' },
  ]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back{studentData?.name ? `, ${studentData.name}` : ''}!
        </h2>
        <p className="text-slate-500 font-medium">
          {studentData?.rankMessage || 'Stay focused on your preparation and mock tests.'}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="h-full border-none shadow-xl shadow-indigo-100/20 bg-white hover:shadow-indigo-100/40 transition-shadow transition-transform hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={READINESS_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationBegin={400}
                      animationDuration={1500}
                    >
                      {READINESS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900">{studentData?.readinessScore || 0}%</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Readiness Score</p>
              <div className="mt-2 flex items-center gap-1 text-emerald-500 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +4% this month
              </div>
            </CardContent>
          </Card>
        </motion.div>

         {[
          { label: 'Pending Items', value: upcomingTasks.length.toString(), sub: 'Assessments & Profile', icon: FileTerminal, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Current CGPA', value: studentData?.cgpa?.toString() || '0.0', icon: FileCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Eligible Companies', value: '...', sub: 'Matching your profile', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50', pulse: true },
        ].map((kpi, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="h-full border-none shadow-xl shadow-indigo-100/20 bg-white hover:shadow-indigo-100/40 transition-shadow transition-transform hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-3 rounded-2xl", kpi.bg)}>
                    <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                  </div>
                  {kpi.pulse && (
                    <div className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{kpi.value}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{kpi.label}</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-1">{kpi.sub}</p>
                </div>
              </CardContent>
              <div className={cn("h-1 w-full", idx === 0 ? "bg-indigo-500" : idx === 1 ? "bg-emerald-500" : "bg-amber-500")} />
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="border-none shadow-xl shadow-indigo-100/20 bg-white h-full rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                 </div>
                 <div>
                    <CardTitle className="text-xl font-bold">Priority Tasks</CardTitle>
                    <CardDescription className="text-xs font-bold text-indigo-500 uppercase">Action required</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                   {upcomingTasks.map((task, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-10 rounded-full", task.color === 'indigo' ? 'bg-indigo-500' : task.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500')} />
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                             <Clock className="w-3 h-3" />
                             <span>{task.time}</span>
                             <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">{task.type}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
               </div>
               <div className="p-6">
                  <Button 
                    className="w-full rounded-2xl h-12 shadow-lg shadow-indigo-100 group"
                    onClick={onStartAssessments}
                  >
                    Start Assessments
                    <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
               </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skill Radar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-none shadow-xl shadow-indigo-100/20 bg-white h-full rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Skill Matrix</CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Your core performance indicators</CardDescription>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
               <div className="h-[320px] w-full flex items-center justify-center">
                  {isLoading ? (
                    <div className="w-64 h-64 rounded-full border-4 border-slate-50 border-t-indigo-200 animate-spin flex items-center justify-center">
                       <div className="w-full h-full rounded-full border-4 border-transparent border-b-indigo-400 rotate-45" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <Radar
                          name={studentData?.name || 'Student'}
                          dataKey="A"
                          stroke="#4f46e5"
                          fill="#4f46e5"
                          fillOpacity={0.4}
                          animationDuration={1500}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {radarData.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase truncate mb-1">{item.subject}</p>
                      <p className="text-xl font-bold text-slate-900">{item.A}%</p>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
