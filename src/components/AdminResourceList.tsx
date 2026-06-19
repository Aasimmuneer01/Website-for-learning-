import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Trash2, Edit2, X, Save, AlertCircle } from 'lucide-react';

export default function AdminResourceList() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [error, setError] = useState('');

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
        thumbnailUrl: editForm.thumbnailUrl || ''
      });
      setEditingId(null);
    } catch (err: any) {
      alert('Error updating: ' + err.message);
    }
  };

  if (loading) {
    return <div className="text-white">Loading resources...</div>;
  }

  return (
    <div className="bg-surface p-6 rounded-xl border border-secondary shadow-lg">
      <h2 className="text-xl font-bold text-white mb-6">Manage Resources</h2>
      
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg flex items-center mb-6">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {resources.length === 0 ? (
        <p className="text-gray-400">No resources found.</p>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-background-main p-4 rounded-lg border border-secondary flex flex-col md:flex-row gap-4 items-start md:items-center">
              {editingId === resource.id ? (
                <div className="flex-1 w-full space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      value={editForm.title} 
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                      className="bg-surface border border-secondary p-2 rounded text-white text-sm"
                      placeholder="Title"
                    />
                    <input 
                      type="text" 
                      value={editForm.category} 
                      onChange={e => setEditForm({...editForm, category: e.target.value})}
                      className="bg-surface border border-secondary p-2 rounded text-white text-sm"
                      placeholder="Category"
                    />
                    <input 
                      type="url" 
                      value={editForm.pdfUrl} 
                      onChange={e => setEditForm({...editForm, pdfUrl: e.target.value})}
                      className="bg-surface border border-secondary p-2 rounded text-white text-sm"
                      placeholder="PDF URL"
                    />
                    <input 
                      type="url" 
                      value={editForm.thumbnailUrl} 
                      onChange={e => setEditForm({...editForm, thumbnailUrl: e.target.value})}
                      className="bg-surface border border-secondary p-2 rounded text-white text-sm"
                      placeholder="Thumbnail URL"
                    />
                  </div>
                  <textarea 
                    value={editForm.description} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="bg-surface border border-secondary p-2 rounded text-white text-sm w-full"
                    placeholder="Description"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleUpdate} className="flex items-center gap-1 bg-primary text-secondary px-3 py-1.5 rounded text-sm font-bold shadow-[0_2px_0_0_#0ea5e9]">
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-surface text-gray-400 px-3 py-1.5 rounded text-sm font-bold border border-secondary border-b-[3px]">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{resource.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-1">{resource.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-surface text-gray-400 px-2 py-1 rounded">{resource.category || 'N/A'}</span>
                      <a href={resource.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View PDF</a>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {deletingId === resource.id ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-red-400">Sure?</span>
                        <button onClick={() => handleDelete(resource.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold">Yes</button>
                        <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-surface text-gray-400 rounded text-xs font-bold">No</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(resource)} className="p-2 bg-surface text-blue-400 hover:text-blue-300 rounded border border-secondary border-b-[3px] transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingId(resource.id)} className="p-2 bg-surface text-red-500 hover:text-red-400 rounded border border-secondary border-b-[3px] transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
