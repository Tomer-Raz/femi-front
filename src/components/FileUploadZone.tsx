import { useState, useRef, useEffect } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { validateFile } from '@/lib/fileUtils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  acceptedTypes = ['.pdf', '.txt', '.tif', '.tiff'],
  maxSizeInMB = 10,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss error after 6 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateAndPassFiles = (files: File[]) => {
    setError(null);
    setIsLoading(true);

    // Use setTimeout to ensure loader shows immediately before processing
    setTimeout(() => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        const validation = validateFile(file, acceptedTypes, maxSizeInMB);
        if (validation.isValid) {
          validFiles.push(file);
        } else if (validation.error) {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      if (errors.length > 0) {
        setError(errors[0]); // Show first error
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }

      setIsLoading(false);
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    validateAndPassFiles(files);
  };

  const handleClick = () => {
    if (!disabled && !isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      validateAndPassFiles(files);

      // Clear input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div>
      <div
        className={`
          border-2 border-dashed rounded-xl h-32
          flex flex-col items-center justify-center
          transition-all group
          ${
            disabled || isLoading
              ? 'border-slate-100 bg-slate-50/30 cursor-not-allowed opacity-60'
              : isDragOver
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 cursor-pointer'
                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-500 text-slate-400 cursor-pointer'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {isLoading ? (
          <>
            <Loader2
              size={24}
              className="mb-2 animate-spin text-indigo-600 pointer-events-none"
            />
            <span className="text-sm font-medium text-indigo-600 pointer-events-none">מעלה קבצים...</span>
          </>
        ) : (
          <>
            <Upload
              size={24}
              className={`mb-2 transition-transform pointer-events-none ${!disabled && 'group-hover:scale-110'}`}
            />
            <span className="text-sm font-medium pointer-events-none">גרור קבצים לכאן</span>
            <span className={`text-xs pointer-events-none ${isDragOver ? 'text-indigo-300' : 'text-slate-300 group-hover:text-indigo-300'}`}>
              או לחץ לבחירה
            </span>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isLoading}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
