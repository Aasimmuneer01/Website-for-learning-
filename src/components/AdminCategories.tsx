import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Grid, Plus, Trash2, Tag, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Category {
  id: string;
  name: string;
  count?: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!newCatName.trim()) return;
    const id = newCatName.toLowerCase().replace(/\s+/g, '-');
    try {
      await setDoc(doc(db, 'categories', id), {
        name: newCatName.trim(),
        createdAt: new Date()
      });
      setNewCatName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Resources in this category won't be deleted but will have a missing category reference.")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-surface p-8 rounded-[2rem] border border-secondary shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-tight flex items-center gap-3">
          <Grid className="text-primary" />
          Category Management
        </h3>
        
        <div className="flex gap-4 mb-10">
          <div className="flex-1 relative group">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Enter new category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full bg-secondary border border-surface rounded-2xl pl-12 pr-4 py-4 text-white font-medium outline-none focus:border-primary transition-all shadow-inner"
            />
          </div>
          <button 
            onClick={handleAdd}
            className="px-8 py-4 bg-primary text-secondary rounded-2xl font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {loading ? (
              <div className="col-span-full py-12 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Syncing Collections...</div>
            ) : categories.map((cat) => (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background-main border border-secondary p-5 rounded-2xl flex items-center justify-between group hover:border-primary/40 transition-all shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                    <Tag size={18} />
                  </div>
                  <div>
                    <p className="text-white font-bold">{cat.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{cat.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
