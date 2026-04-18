import React from 'react';
import { 
  Users, 
  SquareCheckBig, 
  TrendingUp, 
  FileTerminal,
  ArrowUpRight,
  ChevronRight,
  Building2,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Company } from '../types';

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'];

// ... Skill and Eligibility data preserved for UI structure ...
const SKILL_DATA = [
  { name: 'Python', value: 75 },
  { name: 'React', value: 62 },
  { name: 'Java', value: 88 },
  { name: 'Aptitude', value: 94 },
];

const ELIGIBILITY_DATA = [
  { name: 'Eligible', value: 65 },
  { name: 'Not Eligible', value: 35 },
];

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

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [eligibilityData, setEligibilityData] = React.useState(ELIGIBILITY_DATA);
  
  const [stats, setStats] = React.useState([
    { label: 'Total Students', value: '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Loading...' },
    { label: 'Eligible Students', value: '0', icon: SquareCheckBig, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Criteria: 7.5+' },
    { label: 'Readiness Score', value: '0%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Avg performance' },
    { label: 'Active Tests', value: '0', icon: FileTerminal, color: 'text-sky-600', bg: 'bg-sky-50', trend: 'Updating...' },
  ]);

  const fetchDashboardData = async () => {
    try {
      const data = await api.staff.getStats();
      
      setStats([
        { label: 'Total Students', value: data.totalStudents.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'In current batch' },
        { label: 'Eligible Students', value: data.eligibleCount.toString(), icon: SquareCheckBig, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Criteria: 7.5+' },
        { label: 'Readiness Score', value: `${data.avgReadiness}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Avg performance' },
        { label: 'Active Tests', value: data.activeTests.toString(), icon: FileTerminal, color: 'text-sky-600', bg: 'bg-sky-50', trend: 'Live now' },
      ]);

      setEligibilityData([
        { name: 'Eligible', value: data.eligibleCount },
        { name: 'Not Eligible', value: Math.max(0, data.totalStudents - data.eligibleCount) },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Nerve Center</h2>
        <p className="text-sm text-slate-500 font-medium italic">Real-time overview of current placement activities and metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card 
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="group cursor-pointer hover:border-indigo-300 transition-colors border-slate-200 shadow-sm rounded-[1rem] hover:shadow-xl hover:shadow-indigo-100/50"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-2 rounded-lg transition-colors", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-[1.75rem] font-bold text-slate-900 tracking-tight leading-none pt-1">{stat.value}</p>
                  <p className="text-[0.75rem] font-medium text-emerald-600 pt-1 flex items-center gap-1">
                    {stat.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <motion.div variants={itemVariants} className="lg:col-span-3 lg:row-span-2">
          <Card className="h-full border-slate-200 shadow-sm rounded-[1rem]">
            <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-none">
              <div>
                <CardTitle className="text-base font-semibold">Skills Breakdown (Aptitude & Technical)</CardTitle>
                <CardDescription className="text-[0.75rem] uppercase font-bold text-slate-400">Real-time Data</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[210px] sm:h-[260px] pt-0 px-6 pb-6">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={SKILL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-1 lg:row-span-2">
          <Card className="h-full border-slate-200 shadow-sm rounded-[1rem]">
            <CardHeader className="py-5 px-6 border-none">
              <CardTitle className="text-base font-semibold">Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px] pt-0 px-6 pb-6 flex flex-col justify-center">
              <div className="relative flex justify-center items-center">
                <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={ELIGIBILITY_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {ELIGIBILITY_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#f1f5f9'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[1.25rem] font-bold text-slate-900">0%</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[0.75rem] font-medium text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Eligible
                </div>
                <div className="flex items-center gap-2 text-[0.75rem] font-medium text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-200"></div> Pending
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="border-slate-200 shadow-sm rounded-[1rem]">
            <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-none">
              <CardTitle className="text-base font-semibold">Upcoming Company Visits</CardTitle>
              <button disabled className="text-[0.75rem] font-bold text-slate-300 uppercase tracking-wider">
                Syncing...
              </button>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-100 min-h-[100px] flex items-center justify-center">
               {companies.length === 0 ? (
                 <p className="text-slate-400 text-sm italic font-medium">No upcoming visits scheduled.</p>
               ) : (
                <div className="divide-y divide-slate-100 w-full">
                  {companies.map((company) => (
                    <motion.div key={company.id} whileHover={{ backgroundColor: '#f8fafc' }} className="flex items-center gap-4 px-6 py-4 group transition-colors cursor-pointer">
                      <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
                        <p className="text-[0.75rem] font-bold uppercase text-slate-900">
                          {new Date(company.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{company.name}</p>
                        <p className="text-[0.75rem] text-slate-500 font-medium">10:00 AM • Pending Sync</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </motion.div>
                  ))}
                </div>
               )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
