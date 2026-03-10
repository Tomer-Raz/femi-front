/**
 * File utility functions for file upload and validation
 */

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
};

/**
 * Validate if file type is accepted
 */
export const isValidFileType = (file: File, acceptedTypes: string[]): boolean => {
  const extension = getFileExtension(file.name);
  return acceptedTypes.includes(extension);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Format file size to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file type category based on extension
 */
export const getFileTypeCategory = (filename: string): 'pdf' | 'txt' | 'tiff' | 'csv' | 'excel' | 'unknown' => {
  const extension = getFileExtension(filename);

  if (extension === '.pdf') return 'pdf';
  if (extension === '.txt') return 'txt';
  if (extension === '.tif' || extension === '.tiff') return 'tiff';
  if (extension === '.csv') return 'csv';
  if (extension === '.xlsx' || extension === '.xls') return 'excel';

  return 'unknown';
};

/**
 * Validate file with detailed error messages
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (
  file: File,
  acceptedTypes: string[],
  maxSizeInMB: number
): FileValidationResult => {
  // Check file type
  if (!isValidFileType(file, acceptedTypes)) {
    const acceptedTypesStr = acceptedTypes.join(', ');
    return {
      isValid: false,
      error: `סוג קובץ לא נתמך. נא להעלות קבצים מסוג: ${acceptedTypesStr}`
    };
  }

  // Check file size
  if (!isValidFileSize(file, maxSizeInMB)) {
    return {
      isValid: false,
      error: `הקובץ גדול מדי. גודל מקסימלי: ${maxSizeInMB}MB`
    };
  }

  return { isValid: true };
};
