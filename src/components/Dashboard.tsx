import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Lead, Deal } from '../types';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { cn, formatCurrency } from '../lib/utils';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
);

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads'));

    const unsubDeals = onSnapshot(collection(db, 'deals'), (snapshot) => {
      setDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'deals'));

    return () => {
      unsubLeads();
      unsubDeals();
    };
  }, []);

  const totalRevenue = deals
    .filter(d => d.stage === 'Won')
    .reduce((sum, d) => sum + d.value, 0);

  const conversionRate = leads.length > 0 
    ? ((deals.filter(d => d.stage === 'Won').length / leads.length) * 100).toFixed(1) 
    : 0;

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'bg-blue-500', trend: '+12%', up: true },
    { label: 'Active Deals', value: deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length, icon: TrendingUp, color: 'bg-indigo-500', trend: '+5%', up: true },
    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-emerald-500', trend: '+18%', up: true },
    { label: 'Conversion', value: `${conversionRate}%`, icon: CheckCircle2, color: 'bg-amber-500', trend: '-2%', up: false },
  ];

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue Growth',
        data: [3000, 4500, 4200, 6000, 7500, 9000],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const dealStatusData = {
    labels: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    datasets: [
      {
        label: 'Deals by Stage',
        data: [
          deals.filter(d => d.stage === 'Lead').length,
          deals.filter(d => d.stage === 'Qualified').length,
          deals.filter(d => d.stage === 'Proposal').length,
          deals.filter(d => d.stage === 'Negotiation').length,
          deals.filter(d => d.stage === 'Won').length,
          deals.filter(d => d.stage === 'Lost').length,
        ],
        backgroundColor: [
          'rgba(148, 163, 184, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                stat.up ? "text-emerald-600" : "text-rose-600"
              )}>
                {stat.trend}
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Overview</h3>
          <div className="h-[300px]">
            <Line 
              data={lineData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Pipeline Distribution</h3>
          <div className="h-[300px] flex justify-center">
            <Doughnut 
              data={dealStatusData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Recent Activity / Deals Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Recent Deals</h3>
          <button className="text-indigo-600 text-sm font-semibold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Deal Name</th>
                <th className="px-6 py-4 font-semibold">Lead</th>
                <th className="px-6 py-4 font-semibold">Value</th>
                <th className="px-6 py-4 font-semibold">Stage</th>
                <th className="px-6 py-4 font-semibold">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deals.slice(0, 5).map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">Deal #{deal.id.slice(0, 6)}</td>
                  <td className="px-6 py-4 text-slate-600">{deal.leadName}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(deal.value)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      deal.stage === 'Won' ? "bg-emerald-100 text-emerald-700" :
                      deal.stage === 'Lost' ? "bg-rose-100 text-rose-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{deal.expectedCloseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


