import { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResourceUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{status: string, percent?: number}>({status: ''});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generateSlug = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pdfUrl) {
      setError('Title and PDF Download URL are required.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      // Save to Firestore
      setProgress({ status: 'Saving to Database...' });
      await addDoc(collection(db, 'resources'), {
        title,
        slug: generateSlug(title),
        description,
        category,
        classLevel,
        pdfUrl,
        thumbnailUrl: thumbnailUrl || '',
        theme: '',
        subject: '',
        board: '',
        bannerUrl: '',
        viewCount: 0,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      });

      setSuccess('Resource added successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setClassLevel('');
      setPdfUrl('');
      setThumbnailUrl('');
      
    } catch (err: any) {
      console.error("Error adding resource:", err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setUploading(false);
      setProgress({ status: '' });
    }
  };

  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary shadow-[0_4px_0_0_theme(colors.secondary)]">
      <h2 className="text-2xl font-bold text-white mb-6 font-sans tracking-tight">Upload New Resource</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-start gap-3 text-green-500">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2 text-sm font-bold">Title *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="E.g., Intro to Algebra"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2 text-sm font-bold">Category</label>
              <input 
                type="text" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="E.g., Mathematics"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2 text-sm font-bold">Class/Level</label>
              <input 
                type="text" 
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="E.g., Grade 10"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2 text-sm font-bold">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="A brief description of this resource..."
              ></textarea>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2 text-sm font-bold">PDF Download URL (GitHub Raw URL) *</label>
                <input 
                  type="url" 
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  required
                  className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://raw.githubusercontent.com/..."
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 text-sm font-bold">Thumbnail URL (Optional)</label>
                <input 
                  type="url" 
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full bg-background-main border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={uploading}
          className="w-full py-4 px-4 bg-primary text-secondary font-bold rounded-lg shadow-[0_4px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[4px] transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_0_#0ea5e9] flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary"></div>
              <span>{progress.status}</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Add Resource</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
