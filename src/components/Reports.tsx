import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Lead, Deal } from '../types';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Calendar,
  ChevronDown
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { formatCurrency } from '../lib/utils';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
);

export default function Reports() {
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

  const sourceData = {
    labels: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Email Campaign'],
    datasets: [
      {
        label: 'Leads by Source',
        data: [
          leads.filter(l => l.source === 'Website').length,
          leads.filter(l => l.source === 'Referral').length,
          leads.filter(l => l.source === 'Cold Call').length,
          leads.filter(l => l.source === 'LinkedIn').length,
          leads.filter(l => l.source === 'Email Campaign').length,
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const revenueByStageData = {
    labels: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'],
    datasets: [
      {
        label: 'Pipeline Value ($)',
        data: [
          deals.filter(d => d.stage === 'Lead').reduce((sum, d) => sum + d.value, 0),
          deals.filter(d => d.stage === 'Qualified').reduce((sum, d) => sum + d.value, 0),
          deals.filter(d => d.stage === 'Proposal').reduce((sum, d) => sum + d.value, 0),
          deals.filter(d => d.stage === 'Negotiation').reduce((sum, d) => sum + d.value, 0),
          deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0),
        ],
        backgroundColor: [
          '#94a3b8',
          '#3b82f6',
          '#6366f1',
          '#a855f7',
          '#10b981',
        ],
      },
    ],
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Advanced Analytics</h2>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all">
            <Calendar className="w-4 h-4" />
            Last 30 Days
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lead Sources */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Lead Sources</h3>
          </div>
          <div className="h-[350px]">
            <Bar 
              data={sourceData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>

        {/* Revenue by Stage */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Pipeline Value by Stage</h3>
          </div>
          <div className="h-[350px] flex justify-center">
            <Doughnut 
              data={revenueByStageData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-medium mb-1">Average Deal Size</h4>
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            +4.2% vs last month
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-medium mb-1">Sales Cycle Length</h4>
          <p className="text-3xl font-bold text-slate-900">14 Days</p>
          <div className="mt-4 flex items-center gap-2 text-rose-600 text-sm font-semibold">
            <TrendingUp className="w-4 h-4 rotate-180" />
            -1.5% vs last month
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-medium mb-1">Win Rate</h4>
          <p className="text-3xl font-bold text-slate-900">
            {deals.length > 0 ? ((deals.filter(d => d.stage === 'Won').length / deals.length) * 100).toFixed(1) : 0}%
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            +2.1% vs last month
          </div>
        </div>
      </div>
    </div>
  );
}
