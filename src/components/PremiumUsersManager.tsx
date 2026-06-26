import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, query, updateDoc, doc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { User } from '../types';
import { Crown, User as UserIcon, MoreHorizontal, Search, XCircle, Clock, Trash2, Settings, Users, AlertCircle, Filter, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PremiumUsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium' | 'free' | 'expiring' | 'expired'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [showCustomOptions, setShowCustomOptions] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const premium = users.filter(u => u.isPremium).length;
    const free = users.filter(u => !u.isPremium && u.premiumStatus !== 'expired').length;
    const expired = users.filter(u => u.premiumStatus === 'expired').length;
    const expiringToday = users.filter(u => {
      if (!u.isPremium || !u.premiumExpiry || u.premiumPlan === 'Lifetime') return false;
      const expiry = u.premiumExpiry.toDate();
      return expiry.toDateString() === now.toDateString();
    }).length;

    return { premium, free, expired, expiringToday };
  }, [users]);

  const handleUpdatePremium = async (uid: string, data: any) => {
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', uid);
      const updateData = {
        ...data,
        premiumGrantedAt: serverTimestamp(),
        premiumGrantedBy: 'aasimmuneer349@gmail.com',
        premiumStatus: data.isPremium ? 'active' : data.premiumStatus || 'none'
      };
      await updateDoc(userRef, updateData);
      setSelectedUser(null);
      setShowCustomOptions(false);
      setCustomDays('');
      setCustomHours('');
      setCustomDate('');
    } catch (err) {
      console.error("Error updating premium:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getExpiryDate = (plan: string, custom?: { days?: number, hours?: number, date?: string }) => {
    if (plan === 'Lifetime') return null;
    const now = new Date();
    
    switch (plan) {
      case '1 Hour': now.setHours(now.getHours() + 1); break;
      case '6 Hours': now.setHours(now.getHours() + 6); break;
      case '12 Hours': now.setHours(now.getHours() + 12); break;
      case '1 Day': now.setDate(now.getDate() + 1); break;
      case '3 Days': now.setDate(now.getDate() + 3); break;
      case '7 Days': now.setDate(now.getDate() + 7); break;
      case '15 Days': now.setDate(now.getDate() + 15); break;
      case '1 Month': now.setMonth(now.getMonth() + 1); break;
      case '3 Months': now.setMonth(now.getMonth() + 3); break;
      case '6 Months': now.setMonth(now.getMonth() + 6); break;
      case '1 Year': now.setFullYear(now.getFullYear() + 1); break;
      case 'Custom': 
        if (custom?.date) return new Date(custom.date);
        if (custom?.days) now.setDate(now.getDate() + custom.days);
        if (custom?.hours) now.setHours(now.getHours() + custom.hours);
        break;
    }
    return now;
  };

  const getStatusBadge = (user: User) => {
    if (!user.isPremium && user.premiumStatus !== 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-border text-gray-500 border border-secondary rounded-full text-[10px] font-bold uppercase tracking-wider">
          ⚪ Free
        </span>
      );
    }

    const now = new Date();
    const expiry = user.premiumExpiry?.toDate();

    if (user.premiumPlan === 'Lifetime') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
          🟢 Premium
        </span>
      );
    }

    if (expiry && now >= expiry) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
          🔴 Expired
        </span>
      );
    }

    const isExpiringSoon = expiry && (expiry.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
    if (isExpiringSoon) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
          🟡 Expiring Soon
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
        🟢 Premium
      </span>
    );
  };

  const getTimeRemaining = (expiry: any) => {
    if (!expiry) return null;
    const diff = expiry.toDate().getTime() - Date.now();
    if (diff <= 0) return <span className="text-red-500 font-bold">Expired</span>;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} Days ${hours} Hours`;
    return `${hours} Hours`;
  };

  const plans = [
    '1 Hour', '6 Hours', '12 Hours',
    '1 Day', '3 Days', '7 Days', '15 Days',
    '1 Month', '3 Months', '6 Months', '1 Year',
    'Lifetime'
  ];

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'premium') return u.isPremium;
    if (filter === 'free') return !u.isPremium && u.premiumStatus !== 'expired';
    if (filter === 'expired') return u.premiumStatus === 'expired';
    if (filter === 'expiring') {
      if (!u.isPremium || !u.premiumExpiry || u.premiumPlan === 'Lifetime') return false;
      const diff = u.premiumExpiry.toDate().getTime() - Date.now();
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-6 rounded-2xl border border-secondary shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Premium</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white font-mono">{stats.premium}</p>
            <div className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20"><Crown size={20} /></div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-secondary shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Free</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white font-mono">{stats.free}</p>
            <div className="p-2 bg-gray-500/10 text-gray-500 rounded-lg border border-gray-500/20"><Users size={20} /></div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-secondary shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Expiring Today</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-yellow-500 font-mono">{stats.expiringToday}</p>
            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20"><AlertCircle size={20} /></div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-secondary shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Expired Premium</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-red-500 font-mono">{stats.expired}</p>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20"><Trash2 size={20} /></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Crown className="text-primary" />
            Premium Manager
          </h2>
          <p className="text-gray-400 text-sm">Real-time access and duration management</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search email, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-secondary border border-surface rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-primary transition-all w-full sm:w-64"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-secondary border border-surface rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="premium">Premium</option>
              <option value="free">Free Users</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-secondary overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-secondary">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Profile</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User Details</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Account</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Current Plan</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Granted Date</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Expiry Date</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Remaining</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="animate-spin text-primary" />
                      <span>Loading database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="opacity-20" size={40} />
                      <span>No users found matching filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-secondary/20 transition-colors group">
                    <td className="p-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center text-primary font-bold uppercase shadow-inner">
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{user.displayName || 'Anonymous'}</span>
                        <span className="text-[11px] text-gray-500 font-mono">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        user.isBanned 
                          ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                          : 'bg-green-500/10 text-green-500 border-green-500/20'
                      }`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="p-4">
                      <span className="text-text-main text-sm font-medium">{user.premiumPlan || '-'}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-400 font-mono">
                      {user.premiumGrantedAt?.toDate().toLocaleDateString() || '-'}
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm font-mono">
                        {user.premiumPlan === 'Lifetime' ? 'Never' : user.premiumExpiry?.toDate().toLocaleDateString() || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono font-bold">
                        {getTimeRemaining(user.premiumExpiry)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-secondary rounded-lg transition-all"
                          title="Manage Access"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                      <div className="group-hover:hidden text-gray-600">
                        <MoreHorizontal size={16} className="ml-auto" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Management Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-secondary p-8 rounded-[2rem] max-w-4xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative max-h-[95vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setShowCustomOptions(false);
                }}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <XCircle size={28} />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-start mb-10 border-b border-secondary pb-8">
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center border border-primary/20 shrink-0 shadow-xl">
                  <Crown size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-white uppercase tracking-tight">Access Management</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <UserIcon size={16} />
                      <span className="font-bold">{selectedUser.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={16} />
                      <span className="font-mono">{selectedUser.email}</span>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    {getStatusBadge(selectedUser)}
                    {selectedUser.premiumPlan && (
                      <span className="px-2.5 py-1 bg-secondary text-gray-300 border border-surface rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Plan: {selectedUser.premiumPlan}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Duration Presets */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      Select Standard Duration
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {plans.map((plan) => (
                        <button
                          key={plan}
                          onClick={() => {
                            const expiry = getExpiryDate(plan);
                            handleUpdatePremium(selectedUser.uid, {
                              isPremium: true,
                              premiumPlan: plan,
                              premiumExpiry: expiry ? expiry : null,
                              premiumStart: serverTimestamp()
                            });
                          }}
                          disabled={isUpdating}
                          className="p-4 bg-secondary border border-surface rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-xs font-bold text-white text-center shadow-lg active:scale-95 disabled:opacity-50"
                        >
                          {plan}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Options & Immediate Actions */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowCustomOptions(!showCustomOptions)}
                      className="w-full py-4 bg-primary text-secondary rounded-2xl text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Settings size={20} />
                      {showCustomOptions ? 'Hide Custom Duration' : 'Configure Custom Duration'}
                    </button>

                    <AnimatePresence>
                      {showCustomOptions && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-6 overflow-hidden bg-secondary/50 p-6 rounded-[1.5rem] border border-secondary shadow-inner"
                        >
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block px-1 mb-2">Duration (Days & Hours)</label>
                              <div className="flex gap-2">
                                <div className="flex-1 space-y-1">
                                  <input 
                                    type="number" 
                                    placeholder="Days"
                                    value={customDays}
                                    onChange={(e) => setCustomDays(e.target.value)}
                                    className="w-full bg-background-main border border-secondary rounded-xl px-4 py-3 text-white outline-none focus:border-primary text-sm shadow-inner"
                                  />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <input 
                                    type="number" 
                                    placeholder="Hours"
                                    value={customHours}
                                    onChange={(e) => setCustomHours(e.target.value)}
                                    className="w-full bg-background-main border border-secondary rounded-xl px-4 py-3 text-white outline-none focus:border-primary text-sm shadow-inner"
                                  />
                                </div>
                                <button 
                                  onClick={() => {
                                    const expiry = getExpiryDate('Custom', { 
                                      days: customDays ? Number(customDays) : 0, 
                                      hours: customHours ? Number(customHours) : 0 
                                    });
                                    handleUpdatePremium(selectedUser.uid, {
                                      isPremium: true,
                                      premiumPlan: `${customDays || 0}D ${customHours || 0}H`,
                                      premiumExpiry: expiry,
                                      premiumStart: serverTimestamp()
                                    });
                                  }}
                                  disabled={(!customDays && !customHours) || isUpdating}
                                  className="bg-primary text-secondary px-6 rounded-xl font-bold text-xs shadow-lg"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-secondary/50">
                              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block px-1 mb-2">Manual Expiry Date</label>
                              <div className="flex gap-2">
                                <input 
                                  type="date" 
                                  value={customDate}
                                  onChange={(e) => setCustomDate(e.target.value)}
                                  className="flex-1 bg-background-main border border-secondary rounded-xl px-4 py-3 text-white outline-none focus:border-primary text-sm shadow-inner"
                                />
                                <button 
                                  onClick={() => {
                                    const expiry = getExpiryDate('Custom', { date: customDate });
                                    handleUpdatePremium(selectedUser.uid, {
                                      isPremium: true,
                                      premiumPlan: `Custom Date`,
                                      premiumExpiry: expiry,
                                      premiumStart: serverTimestamp()
                                    });
                                  }}
                                  disabled={!customDate || isUpdating}
                                  className="bg-primary text-secondary px-6 rounded-xl font-bold text-xs shadow-lg"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-500" />
                      Immediate Admin Actions
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const expiry = getExpiryDate('Lifetime');
                          handleUpdatePremium(selectedUser.uid, {
                            isPremium: true,
                            premiumPlan: 'Lifetime',
                            premiumExpiry: null,
                            premiumStart: serverTimestamp()
                          });
                        }}
                        className="py-4 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold rounded-2xl hover:bg-yellow-500 hover:text-secondary transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Crown size={16} />
                        Lifetime Access
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Are you sure you want to revoke all premium privileges immediately?")) return;
                          handleUpdatePremium(selectedUser.uid, {
                            isPremium: false,
                            premiumPlan: '',
                            premiumExpiry: null,
                            premiumStart: null,
                            premiumStatus: 'none'
                          });
                        }}
                        className="py-4 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Trash2 size={16} />
                        Remove Access
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-secondary flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex gap-8">
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                    {getStatusBadge(selectedUser)}
                  </div>
                  {selectedUser.premiumExpiry && (
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Remaining Time</p>
                      <p className="text-white font-mono font-bold text-sm">{getTimeRemaining(selectedUser.premiumExpiry)}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full sm:w-auto px-12 py-3 bg-secondary text-text-main font-bold rounded-2xl border border-surface hover:bg-surface transition-all text-sm shadow-xl active:scale-95"
                >
                  Close Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
