import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/Button";
import { validateResumeFile, formatFileSize } from "@/services/resumeScanService";
import { useToast } from "@/hooks/useToast";

interface ResumeUploadPanelProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  uploadProgress: number;
}

/**
 * Handles every upload interaction: drag-and-drop, browse, replace,
 * and remove, plus a real upload progress bar (driven by the XHR
 * progress event in resumeScanService — see analyzeResume there).
 */
export function ResumeUploadPanel({
  file,
  onFileSelect,
  onRemove,
  onAnalyze,
  isAnalyzing,
  uploadProgress,
}: ResumeUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFiles = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;

    const error = validateResumeFile(selected);
    if (error) {
      showToast(error, "error");
      return;
    }

    onFileSelect(selected);
  };

  return (
    <div className="surface-card p-6 sm:p-8">
      {!file ? (
        <motion.div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          animate={{
            borderColor: isDragging ? "rgba(79,124,255,0.6)" : "rgba(35,43,61,1)",
            backgroundColor: isDragging ? "rgba(79,124,255,0.06)" : "transparent",
          }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center"
        >
          <motion.div animate={{ y: isDragging ? -4 : 0 }} transition={{ duration: 0.15 }}>
            <UploadCloud className="h-8 w-8 text-accent-primary" strokeWidth={1.5} />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-ink">Drag and drop your resume here</p>
            <p className="mt-1 text-xs text-ink-faint">PDF only, up to 5MB</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="mt-2">
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-base-border bg-base-elevated/40 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-ink-faint">{formatFileSize(file.size)}</p>
            </div>
            {!isAnalyzing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => inputRef.current?.click()}
                  aria-label="Replace file"
                  title="Replace file"
                  className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-base-elevated hover:text-ink"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={onRemove}
                  aria-label="Remove file"
                  title="Remove file"
                  className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-base-elevated hover:text-accent-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>

          {isAnalyzing && (
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-elevated">
                <motion.div
                  className="h-full rounded-full bg-cta-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <p className="text-xs text-ink-faint">
                {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Processing..."}
              </p>
            </div>
          )}

          {!isAnalyzing && (
            <Button size="lg" onClick={onAnalyze} className="w-full">
              Analyze Resume
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
