import { useState } from 'react';
import { db, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResourceUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{status: string, percent?: number}>({status: ''});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
      } else {
        alert('Please select a valid PDF file.');
      }
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setThumbnailFile(file);
      } else {
        alert('Please select a valid image file.');
      }
    }
  };

  const generateSlug = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pdfFile) {
      setError('Title and PDF file are required.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      // 1. Upload PDF
      setProgress({ status: 'Uploading PDF...' });
      const pdfRef = ref(storage, `resources/pdfs/${Date.now()}_${pdfFile.name}`);
      await uploadBytes(pdfRef, pdfFile);
      const pdfUrl = await getDownloadURL(pdfRef);

      // 2. Upload Thumbnail (Optional)
      let thumbnailUrl = '';
      if (thumbnailFile) {
        setProgress({ status: 'Uploading Thumbnail...' });
        const thumbRef = ref(storage, `resources/thumbnails/${Date.now()}_${thumbnailFile.name}`);
        await uploadBytes(thumbRef, thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbRef);
      }

      // 3. Save to Firestore
      setProgress({ status: 'Saving to Database...' });
      await addDoc(collection(db, 'resources'), {
        title,
        slug: generateSlug(title),
        description,
        category,
        classLevel,
        pdfUrl,
        thumbnailUrl,
        theme: '',
        subject: '',
        board: '',
        bannerUrl: '',
        viewCount: 0,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      });

      setSuccess('Resource uploaded successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setClassLevel('');
      setPdfFile(null);
      setThumbnailFile(null);
      
    } catch (err: any) {
      console.error("Error uploading resource:", err);
      let errorMessage = err.message || 'An error occurred during upload.';
      
      if (err.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. Please ensure your Firebase Storage rules allow uploads.';
      } else if (err.code === 'storage/retry-limit-exceeded' || errorMessage.includes('retry')) {
        errorMessage = 'Upload timed out. Have you enabled Firebase Storage in your Firebase Console? Please go to the Firebase Console -> Build -> Storage -> Get Started.';
      } else if (err.code === 'storage/unknown') {
        errorMessage = 'Unknown storage error. Please verify Firebase Storage is enabled in the console.';
      }

      setError(errorMessage);
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 text-sm font-bold">PDF File *</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-secondary rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center">
                  <FileText className={`w-8 h-8 mb-2 ${pdfFile ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="text-xs text-gray-400 max-w-full truncate px-2">
                    {pdfFile ? pdfFile.name : 'Select PDF'}
                  </span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfChange} />
                </label>
              </div>
              
              <div>
                <label className="block text-white mb-2 text-sm font-bold">Thumbnail (Optional)</label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-secondary rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center">
                  <ImageIcon className={`w-8 h-8 mb-2 ${thumbnailFile ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="text-xs text-gray-400 max-w-full truncate px-2">
                    {thumbnailFile ? thumbnailFile.name : 'Select Image'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                </label>
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
              <span>Upload Resource</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
