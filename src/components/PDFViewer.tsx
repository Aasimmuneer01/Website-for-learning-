import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Resource } from '../types';
import { Download, Printer, X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer() {
  const { resourceId } = useParams();
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayEmail = userData?.email || user?.email || 'Unauthorized';
  const isPremium = userData?.isPremium || ['admin', 'superadmin', 'moderator'].includes(userData?.role || '');

  useEffect(() => {
    const fetchResource = async () => {
      if (!resourceId) return;
      try {
        const docRef = doc(db, 'resources', resourceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResource({ id: docSnap.id, ...docSnap.data() } as Resource);
        } else {
          setError("Resource not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load resource");
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [resourceId]);

  useEffect(() => {
    if (!resource || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(resource.pdfUrl);
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering PDF:", err);
      }
    };

    renderPage();
  }, [resource, currentPage, scale]);

  const handleDownload = async () => {
    if (!isPremium || !resource) return;
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        downloadCount: increment(1)
      });
      const link = document.createElement('a');
      link.href = resource.pdfUrl;
      link.download = `${resource.title}.pdf`;
      link.target = '_blank';
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background-main z-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="fixed inset-0 bg-background-main z-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{error || "Something went wrong"}</h2>
        <button onClick={() => navigate('/resources')} className="mt-4 px-6 py-2 bg-primary text-secondary rounded-lg font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Header */}
      <div className="bg-secondary p-4 flex items-center justify-between border-b border-surface">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/resources')} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
          <h1 className="text-white font-bold truncate max-w-[200px] sm:max-w-md">{resource.title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isPremium && (
            <>
              <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-white transition-colors">
                <Printer size={20} />
              </button>
              <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-primary text-secondary rounded-lg font-bold text-sm">
                <Download size={18} />
                <span className="hidden sm:inline">Download</span>
              </button>
            </>
          )}
          {!isPremium && (
            <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-xs font-bold uppercase">
              Free Preview
            </div>
          )}
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 overflow-auto bg-zinc-900 p-4 flex justify-center relative" ref={containerRef}>
        <div className="relative inline-block shadow-2xl">
          <canvas ref={canvasRef} className="max-w-full h-auto" />
          
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="transform -rotate-45 text-white/5 text-4xl sm:text-6xl font-bold whitespace-nowrap select-none text-center">
              {displayEmail}<br/>{displayEmail}<br/>{displayEmail}
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-20">
             <div className="grid grid-cols-2 gap-20 transform -rotate-12 select-none">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="text-white/10 text-lg font-mono">
                    {displayEmail}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="bg-secondary p-4 border-t border-surface flex items-center justify-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-2 text-white disabled:text-gray-600 hover:bg-surface rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-white font-bold">
            Page {currentPage} of {numPages}
          </span>
          <button 
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2 text-white disabled:text-gray-600 hover:bg-surface rounded-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))} className="px-2 text-white hover:bg-surface rounded">-</button>
          <span className="text-white text-sm">{(scale * 100).toFixed(0)}%</span>
          <button onClick={() => setScale(prev => Math.min(3, prev + 0.2))} className="px-2 text-white hover:bg-surface rounded">+</button>
        </div>
      </div>
    </div>
  );
}
