import React, { useState, useEffect } from 'react';
import { AccessFormData, StaffType, AdditionalStaff, Ticket, TicketStatus, EditLog } from './types.ts';

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'mock-1',
    refId: 'JW-ALPHA',
    timestamp: Date.now() - 86400000,
    status: TicketStatus.OPEN,
    primaryName: 'Ahmed Mansour',
    company: 'Jawwal',
    department: 'IT Infrastructure',
    purpose: 'Routine maintenance on core distribution switches and patch panel cleanup.',
    rack: 'Rack 12-A / Core Room',
    hasEquipment: true,
    equipmentList: 'Fluke Network Tester, Console Cable, Toolkit',
    notes: 'Scheduled window is 2:00 AM to 4:00 AM.',
    additionalStaff: [],
    history: [
      { timestamp: Date.now() - 86400000, action: 'Ticket Created' }
    ]
  },
  {
    id: 'mock-2',
    refId: 'JW-BETA',
    timestamp: Date.now() - 3600000,
    status: TicketStatus.OPEN,
    primaryName: 'John Smith',
    company: 'Cisco Systems',
    department: 'Support Services',
    purpose: 'Warranty replacement for failed supervisor module in Nexus chassis.',
    rack: 'Rack 04 / Row B',
    hasEquipment: true,
    equipmentList: 'Replacement Module, Antistatic wrist strap',
    notes: 'Vendor ticket #9928341',
    additionalStaff: [
      { id: 's1', type: StaffType.NON_JAWWAL, name: 'Sarah Connor', idNumber: 'P-98827361' }
    ],
    history: [
      { timestamp: Date.now() - 7200000, action: 'Ticket Created' },
      { timestamp: Date.now() - 3600000, action: 'Details Updated' }
    ]
  },
  {
    id: 'mock-3',
    refId: 'JW-GAMMA',
    timestamp: Date.now() - 172800000,
    status: TicketStatus.LOCKED,
    primaryName: 'Samira Khalid',
    company: 'Jawwal',
    department: 'Security Operations',
    purpose: 'Quarterly physical security audit and sensor calibration.',
    rack: 'All Data Halls',
    hasEquipment: false,
    equipmentList: '',
    notes: 'Annual compliance review. Ticket locked after completion.',
    additionalStaff: [
      { id: 's2', type: StaffType.JAWWAL, name: 'Omar Rayyan' }
    ],
    history: [
      { timestamp: Date.now() - 172800000, action: 'Ticket Created' },
      { timestamp: Date.now() - 172000000, action: 'Security Lock Applied' }
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'dashboard'>('form');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refId, setRefId] = useState('');
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('jawwal_tickets');
    return saved ? JSON.parse(saved) : MOCK_TICKETS;
  });

  const [formData, setFormData] = useState<AccessFormData>({
    primaryName: '',
    company: '',
    department: '',
    purpose: '',
    rack: '',
    hasEquipment: false,
    equipmentList: '',
    notes: '',
    additionalStaff: []
  });

  useEffect(() => {
    localStorage.setItem('jawwal_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const handleAddStaff = (type: StaffType) => {
    const newStaff: AdditionalStaff = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: '',
      idNumber: type === StaffType.NON_JAWWAL ? '' : undefined
    };
    setFormData(prev => ({
      ...prev,
      additionalStaff: [...prev.additionalStaff, newStaff]
    }));
  };

  const handleRemoveStaff = (id: string) => {
    setFormData(prev => ({
      ...prev,
      additionalStaff: prev.additionalStaff.filter(s => s.id !== id)
    }));
  };

  const handleStaffChange = (id: string, field: 'name' | 'idNumber', value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalStaff: prev.additionalStaff.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    
    if (editingId) {
      setTickets(prev => prev.map(t => 
        t.id === editingId 
          ? { 
              ...t, 
              ...formData, 
              history: [...t.history, { timestamp: now, action: 'Information Edited' }]
            } 
          : t
      ));
      setEditingId(null);
      setView('dashboard');
    } else {
      const newRef = 'JW-' + Math.random().toString(36).substr(2, 7).toUpperCase();
      const newTicket: Ticket = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        refId: newRef,
        timestamp: now,
        status: TicketStatus.OPEN,
        history: [{ timestamp: now, action: 'Ticket Created' }]
      };
      setTickets(prev => [newTicket, ...prev]);
      setRefId(newRef);
      setIsSubmitted(true);
    }
  };

  const handleNewRequest = () => {
    setIsSubmitted(false);
    setFormData({
      primaryName: '',
      company: '',
      department: '',
      purpose: '',
      rack: '',
      hasEquipment: false,
      equipmentList: '',
      notes: '',
      additionalStaff: []
    });
    setEditingId(null);
    setView('form');
  };

  const handleEditTicket = (ticket: Ticket) => {
    if (ticket.status === TicketStatus.LOCKED) return;
    setFormData({
      primaryName: ticket.primaryName,
      company: ticket.company,
      department: ticket.department,
      purpose: ticket.purpose,
      rack: ticket.rack,
      hasEquipment: ticket.hasEquipment,
      equipmentList: ticket.equipmentList,
      notes: ticket.notes,
      additionalStaff: ticket.additionalStaff
    });
    setEditingId(ticket.id);
    setView('form');
    setIsMenuOpen(false);
  };

  const handleDeleteTicket = (id: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      setTickets(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleLock = (id: string) => {
    const now = Date.now();
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status === TicketStatus.OPEN ? TicketStatus.LOCKED : TicketStatus.OPEN;
        const action = newStatus === TicketStatus.LOCKED ? 'Security Lock Applied' : 'Ticket Unlocked';
        return { 
          ...t, 
          status: newStatus,
          history: [...t.history, { timestamp: now, action }]
        };
      }
      return t;
    }));
  };

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(ts);
  };

  return (
    <div className="relative min-h-screen">
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="fixed top-6 left-6 z-50 p-3 bg-white rounded-2xl shadow-lg text-brand-slate hover:scale-105 transition-all">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
      </button>

      <div className={`fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-md shadow-2xl z-40 transform transition-transform duration-300 ease-out p-8 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mt-12 space-y-8">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Menu</h2>
            <nav className="space-y-4">
              <button onClick={() => { setView('form'); handleNewRequest(); setIsMenuOpen(false); }} className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-sm transition-all ${view === 'form' ? 'bg-lime-50 text-brand-lime shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                New Request
              </button>
              <button onClick={() => { setView('dashboard'); setIsMenuOpen(false); }} className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold text-sm transition-all ${view === 'dashboard' ? 'bg-blue-50 text-brand-blue shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Dashboard
              </button>
            </nav>
          </div>
          <div className="pt-8 border-t border-slate-100">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest text-center">Jawwal Data Center Access v1.0</p>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 ${isMenuOpen ? 'ml-72' : 'ml-0'}`}>
        {view === 'form' ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 py-6">
            <div className="w-full max-w-lg">
              {isSubmitted ? (
                <div className="glass-card rounded-[32px] overflow-hidden animate-slide-up shadow-2xl">
                  <div className="flex h-1.5 w-full"><div className="bg-lime-400 w-2/3"></div><div className="bg-blue-500 w-1/3"></div></div>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-lime-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-brand-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">Request Logged</h3>
                    <p className="text-slate-400 text-xs mb-6">Ref: <span className="font-bold text-slate-600">{refId}</span></p>
                    <div className="flex flex-col gap-2">
                      <button onClick={handleNewRequest} className="px-6 py-2.5 bg-brand-lime text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">Submit Another</button>
                      <button onClick={() => setView('dashboard')} className="px-6 py-2.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-colors">Go to Dashboard</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center mb-6 animate-slide-up">
                    <h1 className="text-3xl font-black tracking-tighter"><span className="text-brand-lime">jawwal</span><span className="text-brand-blue">DC</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2 bg-white/50 px-4 py-1.5 rounded-full border border-slate-100">{editingId ? 'Edit Access Request' : 'Access Request'}</p>
                  </div>
                  <div className="glass-card rounded-[24px] overflow-hidden animate-slide-up shadow-2xl">
                    <div className="flex h-1.5 w-full"><div className="bg-lime-400 w-2/3"></div><div className="bg-blue-500 w-1/3"></div></div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                      <div className="space-y-3.5">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Applicant Information</h2>
                        <div className="grid gap-3.5">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Primary Employee Name</label><input type="text" required value={formData.primaryName} onChange={(e) => setFormData({...formData, primaryName: e.target.value})} className="w-full p-3 mt-0.5 bg-slate-50 border-2 border-transparent rounded-xl text-slate-700 text-sm font-semibold input-focus-effect outline-none" placeholder="Full name" /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Company</label><input type="text" required value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full p-3 mt-0.5 bg-slate-50 border-2 border-transparent rounded-xl text-slate-700 text-sm font-semibold input-focus-effect outline-none" placeholder="Company name" /></div>
                            <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full p-3 mt-0.5 bg-slate-50 border-2 border-transparent rounded-xl text-slate-700 text-sm font-semibold input-focus-effect outline-none" placeholder="IT, Ops, etc." /></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {formData.additionalStaff.map((staff) => (
                            <div key={staff.id} className="p-4 bg-white rounded-xl border-2 border-slate-50 shadow-sm space-y-2.5 animate-slide-up">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">{staff.type === StaffType.NON_JAWWAL ? <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg> : <svg className="w-3.5 h-3.5 text-brand-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4"></path></svg>}<span className={`text-[9px] font-black uppercase ${staff.type === StaffType.NON_JAWWAL ? 'text-brand-blue' : 'text-brand-lime'}`}>{staff.type === StaffType.NON_JAWWAL ? 'Non-Jawwal Staff' : 'Jawwal Staff'}</span></div>
                                <button type="button" onClick={() => handleRemoveStaff(staff.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                              </div>
                              <input type="text" required value={staff.name} onChange={(e) => handleStaffChange(staff.id, 'name', e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-lg text-xs font-semibold outline-none border-2 border-transparent focus:border-slate-100" placeholder="Full Name" />
                              {staff.type === StaffType.NON_JAWWAL && <input type="text" required value={staff.idNumber} onChange={(e) => handleStaffChange(staff.id, 'idNumber', e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-lg text-xs font-semibold outline-none border-2 border-transparent focus:border-slate-100" placeholder="ID / Passport Number" />}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button type="button" onClick={() => handleAddStaff(StaffType.JAWWAL)} className="flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-lime-100 text-[9px] font-black text-brand-lime hover:bg-lime-50 transition-all uppercase group"><svg className="w-3 h-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011-1v5m-4 0h4"></path></svg>JAWWAL STAFF</button>
                          <button type="button" onClick={() => handleAddStaff(StaffType.NON_JAWWAL)} className="flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-blue-100 text-[9px] font-black text-brand-blue hover:bg-blue-50 transition-all uppercase group"><svg className="w-3 h-3 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>NON-JAWWAL STAFF</button>
                        </div>
                      </div>
                      <hr className="border-slate-100" />
                      <div className="space-y-3.5">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Details</h2>
                        <div className="grid gap-3.5">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Work Purpose</label><textarea required value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} className="w-full p-3 mt-0.5 bg-slate-50 border-2 border-transparent rounded-xl text-slate-700 text-sm font-semibold input-focus-effect resize-none outline-none" rows={2} placeholder="Planned tasks..."></textarea></div>
                          <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Target Rack / Devices</label><input type="text" required value={formData.rack} onChange={(e) => setFormData({...formData, rack: e.target.value})} className="w-full p-3 mt-0.5 bg-slate-50 border-2 border-transparent rounded-xl text-slate-700 text-sm font-semibold input-focus-effect outline-none" placeholder="e.g. Rack 25 / Storage devices" /></div>
                        </div>
                      </div>
                      <div className="space-y-3.5">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600">Bringing Equipment?</span>
                            <label className="relative inline-block w-10 h-5 cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={formData.hasEquipment} onChange={(e) => setFormData({...formData, hasEquipment: e.target.checked})}/>
                              <span className="absolute inset-0 bg-slate-200 rounded-full transition-colors peer-checked:bg-brand-lime"></span>
                              <span className="absolute left-0.5 bottom-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
                            </label>
                          </div>
                          {formData.hasEquipment && <div className="mt-3 animate-slide-up"><textarea value={formData.equipmentList} onChange={(e) => setFormData({...formData, equipmentList: e.target.value})} className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-semibold outline-none" rows={2} placeholder="List equipment..."></textarea></div>}
                        </div>
                        <div className="relative"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Additional Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-3 mt-0.5 bg-slate-50 border-2 border-transparent rounded-xl text-slate-700 text-sm font-semibold input-focus-effect resize-none outline-none" rows={2} placeholder="Additional information..."></textarea></div>
                      </div>
                      <button type="submit" className="w-full btn-submit-style text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] text-xs">{editingId ? 'Save Changes' : 'Submit Request'}</button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-10 animate-slide-up">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-brand-slate tracking-tighter">Portal Dashboard</h1>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-2">Access Audit & Activity Tracking</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/80 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-white flex items-center gap-3 transition-all hover:scale-105">
                    <div className="relative">
                      <span className="absolute inset-0 bg-brand-lime rounded-full animate-ping opacity-25"></span>
                      <span className="relative block w-2 h-2 bg-brand-lime rounded-full"></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Logs</span>
                      <span className="text-lg font-black text-brand-slate leading-none">{tickets.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-20 bg-white/40 backdrop-blur rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 1118 0z"></path></svg></div>
                  <h3 className="text-xl font-black text-slate-400">Database is empty</h3>
                  <button onClick={() => setView('form')} className="mt-4 px-8 py-3 bg-brand-lime text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-lime-200">Initiate First Log</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className={`group relative rounded-[32px] p-6 shadow-xl transition-all duration-300 hover:translate-y-[-4px] border-2 ${ticket.status === TicketStatus.LOCKED ? 'bg-slate-100/90 border-slate-300' : 'bg-white border-transparent hover:border-brand-lime/20'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${ticket.status === TicketStatus.LOCKED ? 'text-slate-400' : 'text-brand-lime'}`}>{ticket.refId}</span>
                          <span className="text-lg font-black text-slate-800 leading-tight group-hover:text-brand-slate transition-colors">{ticket.primaryName}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{ticket.company} • {ticket.department}</span>
                          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Created: {formatDate(ticket.timestamp)}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${ticket.status === TicketStatus.LOCKED ? 'bg-slate-200 text-slate-600' : 'bg-lime-50 text-brand-lime'}`}>
                          {ticket.status === TicketStatus.LOCKED && (
                             <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a4 4 0 118 0v4h-8z"></path></svg>
                          )}
                          {ticket.status}
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Work Purpose</p>
                          <p className={`text-xs font-semibold line-clamp-2 ${ticket.status === TicketStatus.LOCKED ? 'text-slate-500 italic opacity-70' : 'text-slate-600'}`}>{ticket.purpose}</p>
                        </div>
                        
                        <div className="flex justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Target Rack</p>
                            <p className={`text-xs font-black ${ticket.status === TicketStatus.LOCKED ? 'text-slate-400' : 'text-brand-blue'}`}>{ticket.rack}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Personnel</p>
                            <p className="text-xs text-slate-800 font-black">{1 + ticket.additionalStaff.length}</p>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-100">
                          <button 
                            onClick={() => setShowHistoryId(showHistoryId === ticket.id ? null : ticket.id)}
                            className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-brand-blue transition-all uppercase tracking-widest"
                          >
                            <svg className={`w-3 h-3 transition-transform duration-300 ${showHistoryId === ticket.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                            {showHistoryId === ticket.id ? 'Hide Audit Log' : 'Review Audit Log'}
                          </button>
                          {showHistoryId === ticket.id && (
                            <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar animate-slide-up">
                              {ticket.history.slice().reverse().map((log, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group/log">
                                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-lime opacity-30 group-hover/log:opacity-100 transition-opacity"></div>
                                  <span className="text-[9px] font-black text-slate-700 truncate mr-2">{log.action}</span>
                                  <span className="text-[7px] font-bold text-slate-400 whitespace-nowrap">{formatDate(log.timestamp)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                        <button onClick={() => handleEditTicket(ticket)} disabled={ticket.status === TicketStatus.LOCKED} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${ticket.status === TicketStatus.LOCKED ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-50 text-slate-500 hover:bg-brand-lime hover:text-white shadow-sm'}`}>Edit</button>
                        <button onClick={() => handleToggleLock(ticket.id)} className={`p-3 rounded-2xl transition-all shadow-sm ${ticket.status === TicketStatus.LOCKED ? 'bg-brand-blue text-white' : 'bg-slate-50 text-slate-400 hover:bg-blue-500 hover:text-white'}`} title={ticket.status === TicketStatus.LOCKED ? "Unlock Ticket" : "Lock Ticket"}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={ticket.status === TicketStatus.LOCKED ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"}></path></svg></button>
                        <button onClick={() => handleDeleteTicket(ticket.id)} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-brand-slate/20 backdrop-blur-sm z-30 transition-all"></div>}
    </div>
  );
};

export default App;