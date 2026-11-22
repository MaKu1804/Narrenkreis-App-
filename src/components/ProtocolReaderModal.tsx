import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  AlertCircle,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { MeetingProtocol } from '../utils/clubLogic';
import {
  convertDocxToSafeHtml,
  createBlobUrlFromDataUrl,
  decodePlainTextDataUrl,
  detectProtocolKind,
  getProtocolFormatLabel,
  createPdfLoadingTask,
  printProtocolDocument,
} from '../utils/protocolDocument';

interface ProtocolReaderModalProps {
  protocol: MeetingProtocol;
  onClose: () => void;
}

const ZOOM_LEVELS = [0.75, 0.9, 1.0, 1.15, 1.3, 1.5, 1.75, 2.0] as const;

function getTextZoomClass(zoom: number): string {
  if (zoom <= 0.75) return 'text-xs leading-relaxed';
  if (zoom <= 0.9) return 'text-sm leading-relaxed';
  if (zoom <= 1.0) return 'text-[15px] leading-relaxed';
  if (zoom <= 1.15) return 'text-base leading-relaxed';
  if (zoom <= 1.3) return 'text-lg leading-relaxed';
  if (zoom <= 1.5) return 'text-xl leading-relaxed';
  if (zoom <= 1.75) return 'text-2xl leading-normal';
  return 'text-[26px] leading-normal';
}

function getImageZoomWidthClass(zoom: number): string {
  if (zoom <= 0.75) return 'w-3/4';
  if (zoom <= 0.9) return 'w-11/12';
  if (zoom <= 1.0) return 'w-full';
  if (zoom <= 1.15) return 'w-[115%] max-w-none';
  if (zoom <= 1.3) return 'w-[130%] max-w-none';
  if (zoom <= 1.5) return 'w-[150%] max-w-none';
  if (zoom <= 1.75) return 'w-[175%] max-w-none';
  return 'w-[200%] max-w-none';
}

