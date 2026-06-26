import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BarChart3, TrendingUp, Users, Eye, Download, Search } from 'lucide-react';

interface AnalyticsStat {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
  percent: string;
}

export default function AdminAnalytics() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('viewCount', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snap) => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats: AnalyticsStat[] = [
    { label: 'Weekly Active Users', value: 1240, trend: 'up', percent: '+12%' },
    { label: 'Avg Session Duration', value: 342, trend: 'up', percent: '+5%' },
    { label: 'Content Growth', value: 86, trend: 'neutral', percent: '0%' },
    { label: 'Bandwidth Saved', value: 12, trend: 'up', percent: '+24%' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface p-6 rounded-3xl border border-secondary shadow-xl">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h4 className="text-3xl font-bold text-white font-mono">{stat.value}</h4>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                stat.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
              }`}>
                {stat.percent}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface p-8 rounded-[2.5rem] border border-secondary shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <BarChart3 className="text-primary" />
            Top Performing Content
          </h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl border border-surface">Views</button>
            <button className="px-4 py-2 bg-background-main text-gray-500 text-xs font-bold rounded-xl border border-secondary">Downloads</button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500 font-bold animate-pulse">Analyzing Performance...</div>
          ) : resources.map((res, i) => (
            <div key={res.id} className="group bg-background-main p-4 rounded-2xl border border-secondary hover:border-primary/30 transition-all flex items-center gap-6">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-gray-500 font-mono font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{res.title}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{res.category || 'Uncategorized'}</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Views</p>
                  <div className="flex items-center gap-2 text-primary">
                    <Eye size={14} />
                    <span className="font-mono font-bold">{res.viewCount || 0}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Dls</p>
                  <div className="flex items-center gap-2 text-purple-500">
                    <Download size={14} />
                    <span className="font-mono font-bold">{res.downloadCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
