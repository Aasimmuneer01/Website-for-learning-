import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Resource } from '../types';
import { FileText, Download, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 font-sans tracking-tight text-white uppercase">Study Resources</h1>
        <p className="text-gray-400">Browse and download educational materials.</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-surface p-12 rounded-2xl text-center border border-secondary shadow-lg">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-300 mb-2">No resources found</h2>
          <p className="text-gray-500">Resources uploaded by the admin will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={resource.id} 
              className="bg-surface rounded-2xl border border-secondary shadow-lg overflow-hidden flex flex-col hover:-translate-y-2 transition-transform duration-300"
            >
              {resource.thumbnailUrl ? (
                <div className="h-48 overflow-hidden">
                  <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover" />
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
                  <a 
                    href={resource.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-secondary rounded-lg font-bold text-sm shadow-[0_2px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[2px] transition-all uppercase"
                  >
                    View
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
