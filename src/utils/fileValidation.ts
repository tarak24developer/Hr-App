/**
 * File Upload Validation & Security
 * Prevents malicious file uploads and enforces size limits
 */

// Allowed file types by category
const ALLOWED_FILE_TYPES = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain',
    'text/csv'
  ],
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv'
  ],
  avatar: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
};

// Maximum file sizes by category (in bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,      // 5MB
  document: 10 * 1024 * 1024,  // 10MB
  excel: 20 * 1024 * 1024,     // 20MB
  avatar: 2 * 1024 * 1024      // 2MB
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr',
  '.pif', '.msi', '.vbs', '.js', '.jse',
  '.wsf', '.wsh', '.ps1', '.sh', '.app',
  '.deb', '.rpm', '.dmg', '.pkg', '.run'
];

export type FileCategory = 'image' | 'document' | 'excel' | 'avatar';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    size: number;
    type: string;
    name: string;
  };
}

/**
 * Validate a file for upload
 */
export const validateFile = (
  file: File,
  category: FileCategory = 'document'
): FileValidationResult => {
  const details = {
    size: file.size,
    type: file.type,
    name: file.name
  };

  // 1. Check if file exists
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'File is empty or invalid',
      details
    };
  }

  // 2. Check file extension for dangerous files
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type ${fileExtension} is not allowed for security reasons`,
      details
    };
  }

  // 3. Check file name for malicious patterns
  const dangerousPatterns = /[<>:"|?*\x00-\x1f]|^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
  
  if (dangerousPatterns.test(fileNameWithoutExt)) {
    return {
      valid: false,
      error: 'Invalid file name. Please rename the file and try again.',
      details
    };
  }

  // 4. Check file size
  const maxSize = MAX_FILE_SIZES[category];
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit for ${category} files`,
      details
    };
  }

  // 5. Check MIME type
  const allowedTypes = ALLOWED_FILE_TYPES[category];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      details
    };
  }

  // 6. Check if file extension matches MIME type (basic check)
  const mimeToExtension: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv']
  };

  const expectedExtensions = mimeToExtension[file.type];
  if (expectedExtensions && !expectedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension doesn't match the file type. Expected ${expectedExtensions.join(' or ')}, got ${fileExtension}`,
      details
    };
  }

  // All checks passed
  return {
    valid: true,
    details
  };
};

/**
 * Validate multiple files
 */
export const validateFiles = (
  files: File[] | FileList,
  category: FileCategory = 'document'
): { valid: boolean; errors: string[]; validFiles: File[] } => {
  const filesArray = Array.from(files);
  const errors: string[] = [];
  const validFiles: File[] = [];

  for (const file of filesArray) {
    const result = validateFile(file, category);
    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get allowed file extensions for category
 */
export const getAllowedExtensions = (category: FileCategory): string => {
  const extensions: Record<FileCategory, string> = {
    image: '.jpg, .jpeg, .png, .gif, .webp',
    document: '.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv',
    excel: '.xls, .xlsx, .csv',
    avatar: '.jpg, .jpeg, .png, .webp'
  };

  return extensions[category];
};

// Export types and constants for external use
export { MAX_FILE_SIZES, ALLOWED_FILE_TYPES, DANGEROUS_EXTENSIONS };
