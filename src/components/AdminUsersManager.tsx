import { useState, useEffect, useMemo, FormEvent } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, orderBy, collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User as UserType, Resource } from '../types';
import { 
  Users, Eye, Download, FileText, ShieldAlert, CheckCircle2, XCircle, 
  Search, Filter, Ban, CheckCircle, Mail, Trash2, Info, AlertTriangle, UserCheck, Shield, Crown, Clock, Settings, Bookmark, Highlighter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminUsersManager() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'banned' | 'verified' | 'unverified' | 'suspicious'>('all');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [premiumModalUser, setPremiumModalUser] = useState<UserType | null>(null);
  const [banModalUser, setBanModalUser] = useState<UserType | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isUpdatingPremium, setIsUpdatingPremium] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [showCustomOptions, setShowCustomOptions] = useState(false);

  const plans = [
    '1 Hour', 
    '1 Day', '7 Days', 
    '1 Month', '3 Months', '6 Months', '1 Year',
    'Lifetime'
  ];

  const getExpiryDate = (plan: string, custom?: { days?: number, hours?: number, date?: string }) => {
    if (plan === 'Lifetime') return null;
    const now = new Date();
    
    switch (plan) {
      case '1 Hour': now.setHours(now.getHours() + 1); break;
      case '1 Day': now.setDate(now.getDate() + 1); break;
      case '7 Days': now.setDate(now.getDate() + 7); break;
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

  const handleUpdatePremium = async (uid: string, data: any) => {
    setIsUpdatingPremium(true);
    try {
      const userRef = doc(db, 'users', uid);
      const updateData = {
        ...data,
        premiumGrantedAt: serverTimestamp(),
        premiumGrantedBy: 'aasimmuneer349@gmail.com',
        premiumStatus: data.isPremium ? 'active' : data.premiumStatus || 'none'
      };
      await updateDoc(userRef, updateData);
      setPremiumModalUser(null);
      setShowCustomOptions(false);
      setCustomDays('');
      setCustomHours('');
      setCustomDate('');
    } catch (err) {
      console.error("Error updating premium:", err);
      alert("Failed to update premium: " + err);
    } finally {
      setIsUpdatingPremium(false);
    }
  };

  // Realtime listeners for users and resources
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const uList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as UserType[];
      setUsers(uList);
      setLoading(false);
    }, (err) => console.error("Users snap err:", err));

    const unsubRes = onSnapshot(collection(db, 'resources'), (snap) => {
      const rList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as Resource[];
      setResources(rList);
    }, (err) => console.error("Res snap err:", err));

    // Fetch collection group stats
    const fetchCollectionGroupStats = async () => {
      try {
        const bookmarksSnap = await getDocs(query(collectionGroup(db, 'bookmarks')));
        const notesSnap = await getDocs(query(collectionGroup(db, 'notes')));
        setTotalBookmarks(bookmarksSnap.size);
        setTotalNotes(notesSnap.size);
      } catch (err) {
        console.error("Error fetching collection group stats:", err);
      }
    };
    fetchCollectionGroupStats();

    return () => {
      unsubUsers();
      unsubRes();
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    let totalViews = 0;
    let totalDownloads = 0;
    resources.forEach(r => {
      totalViews += (r.viewCount || 0);
      totalDownloads += (r.downloadCount || 0);
    });

    const expiringToday = users.filter(u => {
      if (!u.isPremium || !u.premiumExpiry || u.premiumPlan === 'Lifetime') return false;
      const expiry = u.premiumExpiry.toDate ? u.premiumExpiry.toDate() : new Date(u.premiumExpiry);
      return expiry.toDateString() === new Date().toDateString();
    }).length;

    const expiringThisWeek = users.filter(u => {
      if (!u.isPremium || !u.premiumExpiry || u.premiumPlan === 'Lifetime') return false;
      const expiry = u.premiumExpiry.toDate ? u.premiumExpiry.toDate() : new Date(u.premiumExpiry);
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      return expiry > now && expiry <= nextWeek;
    }).length;

    const expiredToday = users.filter(u => {
      if (!u.premiumExpiry || u.isPremium) return false;
      const expiry = u.premiumExpiry.toDate ? u.premiumExpiry.toDate() : new Date(u.premiumExpiry);
      return expiry.toDateString() === new Date().toDateString();
    }).length;

    const expiredTotal = users.filter(u => u.premiumStatus === 'expired').length;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const freeUsers = users.filter(u => !u.isPremium && u.premiumStatus !== 'expired').length;
    
    const totalUsers = users.length;
    const bannedUsers = users.filter(u => u.isBanned).length;
    const unverifiedUsers = users.filter(u => !u.emailVerified).length;
    const activeUsers = totalUsers - bannedUsers;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = users.filter(u => {
      const created = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return created > sevenDaysAgo;
    }).length;

    const mostViewed = [...resources].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);
    const mostDownloaded = [...resources].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 5);
    const recentUploads = [...resources].sort((a, b) => {
      const tsA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tsB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tsB - tsA;
    }).slice(0, 5);

    return {
      totalViews,
      totalDownloads,
      totalUsers,
      totalResources: resources.length,
      activeUsers,
      bannedUsers,
      unverifiedUsers,
      recentSignups,
      mostViewed,
      mostDownloaded,
      recentUploads,
      expiringToday,
      expiringThisWeek,
      expiredToday,
      expiredTotal,
      premiumUsers,
      freeUsers
    };
  }, [users, resources]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchSearch = (u.email && u.email.toLowerCase().includes(q)) || 
                          (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                          (u.deviceFingerprint && u.deviceFingerprint.toLowerCase().includes(q));
      if (!matchSearch) return false;

      if (filter === 'active') return !u.isBanned && u.accountStatus !== 'suspicious';
      if (filter === 'banned') return u.isBanned;
      if (filter === 'verified') return u.emailVerified;
      if (filter === 'unverified') return !u.emailVerified;
      if (filter === 'suspicious') return u.accountStatus === 'suspicious';
      return true;
    });
  }, [users, searchQuery, filter]);

  // Actions
  const handleBanSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!banModalUser) return;
    try {
      await updateDoc(doc(db, 'users', banModalUser.uid), {
        isBanned: true,
        banReason: banReasonInput || 'Violation of terms',
        accountStatus: 'banned'
      });
      if (banModalUser.deviceFingerprint) {
        await setDoc(doc(db, 'bannedFingerprints', banModalUser.deviceFingerprint), {
          bannedAt: serverTimestamp(),
          email: banModalUser.email
        });
      }
      setBanModalUser(null);
      setBanReasonInput('');
    } catch (err) {
      alert("Failed to ban user: " + err);
    }
  };

  const handleUnban = async (u: UserType) => {
    if (!confirm(`Unban ${u.email}?`)) return;
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        isBanned: false,
        banReason: '',
        accountStatus: 'active'
      });
      if (u.deviceFingerprint) {
        await deleteDoc(doc(db, 'bannedFingerprints', u.deviceFingerprint));
      }
    } catch (err) {
      alert("Failed to unban: " + err);
    }
  };

  const handleForceVerification = async (u: UserType) => {
    if (!confirm(`Force email verification for ${u.email}? They will be blocked until verified.`)) return;
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        verificationRequired: true
      });
    } catch (err) {
      alert("Failed force verification: " + err);
    }
  };

  const handleResendVerEmail = async (u: UserType) => {
    alert(`Verification notice queued for ${u.email}. When they log in, they will be prompted to verify.`);
    await updateDoc(doc(db, 'users', u.uid), {
      verificationRequired: true
    });
  };

  const handleDeleteUser = async (u: UserType) => {
    if (!confirm(`Permanently delete user record for ${u.email}?`)) return;
    try {
      await deleteDoc(doc(db, 'users', u.uid));
    } catch (err) {
      alert("Failed delete: " + err);
    }
  };

  const formatDate = (val: any) => {
    if (!val) return 'N/A';
    try {
      const d = val.toDate ? val.toDate() : new Date(val);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-12">
      {/* Analytics Overview Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-3 border-b border-secondary pb-4">
          <Shield className="w-6 h-6 text-primary" />
          <span>Real-time Analytics Dashboard</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-surface p-5 rounded-xl border border-secondary shadow-lg">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Premium</span>
              <Crown className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{stats.premiumUsers}</p>
          </div>
          <div className="bg-surface p-5 rounded-xl border border-secondary shadow-lg">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Free</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{stats.freeUsers}</p>
          </div>
          <div className="bg-surface p-5 rounded-xl border border-secondary shadow-lg">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Today</span>
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-500 mt-1 font-mono">{stats.expiringToday}</p>
          </div>
          <div className="bg-surface p-5 rounded-xl border border-secondary shadow-lg">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <span>This Week</span>
              <AlertTriangle className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-500 mt-1 font-mono">{stats.expiringThisWeek}</p>
          </div>
          <div className="bg-surface p-5 rounded-xl border border-secondary shadow-lg">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Expired (Today)</span>
              <Trash2 className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500 mt-1 font-mono">{stats.expiredToday}</p>
          </div>
          <div className="bg-surface p-5 rounded-xl border border-secondary shadow-lg">
            <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              <span>Expired (Total)</span>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500 mt-1 font-mono">{stats.expiredTotal}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface p-5 rounded-xl border border-secondary">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
              <span>Total Views</span>
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{stats.totalViews}</p>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-secondary">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
              <span>Total Downloads</span>
              <Download className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{stats.totalDownloads}</p>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-secondary">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{stats.totalUsers}</p>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-secondary">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
              <span>Total Resources</span>
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{stats.totalResources}</p>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-secondary">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
              <span>Total Bookmarks</span>
              <Bookmark className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{totalBookmarks}</p>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-secondary">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
              <span>Total Notes</span>
              <Highlighter className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{totalNotes}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background-main p-4 rounded-xl border border-secondary">
            <span className="text-xs text-gray-400 block font-medium">Active Users</span>
            <span className="text-xl font-bold text-green-400 font-mono mt-1 block">{stats.activeUsers}</span>
          </div>
          <div className="bg-background-main p-4 rounded-xl border border-secondary">
            <span className="text-xs text-gray-400 block font-medium">Banned Users</span>
            <span className="text-xl font-bold text-red-400 font-mono mt-1 block">{stats.bannedUsers}</span>
          </div>
          <div className="bg-background-main p-4 rounded-xl border border-secondary">
            <span className="text-xs text-gray-400 block font-medium">Unverified Users</span>
            <span className="text-xl font-bold text-yellow-400 font-mono mt-1 block">{stats.unverifiedUsers}</span>
          </div>
          <div className="bg-background-main p-4 rounded-xl border border-secondary">
            <span className="text-xs text-gray-400 block font-medium">Recent Signups (7d)</span>
            <span className="text-xl font-bold text-primary font-mono mt-1 block">{stats.recentSignups}</span>
          </div>
        </div>

        {/* Top Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-surface p-5 rounded-xl border border-secondary space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Most Viewed Resources
            </h3>
            <div className="space-y-2">
              {stats.mostViewed.map(r => (
                <div key={r.id} className="flex justify-between items-center text-xs bg-background-main p-2.5 rounded-lg border border-secondary/50">
                  <span className="text-gray-200 truncate pr-2 font-medium">{r.title}</span>
                  <span className="font-mono text-primary font-bold shrink-0">{r.viewCount || 0} views</span>
                </div>
              ))}
              {stats.mostViewed.length === 0 && <p className="text-xs text-gray-500">No data</p>}
            </div>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-secondary space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" /> Most Downloaded
            </h3>
            <div className="space-y-2">
              {stats.mostDownloaded.map(r => (
                <div key={r.id} className="flex justify-between items-center text-xs bg-background-main p-2.5 rounded-lg border border-secondary/50">
                  <span className="text-gray-200 truncate pr-2 font-medium">{r.title}</span>
                  <span className="font-mono text-primary font-bold shrink-0">{r.downloadCount || 0} dl</span>
                </div>
              ))}
              {stats.mostDownloaded.length === 0 && <p className="text-xs text-gray-500">No data</p>}
            </div>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-secondary space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Recent Uploads
            </h3>
            <div className="space-y-2">
              {stats.recentUploads.map(r => (
                <div key={r.id} className="flex justify-between items-center text-xs bg-background-main p-2.5 rounded-lg border border-secondary/50">
                  <span className="text-gray-200 truncate pr-2 font-medium">{r.title}</span>
                  <span className="text-gray-400 shrink-0">{r.classLevel}</span>
                </div>
              ))}
              {stats.recentUploads.length === 0 && <p className="text-xs text-gray-500">No data</p>}
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-secondary pb-4">
          <div>
            <h2 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <span>User Management Database</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">Review accounts, inspect device fingerprints, and enforce anti-abuse policies.</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search email, name, fp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-secondary rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-primary placeholder-gray-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>
          {(['all', 'active', 'banned', 'verified', 'unverified', 'suspicious'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f 
                  ? 'bg-primary text-secondary shadow-md' 
                  : 'bg-surface text-gray-400 hover:text-white border border-secondary'
              }`}
            >
              {f === 'suspicious' && <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-400" />}
              {f}
            </button>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-surface rounded-2xl border border-secondary overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background-main border-b border-secondary text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Premium</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Tracking</th>
                  <th className="p-4">Device</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/60">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No users match your criteria.</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-white">{u.displayName || 'Student'}</div>
                          {u.isPremium && (
                            <span className="p-1 bg-yellow-500/20 text-yellow-500 rounded-md border border-yellow-500/30" title="Premium User">
                              <Crown size={12} />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-4">
                        {u.isPremium ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase">
                              <Crown size={10} /> Active
                            </span>
                            <span className="text-[10px] text-gray-500 mt-0.5 font-mono">{u.premiumPlan}</span>
                            {u.premiumExpiry && (
                              <span className="text-[8px] text-gray-600 mt-0.5 uppercase">Exp: {formatDate(u.premiumExpiry)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{u.premiumStatus === 'expired' ? '🔴 Expired' : '⚪ Free'}</span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.isPremium ? (
                          <span className="text-[10px] font-bold text-primary font-mono">
                            {(() => {
                              if (u.premiumPlan === 'Lifetime') return 'Infinity';
                              if (!u.premiumExpiry) return 'N/A';
                              const expiry = u.premiumExpiry.toDate ? u.premiumExpiry.toDate() : new Date(u.premiumExpiry);
                              const diff = expiry.getTime() - Date.now();
                              if (diff <= 0) return 'Expired';
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                              
                              if (days > 0) return `${days}d ${hours}h`;
                              if (hours > 0) return `${hours}h ${minutes}m`;
                              return `${minutes}m`;
                            })()}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-[10px] font-mono">---</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          u.role === 'admin' || u.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-secondary text-gray-300'
                        }`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                            <Ban className="w-3 h-3" /> Banned
                          </span>
                        ) : u.accountStatus === 'suspicious' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Suspicious
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.emailVerified ? (
                          <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : u.verificationRequired ? (
                          <span className="text-yellow-400 text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Forced / Pending
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Unverified (Opt)</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-400 space-y-0.5">
                        <div><span className="text-gray-500">Joined:</span> {formatDate(u.createdAt)}</div>
                        <div><span className="text-gray-500">Login:</span> {formatDate(u.lastLogin)}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-400">
                        {u.deviceFingerprint ? (
                          <span className="bg-background-main px-2 py-1 rounded border border-secondary/80 block w-max max-w-[120px] truncate" title={u.deviceFingerprint}>
                            {u.deviceFingerprint}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="View User Details"
                          className="p-1.5 bg-background-main hover:bg-secondary text-gray-300 rounded-lg transition-colors border border-secondary inline-block"
                        >
                          <Info className="w-4 h-4" />
                        </button>

                        {u.isBanned ? (
                          <button
                            onClick={() => handleUnban(u)}
                            title="Unban User"
                            className="px-2.5 py-1 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white font-bold rounded-lg text-xs transition-all border border-green-500/40 inline-block"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => setBanModalUser(u)}
                            title="Ban User"
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold rounded-lg text-xs transition-all border border-red-500/40 inline-block"
                          >
                            Ban
                          </button>
                        )}

                        {!u.emailVerified && !u.verificationRequired && (
                          <button
                            onClick={() => handleForceVerification(u)}
                            title="Force Verification"
                            className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-black font-bold rounded-lg text-xs transition-all border border-yellow-500/40 inline-block"
                          >
                            Force Ver.
                          </button>
                        )}

                        <button
                          onClick={() => handleResendVerEmail(u)}
                          title="Resend Verification Email"
                          className="p-1.5 bg-background-main hover:bg-secondary text-primary rounded-lg transition-colors border border-secondary inline-block"
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setPremiumModalUser(u)}
                          title="Manage Premium Access"
                          className={`p-1.5 ${u.isPremium ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'} hover:opacity-80 rounded-lg transition-colors border inline-block`}
                        >
                          <Crown className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User Record"
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/30 inline-block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Premium Management Modal */}
      <AnimatePresence>
        {premiumModalUser && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-secondary p-8 rounded-[2rem] max-w-4xl w-full shadow-2xl relative max-h-[95vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setPremiumModalUser(null);
                  setShowCustomOptions(false);
                }}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <XCircle size={28} />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-start mb-10 border-b border-secondary pb-8">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shrink-0 shadow-xl">
                  <Crown size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Premium Access Control</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={14} />
                      <span className="font-mono">{premiumModalUser.email}</span>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      premiumModalUser.isPremium 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {premiumModalUser.isPremium ? '🟢 Premium' : '⚪ Free'}
                    </span>
                    {premiumModalUser.premiumPlan && (
                      <span className="px-2 py-0.5 bg-secondary text-gray-300 border border-surface rounded text-[10px] font-bold uppercase">
                        {premiumModalUser.premiumPlan}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      Duration Presets
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {plans.map((plan) => (
                        <button
                          key={plan}
                          onClick={() => {
                            const expiry = getExpiryDate(plan);
                            handleUpdatePremium(premiumModalUser.uid, {
                              isPremium: true,
                              premiumPlan: plan,
                              premiumExpiry: expiry ? expiry : null,
                              premiumStart: serverTimestamp()
                            });
                          }}
                          disabled={isUpdatingPremium}
                          className="p-3 bg-secondary border border-surface rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-[10px] font-bold text-white text-center disabled:opacity-50"
                        >
                          {plan}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowCustomOptions(!showCustomOptions)}
                      className="w-full py-3 bg-primary text-secondary rounded-xl text-xs font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      <Settings size={16} />
                      {showCustomOptions ? 'Hide Custom' : 'Custom Duration'}
                    </button>

                    <AnimatePresence>
                      {showCustomOptions && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 overflow-hidden bg-secondary/50 p-4 rounded-xl border border-secondary"
                        >
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              placeholder="Days"
                              value={customDays}
                              onChange={(e) => setCustomDays(e.target.value)}
                              className="flex-1 bg-background-main border border-secondary rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-xs"
                            />
                            <input 
                              type="number" 
                              placeholder="Hours"
                              value={customHours}
                              onChange={(e) => setCustomHours(e.target.value)}
                              className="flex-1 bg-background-main border border-secondary rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-xs"
                            />
                            <button 
                              onClick={() => {
                                const expiry = getExpiryDate('Custom', { 
                                  days: customDays ? Number(customDays) : 0, 
                                  hours: customHours ? Number(customHours) : 0 
                                });
                                handleUpdatePremium(premiumModalUser.uid, {
                                  isPremium: true,
                                  premiumPlan: `${customDays || 0}D ${customHours || 0}H`,
                                  premiumExpiry: expiry,
                                  premiumStart: serverTimestamp()
                                });
                              }}
                              disabled={(!customDays && !customHours) || isUpdatingPremium}
                              className="bg-primary text-secondary px-4 rounded-lg font-bold text-[10px]"
                            >
                              Apply
                            </button>
                          </div>
                          
                          <div className="pt-2 border-t border-secondary/50 flex gap-2">
                            <input 
                              type="date" 
                              value={customDate}
                              onChange={(e) => setCustomDate(e.target.value)}
                              className="flex-1 bg-background-main border border-secondary rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-xs"
                            />
                            <button 
                              onClick={() => {
                                const expiry = getExpiryDate('Custom', { date: customDate });
                                handleUpdatePremium(premiumModalUser.uid, {
                                  isPremium: true,
                                  premiumPlan: `Custom Date`,
                                  premiumExpiry: expiry,
                                  premiumStart: serverTimestamp()
                                });
                              }}
                              disabled={!customDate || isUpdatingPremium}
                              className="bg-primary text-secondary px-4 rounded-lg font-bold text-[10px]"
                            >
                              Apply
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => {
                        handleUpdatePremium(premiumModalUser.uid, {
                          isPremium: true,
                          premiumPlan: 'Lifetime',
                          premiumExpiry: null,
                          premiumStart: serverTimestamp()
                        });
                      }}
                      className="py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold rounded-xl hover:bg-yellow-500 hover:text-secondary transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Crown size={16} />
                      Grant Lifetime Access
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm("Remove all premium privileges?")) return;
                        handleUpdatePremium(premiumModalUser.uid, {
                          isPremium: false,
                          premiumPlan: '',
                          premiumExpiry: null,
                          premiumStatus: 'expired'
                        });
                      }}
                      className="py-3 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Remove Premium Access
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ban Reason Modal */}
      <AnimatePresence>
        {banModalUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-red-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400 border-b border-secondary pb-3">
                <Ban className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Ban User: {banModalUser.email}</h3>
              </div>
              
              <form onSubmit={handleBanSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase block">Ban Reason (Shown to user)</label>
                  <textarea 
                    rows={3}
                    required
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    placeholder="e.g. Abusive behavior, suspicious downloading..."
                    className="w-full bg-background-main border border-secondary rounded-xl p-3 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setBanModalUser(null); setBanReasonInput(''); }}
                    className="px-4 py-2 bg-secondary text-gray-300 font-bold rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-500/20"
                  >
                    Confirm Ban
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-secondary rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-secondary pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" /> User Record Details
                </h3>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white font-bold text-lg">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm font-mono bg-background-main p-4 rounded-xl border border-secondary">
                <div><span className="text-gray-500 block text-xs">UID:</span> <span className="text-white truncate block">{selectedUser.uid}</span></div>
                <div><span className="text-gray-500 block text-xs">Role:</span> <span className="text-primary font-bold">{selectedUser.role}</span></div>
                <div><span className="text-gray-500 block text-xs">Email:</span> <span className="text-white">{selectedUser.email}</span></div>
                <div><span className="text-gray-500 block text-xs">Name:</span> <span className="text-white">{selectedUser.displayName}</span></div>
                <div><span className="text-gray-500 block text-xs">Status:</span> <span className="text-white">{selectedUser.accountStatus || (selectedUser.isBanned ? 'banned' : 'active')}</span></div>
                <div><span className="text-gray-500 block text-xs">Verified:</span> <span className="text-white">{selectedUser.emailVerified ? 'Yes' : 'No'}</span></div>
                <div className="col-span-2"><span className="text-gray-500 block text-xs">Fingerprint:</span> <span className="text-yellow-400">{selectedUser.deviceFingerprint || 'N/A'}</span></div>
                <div><span className="text-gray-500 block text-xs">Joined:</span> <span className="text-gray-300">{formatDate(selectedUser.createdAt)}</span></div>
                <div><span className="text-gray-500 block text-xs">Last Login:</span> <span className="text-gray-300">{formatDate(selectedUser.lastLogin)}</span></div>
                {selectedUser.banReason && (
                  <div className="col-span-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                    <span className="font-bold">Ban Reason:</span> {selectedUser.banReason}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={() => setSelectedUser(null)} className="px-6 py-2 bg-primary text-secondary font-bold rounded-xl text-sm">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
