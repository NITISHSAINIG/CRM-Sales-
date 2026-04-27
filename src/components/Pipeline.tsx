import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Deal, Lead } from '../types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  DollarSign, 
  X,
  Search,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    value: 0,
    stage: 'Lead' as typeof STAGES[number],
    expectedCloseDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubDeals = onSnapshot(query(collection(db, 'deals'), orderBy('createdAt', 'desc')), (snapshot) => {
      setDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'deals'));

    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leads'));

    return () => {
      unsubDeals();
      unsubLeads();
    };
  }, []);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const dealId = draggableId;
    const newStage = destination.droppableId as typeof STAGES[number];

    try {
      await updateDoc(doc(db, 'deals', dealId), {
        stage: newStage,
        updatedAt: serverTimestamp()
      });
      toast.success(`Deal moved to ${newStage}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLead = leads.find(l => l.id === formData.leadId);
    if (!selectedLead) return;

    try {
      await addDoc(collection(db, 'deals'), {
        ...formData,
        leadName: selectedLead.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Deal created!');
      setIsModalOpen(false);
      setFormData({ leadId: '', value: 0, stage: 'Lead', expectedCloseDate: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return null;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filter deals..." className="bg-transparent outline-none text-sm w-48" />
          </div>
          <div className="text-sm text-slate-500">
            Total Pipeline Value: <span className="font-bold text-slate-900">{formatCurrency(deals.reduce((sum, d) => sum + d.value, 0))}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Deal
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
          {STAGES.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-80 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-700">{stage}</h3>
                  <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {deals.filter(d => d.stage === stage).length}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-400">
                  {formatCurrency(deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0))}
                </div>
              </div>

              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "flex-1 p-3 rounded-2xl transition-colors min-h-[200px]",
                      snapshot.isDraggingOver ? "bg-indigo-50/50 border-2 border-dashed border-indigo-200" : "bg-slate-100/50"
                    )}
                  >
                    <div className="space-y-3">
                      {deals
                        .filter(deal => deal.stage === stage)
                        .map((deal, index) => (
                          // @ts-ignore
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all group",
                                  snapshot.isDragging && "shadow-xl ring-2 ring-indigo-500/20 rotate-2"
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {deal.leadName}
                                  </h4>
                                  <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                                    <DollarSign className="w-4 h-4" />
                                    {formatCurrency(deal.value)}
                                  </div>
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {deal.expectedCloseDate}
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                      {deal.leadName.charAt(0)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* New Deal Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                  Create New Deal
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Link to Lead</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.leadId}
                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  >
                    <option value="">Select a lead...</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>{lead.name} ({lead.email})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Deal Value ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Close Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.expectedCloseDate}
                      onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Stage</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md"
                  >
                    Create Deal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
