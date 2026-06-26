import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Trash2, Edit2, X, Save, AlertCircle, FileText, ExternalLink, Tag, GraduationCap, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminResourceList() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResources(res);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load resources: ' + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'resources', id));
      setDeletingId(null);
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (resource: any) => {
    setEditingId(resource.id);
    setEditForm(resource);
  };

  const handleUpdate = async () => {
    if (!editForm.title || !editForm.pdfUrl) {
      alert("Title and PDF URL are required.");
      return;
    }
    
    try {
      const resourceRef = doc(db, 'resources', editingId!);
      await updateDoc(resourceRef, {
        title: editForm.title,
        description: editForm.description || '',
        category: editForm.category || '',
        classLevel: editForm.classLevel || '',
        pdfUrl: editForm.pdfUrl,
        thumbnailUrl: editForm.thumbnailUrl || '',
        subject: editForm.subject || '',
        board: editForm.board || ''
      });
      setEditingId(null);
    } catch (err: any) {
      alert('Error updating: ' + err.message);
    }
  };

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-gray-500 font-bold animate-pulse text-center p-12 uppercase tracking-widest">Scanning Archives...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-secondary pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <FileText className="text-primary" />
            Resource Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">Review, edit, and audit platform content library.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-secondary rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-primary placeholder-gray-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl border border-red-500/20 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredResources.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-[2.5rem] border border-secondary">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No educational resources found.</p>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={resource.id} 
                className="bg-surface p-6 rounded-3xl border border-secondary hover:border-primary/30 transition-all group shadow-lg"
              >
                {editingId === resource.id ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Title</label>
                        <input 
                          type="text" 
                          value={editForm.title} 
                          onChange={e => setEditForm({...editForm, title: e.target.value})}
                          className="w-full bg-background-main border border-secondary p-3 rounded-xl text-white text-sm focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Category</label>
                        <input 
                          type="text" 
                          value={editForm.category} 
                          onChange={e => setEditForm({...editForm, category: e.target.value})}
                          className="w-full bg-background-main border border-secondary p-3 rounded-xl text-white text-sm focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Class Level</label>
                        <input 
                          type="text" 
                          value={editForm.classLevel} 
                          onChange={e => setEditForm({...editForm, classLevel: e.target.value})}
                          className="w-full bg-background-main border border-secondary p-3 rounded-xl text-white text-sm focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Thumbnail URL</label>
                        <input 
                          type="text" 
                          value={editForm.thumbnailUrl} 
                          onChange={e => setEditForm({...editForm, thumbnailUrl: e.target.value})}
                          className="w-full bg-background-main border border-secondary p-3 rounded-xl text-white text-sm focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Description</label>
                      <textarea 
                        value={editForm.description} 
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                        className="w-full bg-background-main border border-secondary p-3 rounded-xl text-white text-sm focus:border-primary outline-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-3 justify-end border-t border-secondary pt-4">
                      <button onClick={handleUpdate} className="flex items-center gap-2 bg-primary text-secondary px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                        <Save size={18} /> Update Content
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-2 bg-secondary text-gray-400 px-6 py-2 rounded-xl font-bold text-sm hover:text-white transition-all">
                        <X size={18} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-primary border border-surface shadow-inner overflow-hidden shrink-0">
                      {resource.thumbnailUrl ? (
                        <img src={resource.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={28} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-lg truncate group-hover:text-primary transition-colors">{resource.title}</h3>
                        <span className="px-2 py-0.5 bg-background-main border border-secondary rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest">{resource.category || 'Misc'}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 font-medium">{resource.description || 'No description provided.'}</p>
                      <div className="flex flex-wrap gap-4 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                          <GraduationCap size={14} className="text-primary" />
                          {resource.classLevel || 'Universal'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                          <Tag size={14} className="text-primary" />
                          {resource.subject || 'General'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold uppercase tracking-wider hover:underline cursor-pointer">
                          <ExternalLink size={14} />
                          <a href={resource.pdfUrl} target="_blank" rel="noopener noreferrer">Inspect PDF</a>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 md:ml-auto">
                      {deletingId === resource.id ? (
                        <div className="flex gap-2 items-center bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                          <span className="text-xs font-bold text-red-400 px-2">Delete Permanently?</span>
                          <button onClick={() => handleDelete(resource.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-500/20">Confirm</button>
                          <button onClick={() => setDeletingId(null)} className="px-4 py-2 bg-surface text-gray-400 rounded-lg text-xs font-bold">Abort</button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEdit(resource)} 
                            className="p-3 bg-secondary text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl border border-surface transition-all shadow-md"
                            title="Edit Metadata"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button 
                            onClick={() => setDeletingId(resource.id)} 
                            className="p-3 bg-secondary text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-surface transition-all shadow-md"
                            title="Purge Resource"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
