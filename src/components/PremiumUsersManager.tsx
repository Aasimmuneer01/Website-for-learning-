import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { User } from '../types';
import { Crown, Mail, User as UserIcon, Calendar, ShieldCheck, MoreVertical, Search, CheckCircle, XCircle, Clock, Trash2, Edit2, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PremiumUsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [showCustomOptions, setShowCustomOptions] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePremium = async (uid: string, data: any) => {
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', uid);
      const updateData = {
        ...data,
        premiumGrantedAt: serverTimestamp(),
        premiumGrantedBy: 'aasimmuneer349@gmail.com', // Admin email as per request
        premiumStatus: data.isPremium ? 'active' : 'none'
      };
      await updateDoc(userRef, updateData);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...data, premiumStatus: updateData.premiumStatus } : u));
      setSelectedUser(null);
      setShowCustomOptions(false);
    } catch (err) {
      console.error("Error updating premium:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getExpiryDate = (plan: string, customValue?: number | string) => {
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
      case 'Custom Days': 
        if (customValue) now.setDate(now.getDate() + Number(customValue));
        break;
      case 'Custom Date':
        return customValue ? new Date(customValue as string) : null;
    }
    return now;
  };

  const getStatusBadge = (user: User) => {
    if (!user.isPremium && user.premiumStatus !== 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-border text-gray-500 border border-secondary rounded-full text-[10px] font-bold uppercase tracking-wider">
          ⚪ Free User
        </span>
      );
    }

    const now = new Date();
    const expiry = user.premiumExpiry?.toDate();

    if (user.premiumPlan === 'Lifetime') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
          🟢 Premium (Lifetime)
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

    const isToday = expiry && expiry.toDateString() === now.toDateString();
    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
          🟡 Expires Today
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
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    
    if (days > 1) return `Expires in ${days} days`;
    if (hours > 0) return `Expires in ${hours} hours`;
    return 'Expired';
  };

  const plans = [
    '1 Hour', '6 Hours', '12 Hours',
    '1 Day', '3 Days', '7 Days', '15 Days',
    '1 Month', '3 Months', '6 Months', '1 Year',
    'Lifetime'
  ];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ? true : filter === 'premium' ? u.isPremium : !u.isPremium;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Crown className="text-primary w-7 h-7" />
          Premium Management
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-secondary rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-surface border border-secondary rounded-xl py-2 px-4 text-sm text-white focus:border-primary outline-none transition-all"
          >
            <option value="all">All Users</option>
            <option value="premium">Premium Only</option>
            <option value="free">Free Users</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/50 border-b border-secondary">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Granted At</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Expiry</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{user.displayName}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="p-4">
                      <span className="text-text-main text-sm font-medium">{user.premiumPlan || 'None'}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {user.premiumGrantedAt?.toDate().toLocaleString() || '-'}
                    </td>
                    <td className="p-4">
                      {user.isPremium || user.premiumStatus === 'expired' ? (
                        <div className="flex flex-col">
                          <span className="text-white text-sm">
                            {user.premiumPlan === 'Lifetime' ? 'Never' : user.premiumExpiry?.toDate().toLocaleDateString() || 'N/A'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {getTimeRemaining(user.premiumExpiry)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-secondary p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setShowCustomOptions(false);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>

              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
                  <Crown size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Premium Manager</h3>
                  <p className="text-gray-400 text-sm">Managing {selectedUser.displayName}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-3">Preset Durations</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
                        className="p-3 bg-secondary border border-surface rounded-xl hover:border-primary transition-all text-xs font-bold text-white text-center"
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-secondary">
                  <button 
                    onClick={() => setShowCustomOptions(!showCustomOptions)}
                    className="w-full py-3 bg-surface border border-secondary rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-all mb-4"
                  >
                    {showCustomOptions ? 'Hide Custom Options' : 'Custom Expiry Options'}
                  </button>

                  <AnimatePresence>
                    {showCustomOptions && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-bold uppercase px-1">Manually Enter Days</label>
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                placeholder="Days"
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                                className="flex-1 bg-background-main border border-secondary rounded-xl px-4 py-2 text-white outline-none focus:border-primary"
                              />
                              <button 
                                onClick={() => {
                                  const expiry = getExpiryDate('Custom Days', customDays);
                                  handleUpdatePremium(selectedUser.uid, {
                                    isPremium: true,
                                    premiumPlan: `${customDays} Days`,
                                    premiumExpiry: expiry,
                                    premiumStart: serverTimestamp()
                                  });
                                }}
                                disabled={!customDays || isUpdating}
                                className="bg-primary text-secondary px-4 rounded-xl font-bold text-xs"
                              >
                                Set
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-gray-500 font-bold uppercase px-1">Pick a Date</label>
                            <div className="flex gap-2">
                              <input 
                                type="date" 
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="flex-1 bg-background-main border border-secondary rounded-xl px-4 py-2 text-white outline-none focus:border-primary"
                              />
                              <button 
                                onClick={() => {
                                  const expiry = getExpiryDate('Custom Date', customDate);
                                  handleUpdatePremium(selectedUser.uid, {
                                    isPremium: true,
                                    premiumPlan: `Custom Date`,
                                    premiumExpiry: expiry,
                                    premiumStart: serverTimestamp()
                                  });
                                }}
                                disabled={!customDate || isUpdating}
                                className="bg-primary text-secondary px-4 rounded-xl font-bold text-xs"
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-4 border-t border-secondary flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      handleUpdatePremium(selectedUser.uid, {
                        isPremium: false,
                        premiumPlan: '',
                        premiumExpiry: null,
                        premiumStart: null,
                        premiumStatus: 'none'
                      });
                    }}
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Remove Premium
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-3 bg-secondary text-text-main font-bold rounded-2xl border border-surface transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
