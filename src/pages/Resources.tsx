import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Resource } from '../types';
import { FileText, Download, Eye, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

const SUBJECTS = ['All', 'Maths', 'English', 'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'Civics', 'Computer', 'Islamic Studies', 'Urdu'];

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const currentSubject = searchParams.get('subject') || 'All';

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedResources = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        setResources(fetchedResources);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSubject = currentSubject === 'All' || (resource.category && resource.category.toLowerCase() === currentSubject.toLowerCase());
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSubject && matchesSearch;
    });
  }, [resources, currentSubject, searchQuery]);

  const handleSubjectClick = (subject: string) => {
    if (subject === 'All') {
      searchParams.delete('subject');
    } else {
      searchParams.set('subject', subject);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 font-sans tracking-tight text-white uppercase">Study Resources</h1>
        <p className="text-gray-400">Browse and download educational materials.</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar / Filters */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-surface p-4 rounded-xl border border-secondary shadow-lg">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background-main border border-secondary p-2 pl-9 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <h3 className="text-white font-bold mb-3 uppercase tracking-wide text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" /> Subjects
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {SUBJECTS.map(subject => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectClick(subject)}
                    className={`px-3 py-2 text-sm md:text-md rounded-lg font-medium text-left transition-colors ${
                      currentSubject === subject 
                        ? 'bg-primary text-secondary font-bold shadow-[0_2px_0_0_#0ea5e9]' 
                        : 'text-gray-400 hover:bg-secondary hover:text-white'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="bg-surface p-12 rounded-2xl text-center border border-secondary shadow-lg">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-300 mb-2">No resources found</h2>
              <p className="text-gray-500">Try selecting a different subject or adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResources.map((resource, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 10) * 0.05 }}
                  key={resource.id} 
                  className="bg-surface rounded-2xl border border-secondary shadow-lg overflow-hidden flex flex-col hover:-translate-y-2 transition-transform duration-300"
                >
                  {resource.thumbnailUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img src={resource.thumbnailUrl} alt={resource.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 bg-secondary flex items-center justify-center border-b border-surface">
                       <FileText className="w-16 h-16 text-primary" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-primary/20 text-primary uppercase rounded">
                        {resource.category || 'General'}
                      </span>
                      <span className="text-xs font-bold text-gray-500 bg-secondary px-2 py-1 rounded">
                        {resource.classLevel}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">{resource.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{resource.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-secondary">
                      <div className="flex items-center gap-4 text-gray-500 text-sm">
                        <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {resource.viewCount || 0}</span>
                        <span className="flex items-center gap-1"><Download className="w-4 h-4" /> {resource.downloadCount || 0}</span>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={resource.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-secondary text-primary rounded-lg font-bold text-sm shadow-[0_2px_0_0_theme(colors.surface)] hover:shadow-none hover:translate-y-[2px] transition-all uppercase"
                        >
                          View
                        </a>
                        <a 
                          href={resource.pdfUrl} 
                          download={`${resource.slug || 'download'}.pdf`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary text-secondary rounded-lg font-bold text-sm shadow-[0_2px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[2px] transition-all uppercase"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
