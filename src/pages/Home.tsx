import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Download, User as UserIcon, MonitorPlay, Clock, Bookmark, Layers, CheckCircle2, History, Crown } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { ReadingHistory, User } from '../types';
import CreatorSection from '../components/CreatorSection';

export default function Home() {
  const { user, userData } = useAuth();
  const [showSubjects, setShowSubjects] = useState(false);
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [stats, setStats] = useState({
    resourcesRead: 0,
    pagesRead: 0,
    bookmarks: 0,
    studyTime: 0
  });
  const [homepageSettings, setHomepageSettings] = useState({
    title: 'Educational\nResources',
    subtitle: 'Discover and share premium study materials, notes, previous year papers, and assignments designed to help you excel.',
    bgImage: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800&auto=format&fit=crop'
  });

  useEffect(() => {
    const fetchHomepageSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'homepage');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHomepageSettings({
            title: data.title || 'Educational\nResources',
            subtitle: data.subtitle || 'Discover and share premium study materials, notes, previous year papers, and assignments designed to help you excel.',
            bgImage: data.bgImage || data.heroImage || 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800&auto=format&fit=crop'
          });
        }
      } catch (err) {
        console.warn("Could not fetch homepage settings:", err);
      }
    };

    const fetchPremiumData = async () => {
      if (!user) return;
      try {
        // Fetch History
        const historyQuery = query(
          collection(db, 'users', user.uid, 'history'),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );
        const historySnap = await getDocs(historyQuery);
        const historyList = historySnap.docs.map(doc => doc.data() as ReadingHistory);
        setHistory(historyList);

        // Fetch Stats
        const bookmarksSnap = await getDocs(collection(db, 'users', user.uid, 'bookmarks'));
        const resourcesRead = historySnap.size;
        let pagesRead = 0;
        historySnap.docs.forEach(doc => pagesRead += doc.data().lastPage || 0);

        setStats({
          resourcesRead,
          pagesRead,
          bookmarks: bookmarksSnap.size,
          studyTime: resourcesRead * 15 // Mock study time calculation
        });
      } catch (err) {
        console.error("Error fetching premium home data:", err);
      }
    };

    fetchHomepageSettings();
    fetchPremiumData();
  }, [user]);

  const isPremium = userData?.isPremium || ['admin', 'superadmin', 'moderator'].includes(userData?.role || '');

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6 text-text-main uppercase whitespace-pre-wrap leading-tight"
            >
              {homepageSettings.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 font-medium"
            >
              {homepageSettings.subtitle}
            </motion.p>
            <div className="flex flex-col items-center lg:items-start">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-4 w-full"
              >
                {!showSubjects ? (
                  <button 
                    onClick={() => setShowSubjects(true)}
                    className="self-center lg:self-start px-8 py-4 bg-primary text-secondary rounded-lg font-bold shadow-[0_4px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[4px] transition-all uppercase tracking-wide"
                  >
                    Browse Materials
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-3 justify-center lg:justify-start"
                  >
                    {['Maths', 'English', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'Civics', 'Computer', 'Islamic Studies', 'Urdu'].map(subject => (
                      <Link 
                        key={subject}
                        to={`/resources?subject=${encodeURIComponent(subject)}`} 
                        className="px-4 py-2 bg-surface border border-secondary text-text-main rounded-full text-sm font-medium hover:bg-secondary hover:text-primary transition-colors"
                      >
                        {subject}
                      </Link>
                    ))}
                    <Link 
                      to="/resources" 
                      className="px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded-full text-sm font-bold hover:bg-primary hover:text-secondary transition-colors"
                    >
                      View All
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
          
          <div className="flex-1 relative flex justify-center items-center h-[500px] w-full mt-10 lg:mt-0">
            {/* New single hero image */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="relative w-full max-w-md h-full max-h-[400px] rounded-2xl overflow-hidden border-4 border-surface shadow-2xl z-10"
            >
              <img src={homepageSettings.bgImage} referrerPolicy="no-referrer" alt="Study desk" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Plan Info for Users */}
      {isPremium && (
        <section className="px-6 -mt-12 relative z-30">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto bg-primary/10 border border-primary/20 p-6 rounded-3xl backdrop-blur-md flex flex-wrap items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/30">
                <Crown size={24} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Premium Status</p>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Active Plan: {userData?.premiumPlan}</h3>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="text-center sm:text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Expires</p>
                <p className="text-white font-bold">
                  {userData?.premiumPlan === 'Lifetime' ? 'Never' : userData?.premiumExpiry?.toDate().toLocaleDateString() || 'N/A'}
                </p>
              </div>
              {userData?.premiumPlan !== 'Lifetime' && userData?.premiumExpiry && (
                <div className="text-center sm:text-left">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Remaining</p>
                  <p className="text-primary font-bold">
                    {Math.max(0, Math.ceil((userData.premiumExpiry.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </section>
      )}

      {/* Continue Reading & Stats Section for Premium Users */}
      {isPremium && user && (
        <section className="px-6 -mt-8 relative z-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reading Stats */}
            <div className="lg:col-span-1 bg-surface border border-primary/20 rounded-3xl p-6 shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <CheckCircle2 className="text-primary w-5 h-5" />
                Your Progress
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 p-4 rounded-2xl border border-secondary">
                  <BookOpen className="text-primary w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.resourcesRead}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Resources</p>
                </div>
                <div className="bg-secondary/30 p-4 rounded-2xl border border-secondary">
                  <Layers className="text-primary w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.pagesRead}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Pages Read</p>
                </div>
                <div className="bg-secondary/30 p-4 rounded-2xl border border-secondary">
                  <Bookmark className="text-primary w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.bookmarks}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Bookmarks</p>
                </div>
                <div className="bg-secondary/30 p-4 rounded-2xl border border-secondary">
                  <Clock className="text-primary w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.studyTime}m</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Study Time</p>
                </div>
              </div>
            </div>

            {/* Continue Reading */}
            <div className="lg:col-span-2 bg-surface border border-secondary rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <History className="text-primary w-5 h-5" />
                  Continue Reading
                </h3>
              </div>
              
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-secondary">
                    <p className="text-gray-500 text-sm">No recent history. Start reading to see your progress!</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <Link 
                      key={item.resourceId} 
                      to={`/viewer/${item.resourceId}`}
                      className="flex items-center gap-4 p-3 bg-secondary/30 hover:bg-secondary/50 rounded-2xl border border-secondary transition-all group"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                        <BookOpen size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{item.resourceTitle}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase whitespace-nowrap">{item.percentage}% Done</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-primary text-secondary rounded-lg font-bold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        Resume
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feature Section */}
      <section className="px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface p-8 rounded-2xl border border-secondary/50 shadow-lg hover:-translate-y-2 transition-transform">
            <BookOpen className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-text-main mb-2 uppercase tracking-wide">Vast Library</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Access thousands of PDFs, notes, and previous year papers categorized by subject and board.</p>
          </div>
          <div className="bg-surface p-8 rounded-2xl border border-secondary/50 shadow-lg hover:-translate-y-2 transition-transform">
            <Download className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-text-main mb-2 uppercase tracking-wide">Easy Download</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Download resources instantly or read them online with our built-in PDF viewer.</p>
          </div>
          <div className="bg-surface p-8 rounded-2xl border border-secondary/50 shadow-lg hover:-translate-y-2 transition-transform">
            <UserIcon className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-text-main mb-2 uppercase tracking-wide">Community</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Join thousands of students. Share your notes and contribute to the growing educational hub.</p>
          </div>
          <div className="bg-surface p-8 rounded-2xl border border-secondary/50 shadow-lg hover:-translate-y-2 transition-transform relative overflow-hidden group">
            <div className="absolute inset-0">
               <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop" alt="Desk" className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>
            <div className="relative z-10">
              <MonitorPlay className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-text-main mb-2 uppercase tracking-wide">Online Viewer</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Experience a seamless reading environment tailored for focused studying.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Functionality Section */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
           <div className="flex-1 space-y-6">
              <p className="text-primary font-bold tracking-widest uppercase text-sm">Elevate Your Learning</p>
              <h2 className="text-4xl lg:text-5xl font-bold text-text-main uppercase tracking-tighter leading-tight">
                Where Education <br/> Meets Functionality
              </h2>
              <p className="text-gray-400 text-lg max-w-lg">
                We've combined an elegant reading experience with powerful organizational tools. Filter by class, subject, or board to find exactly what you need.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                 <div>
                    <h4 className="text-text-main font-bold mb-1">Web Design & Resources</h4>
                    <p className="text-gray-500 text-sm">Optimized for every device.</p>
                 </div>
                 <div>
                    <h4 className="text-text-main font-bold mb-1">Discover Innovation</h4>
                    <p className="text-gray-500 text-sm">A new way to interact with study materials.</p>
                 </div>
                 <div>
                    <h4 className="text-text-main font-bold mb-1">User First</h4>
                    <p className="text-gray-500 text-sm">Clean, readable interfaces.</p>
                 </div>
                 <div>
                    <h4 className="text-text-main font-bold mb-1">SEO Optimized</h4>
                    <p className="text-gray-500 text-sm">Fast loading and discoverable.</p>
                 </div>
              </div>
           </div>
           <div className="flex-1 w-full relative">
              <div className="bg-surface rounded-2xl overflow-hidden shadow-2xl relative pt-[60%]">
                 <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop" alt="Workspace" className="absolute top-0 left-0 w-full h-full object-cover opacity-70" />
                 <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent"></div>
                 <div className="absolute bottom-6 left-6 right-6 p-6 bg-surface/80 backdrop-blur-md border border-secondary rounded-xl">
                   <h3 className="text-text-main font-bold uppercase tracking-wide">Transforming Ideas Into Visual Masterpieces</h3>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Creator Section */}
      <CreatorSection />
    </div>
  );
}