export const ProtocolReaderModal: React.FC<ProtocolReaderModalProps> = ({
  protocol,
  onClose,
}) => {
  const kind = useMemo(() => detectProtocolKind(protocol), [protocol]);
  const formatLabel = useMemo(() => getProtocolFormatLabel(kind), [kind]);

  const [zoomIndex, setZoomIndex] = useState<number>(2); // 1.0 (100%)
  const zoom = ZOOM_LEVELS[zoomIndex];

  const [isLoading, setIsLoading] = useState<boolean>(
    kind === 'docx' || kind === 'pdf'
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const pageContainerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [containerWidth, setContainerWidth] = useState<number>(720);

  // Create safe Blob URL for downloads / open-in-tab fallback
  const blobUrl = useMemo(() => {
    try {
      return createBlobUrlFromDataUrl(
        protocol.fileData,
        protocol.fileType || 'application/octet-stream'
      );
    } catch {
      return null;
    }
  }, [protocol.fileData, protocol.fileType]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Measure viewport width so PDF pages fit smartphone screen width cleanly at 100%
  useEffect(() => {
    const updateWidth = () => {
      if (viewportRef.current) {
        const available = Math.max(260, viewportRef.current.clientWidth - 24);
        setContainerWidth(Math.min(available, 860));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Lock background scroll & bind keyboard shortcuts (Escape to close, +/- to zoom)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
      } else if (e.key === '-') {
        setZoomIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Load DOCX or PDF content asynchronously in the browser
  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof createPdfLoadingTask> | null = null;

    setLoadError(null);
    setDocxHtml('');
    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);

    if (kind === 'docx') {
      setIsLoading(true);
      convertDocxToSafeHtml(protocol.fileData)
        .then((html) => {
          if (cancelled) return;
          if (!html.trim()) {
            setLoadError(
              'Dieses Word-Dokument enthält keinen direkt darstellbaren Text.'
            );
          } else {
            setDocxHtml(html);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('DOCX Konvertierungsfehler:', err);
          setLoadError(
            'Die Word-Datei (.docx) konnte nicht direkt gelesen werden. Bitte lade sie über den Download-Button herunter.'
          );
          setIsLoading(false);
        });
    } else if (kind === 'pdf') {
      setIsLoading(true);
      loadingTask = createPdfLoadingTask(protocol.fileData);
      loadingTask.promise
        .then((doc) => {
          if (cancelled) {
            void loadingTask?.destroy();
            return;
          }
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setIsLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('PDF Ladefehler:', err);
          setLoadError(
            'Das PDF-Dokument konnte nicht direkt gerendert werden. Du kannst es unten herunterladen oder im neuen Tab öffnen.'
          );
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
      if (loadingTask) {
        void loadingTask.destroy();
      }
    };
  }, [kind, protocol.fileData]);

  // Render PDF pages onto canvases whenever PDF, containerWidth, or zoom changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    let cancelled = false;
    const activeTasks: Array<{ cancel: () => void }> = [];

    const renderPages = async () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (cancelled) return;
        const canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) continue;

        try {
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = containerWidth / baseViewport.width;
          const displayScale = fitScale * zoom;
          const cssWidth = Math.floor(baseViewport.width * displayScale);
          const cssHeight = Math.floor(baseViewport.height * displayScale);

          const renderViewport = page.getViewport({
            scale: displayScale * dpr,
          });

          canvas.width = Math.floor(renderViewport.width);
          canvas.height = Math.floor(renderViewport.height);
          canvas.style.width = `${cssWidth}px`;
          canvas.style.height = `${cssHeight}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          const renderTask = page.render({
            canvas,
            canvasContext: ctx,
            viewport: renderViewport,
          });
          activeTasks.push(renderTask);
          await renderTask.promise;
        } catch (err: unknown) {
          const errorName =
            err && typeof err === 'object' && 'name' in err
              ? String((err as { name: string }).name)
              : '';
          if (errorName !== 'RenderingCancelledException' && !cancelled) {
            console.error(`Fehler beim Rendern von Seite ${pageNum}:`, err);
          }
        }
      }
    };

    void renderPages();

    return () => {
      cancelled = true;
      activeTasks.forEach((t) => {
        try {
          t.cancel();
        } catch {
          // ignore
        }
      });
    };
  }, [pdfDoc, numPages, containerWidth, zoom]);

  // Observe visible PDF page during scroll
  useEffect(() => {
    if (kind !== 'pdf' || numPages <= 1 || !viewportRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestPage = currentPage;
        let maxRatio = 0;
        entries.forEach((entry) => {
          const pageAttr = entry.target.getAttribute('data-page-num');
          if (pageAttr && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            bestPage = Number(pageAttr);
          }
        });
        if (maxRatio > 0) {
          setCurrentPage(bestPage);
        }
      },
      {
        root: viewportRef.current,
        threshold: [0.25, 0.5, 0.75],
      }
    );

    pageContainerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [kind, numPages, currentPage]);

  const plainTextContent = useMemo(() => {
    if (kind !== 'text') return '';
    return decodePlainTextDataUrl(protocol.fileData);
  }, [kind, protocol.fileData]);

  const formattedDate = useMemo(() => {
    if (!protocol.date) return '';
    const parsed = new Date(protocol.date);
    if (Number.isNaN(parsed.getTime())) return protocol.date;
    return parsed.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [protocol.date]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePrint = async () => {
    setPrintError(null);
    setIsPrinting(true);
    const res = await printProtocolDocument(protocol);
    setIsPrinting(false);
    if (!res.ok && res.error) {
      setPrintError(res.error);
    }
  };

  const zoomPercent = Math.round(zoom * 100);
  const downloadHref = blobUrl || protocol.fileData;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-slate-950 sm:p-4 sm:bg-slate-950/80 sm:backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={protocol.title}
    >
      <div className="flex-1 flex flex-col w-full h-full sm:max-w-5xl sm:mx-auto sm:max-h-[94vh] bg-white dark:bg-slate-900 sm:rounded-2xl sm:border sm:border-slate-200 dark:sm:border-slate-800 sm:shadow-2xl overflow-hidden">
        {/* Compact Top App Bar (Mobile-first ~54px) */}
        <header className="shrink-0 h-14 px-2 sm:px-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Schließen"
              aria-label="Leseansicht schließen"
            >
              <ArrowLeft className="w-5 h-5 sm:hidden" />
              <FileText className="w-5 h-5 hidden sm:block text-red-700 dark:text-red-400" />
            </button>

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
                {protocol.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{protocol.meetingType}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{formattedDate}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Leseansicht schließen (Esc)"
            aria-label="Leseansicht schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Reader Viewport (>= 85% height on mobile) */}
        <div
          ref={viewportRef}
          className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-3 sm:p-6"
        >
          {printError && (
            <div className="max-w-3xl mx-auto mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{printError}</span>
              </div>
              <button
                type="button"
                onClick={() => setPrintError(null)}
                className="p-1 hover:opacity-75 cursor-pointer"
                aria-label="Hinweis schließen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="h-full min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-700 dark:text-red-400" />
              <p className="text-sm font-medium">
                Protokoll wird zum Lesen aufbereitet…
              </p>
            </div>
          ) : loadError || kind === 'legacy-doc' || kind === 'unsupported' ? (
            <div className="max-w-lg mx-auto my-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Direktansicht nicht verfügbar
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {loadError
                    ? loadError
                    : kind === 'legacy-doc'
                    ? `Das ältere Dokumentformat (${protocol.fileName}) kann im Browser nicht direkt dargestellt werden. Lade die Datei herunter, um sie in deiner Office-App zu öffnen.`
                    : `Das Dateiformat von „${protocol.fileName}“ wird für die Direktvorschau nicht unterstützt.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <a
                  href={downloadHref}
                  download={protocol.fileName}
                  className="min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Datei herunterladen ({formatFileSize(protocol.fileSize)})</span>
                </a>
                {blobUrl && kind === 'pdf' && (
                  <a
                    href={blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl inline-flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Im Browser-Tab öffnen</span>
                  </a>
                )}
              </div>
            </div>
          ) : kind === 'pdf' ? (
            <div className="min-w-full w-fit flex flex-col items-center gap-4 pb-4">
              {Array.from({ length: numPages }, (_, index) => {
                const pageNum = index + 1;
                return (
                  <div
                    key={pageNum}
                    data-page-num={pageNum}
                    ref={(el) => {
                      pageContainerRefs.current[index] = el;
                    }}
                    className="bg-white shadow-md rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800"
                  >
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[index] = el;
                      }}
                      className="block"
                    />
                  </div>
                );
              })}

              {blobUrl && (
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-700 dark:text-sky-400 hover:underline font-medium inline-flex items-center gap-1.5 py-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>PDF separat im Browser-Tab öffnen</span>
                </a>
              )}
            </div>
          ) : kind === 'docx' ? (
            <article className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-10 space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold tracking-wide text-red-700 dark:text-red-400">
                    Narrenkreis Bruchsal · Offizielles Protokoll
                  </p>
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {protocol.title}
                  </h4>
                  {protocol.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {protocol.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0">
                  {formattedDate}
                </span>
              </div>

              <div
                className={`${getTextZoomClass(zoom)} text-slate-800 dark:text-slate-200 break-words [&_h1]:text-[1.35em] [&_h1]:font-bold [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h1]:mt-5 [&_h1]:mb-2 [&_h2]:text-[1.18em] [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-[1.05em] [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-3 [&_h3]:mb-1.5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_a]:text-sky-600 dark:[&_a]:text-sky-400 [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-[0.9em] [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:p-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3`}
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            </article>
          ) : kind === 'image' ? (
            <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
              <img
                src={protocol.fileData}
                alt={protocol.title}
                className={`${getImageZoomWidthClass(zoom)} max-h-none object-contain rounded-xl shadow-md bg-white`}
              />
            </div>
          ) : (
            <article className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-8 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold tracking-wide text-red-700 dark:text-red-400">
                    Narrenkreis Bruchsal · Offizielles Protokoll
                  </p>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {protocol.title}
                  </h4>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {formattedDate}
                </span>
              </div>

              <pre
                className={`${getTextZoomClass(zoom)} font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto`}
              >
                {plainTextContent}
              </pre>
            </article>
          )}
        </div>

        {/* Thumb-Zone Bottom Action Bar */}
        <footer className="shrink-0 px-2 sm:px-5 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-2">
          {/* Left: Zoom & Page Indicator */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Verkleinern (-)"
              aria-label="Verkleinern"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setZoomIndex(2)}
              className="min-h-[44px] px-2 text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              title="Zoom auf 100 % zurücksetzen"
            >
              {zoomPercent}%
            </button>

            <button
              type="button"
              onClick={() =>
                setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
              }
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Vergrößern (+)"
              aria-label="Vergrößern"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {kind === 'pdf' && numPages > 0 && (
              <span className="ml-1 pl-2 border-l border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {currentPage} / {numPages}
              </span>
            )}
          </div>

          {/* Right: Print & Download */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="min-h-[44px] px-3 sm:px-4 py-2 text-xs font-semibold text-amber-950 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 border border-amber-300 dark:border-amber-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
              title="Sauberen Text / Seiten drucken"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 text-amber-800 dark:text-amber-400" />
              )}
              <span className="hidden xs:inline sm:inline">Drucken</span>
            </button>

            <a
              href={downloadHref}
              download={protocol.fileName}
              className="min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title={`${protocol.fileName} herunterladen`}
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
