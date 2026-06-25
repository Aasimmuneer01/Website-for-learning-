import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Resource } from '../types';
import { Download, Printer, X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Maximize2, Lock } from 'lucide-react';

// Set up the worker using a reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const displayEmail = userData?.email || user?.email || 'Unauthorized';
  const isPremium = userData?.isPremium || ['admin', 'superadmin', 'moderator'].includes(userData?.role || '');

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const fetchResource = async () => {
      if (!resourceId) return;
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'resources', resourceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : null;
          if (data) {
            setResource(data as Resource);
          } else {
            setError("Resource data is empty");
          }
        } else {
          setError("Resource not found in database");
        }
      } catch (err: any) {
        console.error("Firestore error:", err);
        setError(`Failed to fetch resource: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [resourceId]);

  // Load PDF document
  useEffect(() => {
    if (!resource?.pdfUrl) return;

    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: resource.pdfUrl,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (err: any) {
        console.error("PDF.js loading error:", err);
        if (err.name === 'PasswordException') {
          setError("This PDF is password protected");
        } else if (err.name === 'InvalidPDFException') {
          setError("The file is not a valid PDF");
        } else if (err.name === 'MissingPDFException') {
          setError("PDF file was not found (404)");
        } else {
          setError(`Failed to load PDF: ${err.message || 'CORS or Network error'}. Please try downloading instead.`);
        }
      }
    };

    loadPDF();
  }, [resource?.pdfUrl]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Cancel existing render task if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        // Adjust for device pixel ratio
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        const transform = outputScale !== 1 
          ? [outputScale, 0, 0, outputScale, 0, 0] 
          : null;

        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') return;
        console.error("Error rendering PDF page:", err);
      }
    };

    renderPage();
    
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handleDownload = () => {
    if (!isPremium || !resource) return;
    
    // Increment count in background if authenticated
    if (auth.currentUser) {
      updateDoc(doc(db, 'resources', resource.id), {
        downloadCount: increment(1)
      }).catch(err => console.error("Count increment error:", err));
    }

    // Open in new tab immediately to avoid popup blocker
    try {
      const win = window.open(resource.pdfUrl, '_blank');
      if (!win) {
        // Fallback if blocked
        window.location.href = resource.pdfUrl;
      }
    } catch (err) {
      console.error("Download redirection failed:", err);
      window.location.href = resource.pdfUrl;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background-main z-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-white animate-pulse">please wait until the pdf view is loading</p>
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
    <div ref={viewerRef} className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Header */}
      <div className="bg-secondary p-4 flex items-center justify-between border-b border-surface">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/resources')} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
          <h1 className="text-white font-bold truncate max-w-[200px] sm:max-w-md">{resource.title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-light text-text-main rounded-lg transition-colors text-sm border border-surface-border"
          >
            <Maximize2 size={18} />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
          </button>
          
          <button 
            onClick={() => {
              if (isPremium) {
                window.print();
              } else {
                alert("Ask the admin to give you the premium access to print any resources");
              }
            }} 
            className="p-2 text-gray-400 hover:text-text-main transition-colors"
            title="Print"
          >
            <Printer size={20} />
          </button>

          <button 
            onClick={() => {
              if (isPremium) {
                handleDownload();
              } else {
                alert("Ask the admin to give you the premium access to download any resources");
              }
            }} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              isPremium 
                ? 'bg-primary text-secondary' 
                : 'bg-secondary text-gray-500 border border-surface hover:text-gray-300'
            }`}
          >
            {isPremium ? <Download size={18} /> : <Lock size={18} />}
            <span className="hidden sm:inline">Download</span>
          </button>

          {!isPremium && (
            <div className="hidden xs:block px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-xs font-bold uppercase">
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
            className="p-2 text-text-main disabled:text-gray-600 hover:bg-surface rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-text-main font-bold">
            Page {currentPage} of {numPages}
          </span>
          <button 
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2 text-text-main disabled:text-gray-600 hover:bg-surface rounded-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="sm:hidden p-2 text-text-main hover:bg-surface rounded-lg"
            title="Full Screen"
          >
            <Maximize2 size={24} />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))} className="px-2 text-text-main hover:bg-surface rounded">-</button>
            <span className="text-text-main text-sm">{(scale * 100).toFixed(0)}%</span>
            <button onClick={() => setScale(prev => Math.min(3, prev + 0.2))} className="px-2 text-text-main hover:bg-surface rounded">+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
