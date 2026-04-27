import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Activity, Lead } from '../types';
import { useAuth } from '../App';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Search,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn, formatDate } from '../lib/utils';

export default function Activities() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    type: 'call' as const,
    description: ''
  });

  useEffect(() => {
    const unsubActivities = onSnapshot(query(collection(db, 'activities'), orderBy('timestamp', 'desc')), (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'activities'));

    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads'));

    return () => {
      unsubActivities();
      unsubLeads();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'activities'), {
        ...formData,
        timestamp: serverTimestamp(),
        createdBy: profile?.uid,
        createdByName: profile?.name
      });
      toast.success('Activity logged!');
      setIsModalOpen(false);
      setFormData({ leadId: '', type: 'call', description: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-600';
      case 'email': return 'bg-amber-100 text-amber-600';
      case 'meeting': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Activity Timeline</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Log Activity
        </button>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {activities.map((activity, i) => {
          const lead = leads.find(l => l.id === activity.leadId);
          return (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10",
                getActivityColor(activity.type)
              )}>
                {getActivityIcon(activity.type)}
              </div>
              
              {/* Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group-hover:border-indigo-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-800">
                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} with {lead?.name || 'Unknown Lead'}
                  </div>
                  <time className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(activity.timestamp)}
                  </time>
                </div>
                <div className="text-slate-600 text-sm mb-3">
                  {activity.description}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    <UserIcon className="w-3 h-3" />
                  </div>
                  <span className="text-xs text-slate-400">Logged by {(activity as any).createdByName || 'System'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Log New Activity</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full">
                <Plus className="w-5 h-5 text-slate-500 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Lead</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                >
                  <option value="">Select a lead...</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Activity Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['call', 'email', 'meeting', 'note'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type as any })}
                      className={cn(
                        "py-2 rounded-xl border text-sm font-semibold transition-all capitalize",
                        formData.type === type 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="What happened during this interaction?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-md"
                >
                  Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
