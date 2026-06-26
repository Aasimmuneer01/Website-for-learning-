import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Resource } from '../types';
import { 
  Users, Eye, Download, FileText, Crown, Clock, Trash2, 
  TrendingUp, TrendingDown, Activity, Bookmark, Highlighter 
} from 'lucide-react';

export default function AdminDashboardStats() {
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })) as User[]);
      setLoading(false);
    });

    const unsubRes = onSnapshot(collection(db, 'resources'), (snap) => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Resource[]);
    });

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

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    let totalViews = 0;
    let totalDownloads = 0;
    resources.forEach(r => {
      totalViews += (r.viewCount || 0);
      totalDownloads += (r.downloadCount || 0);
    });

    const premium = users.filter(u => u.isPremium).length;
    const banned = users.filter(u => u.isBanned).length;
    const unverified = users.filter(u => !u.emailVerified).length;
    
    const expiringToday = users.filter(u => {
      if (!u.isPremium || !u.premiumExpiry || u.premiumPlan === 'Lifetime') return false;
      return u.premiumExpiry.toDate().toDateString() === todayStr;
    }).length;

    const expiredToday = users.filter(u => {
      if (!u.premiumExpiry || u.isPremium) return false;
      return u.premiumExpiry.toDate().toDateString() === todayStr;
    }).length;

    return {
      totalUsers: users.length,
      totalResources: resources.length,
      totalViews,
      totalDownloads,
      premium,
      banned,
      unverified,
      expiringToday,
      expiredToday
    };
  }, [users, resources]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold animate-pulse uppercase tracking-widest">Gathering System Intel...</div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Premium Accounts', value: stats.premium, icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Platform Content', value: stats.totalResources, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Expiring Today', value: stats.expiringToday, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Expired Today', value: stats.expiredToday, icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Bookmarks', value: totalBookmarks, icon: Bookmark, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Notes Created', value: totalNotes, icon: Highlighter, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-surface p-6 rounded-3xl border border-secondary shadow-xl hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.bg} ${card.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              <Activity className="text-gray-700 w-4 h-4" />
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{card.label}</p>
            <p className="text-4xl font-bold text-white mt-1 font-mono">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface p-8 rounded-[2.5rem] border border-secondary shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight flex items-center gap-3">
            <TrendingUp className="text-green-500" />
            Platform Activity
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background-main rounded-2xl border border-secondary">
              <span className="text-gray-400 font-bold text-sm">Download Velocity</span>
              <span className="text-white font-mono font-bold">{stats.totalDownloads}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-main rounded-2xl border border-secondary">
              <span className="text-gray-400 font-bold text-sm">Engagement Rate</span>
              <span className="text-white font-mono font-bold">{(stats.totalViews / (stats.totalUsers || 1)).toFixed(2)} / User</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-main rounded-2xl border border-secondary">
              <span className="text-gray-400 font-bold text-sm">Conversion Rate</span>
              <span className="text-white font-mono font-bold">{(stats.premium / (stats.totalUsers || 1) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-[2.5rem] border border-secondary shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight flex items-center gap-3">
            <TrendingDown className="text-red-500" />
            Security & Compliance
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background-main rounded-2xl border border-secondary">
              <span className="text-gray-400 font-bold text-sm">Banned Accounts</span>
              <span className="text-red-400 font-mono font-bold">{stats.banned}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-main rounded-2xl border border-secondary">
              <span className="text-gray-400 font-bold text-sm">Unverified Emails</span>
              <span className="text-yellow-400 font-mono font-bold">{stats.unverified}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-main rounded-2xl border border-secondary">
              <span className="text-gray-400 font-bold text-sm">Verification Rate</span>
              <span className="text-green-400 font-mono font-bold">{((stats.totalUsers - stats.unverified) / (stats.totalUsers || 1) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
