import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  SasTokenResponse,
  UploadReferenceTableRequest,
  UploadProgress,
  FilesByTypeResponse,
  WorkflowStartResponse,
  RunStartResponse,
  WorkflowResultsResponse,
  RowDetailResponse,
  ResultUpdateRequest,
} from './types';
import { ApiError } from './types';
import type { Hospital, PeriodData } from '../types';

// Base API URL - update this to match your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// API Error handling
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
    const message =
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      'An error occurred';
    throw new ApiError(message, axiosError.response?.status, axiosError.response?.data);
  }
  throw new ApiError('An unexpected error occurred');
};

/**
 * Request SAS token for uploading reference table files
 */
export const getReferencetableSasToken = async (
  request: UploadReferenceTableRequest
): Promise<SasTokenResponse> => {
  try {
    const response = await apiClient.post<SasTokenResponse>(
      '/admin/reference-tables/upload-url',
      request
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Upload a file directly to Azure Blob Storage using SAS token
 */
export const uploadFileToAzure = async (
  file: File,
  sasData: SasTokenResponse,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> => {
  try {
    const uploadUrl = `${sasData.upload_base_url}/${sasData.path_prefix}${file.name}?${sasData.sas_token}`;

    await axios.put(uploadUrl, file, {
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
        if (onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(
        `Failed to upload file to Azure: ${error.message}`,
        error.response?.status
      );
    }
    throw new ApiError('Failed to upload file to Azure');
  }
};

/**
 * Complete reference table upload flow:
 * 1. Get SAS token from backend
 * 2. Upload file to Azure Blob Storage
 * 3. Return success
 */
export const uploadReferenceTable = async (
  tableId: string,
  effectiveDate: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> => {
  try {
    // Step 1: Get SAS token from backend
    const sasData = await getReferencetableSasToken({
      table_id: tableId,
      effective_date: effectiveDate,
    });

    // Step 2: Upload file directly to Azure
    await uploadFileToAzure(file, sasData, onProgress);

    // File uploaded successfully
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload reference table');
  }
};

/**
 * Generic function to get SAS token for any directory path
 * Can be used for other upload scenarios (hospitals, etc.)
 */
export const getDirectorySasToken = async (
  endpoint: string,
  params: Record<string, string>
): Promise<SasTokenResponse> => {
  try {
    const response = await apiClient.post<SasTokenResponse>(endpoint, params);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Upload multiple files to Azure Blob Storage
 */
export const uploadMultipleFilesToAzure = async (
  files: File[],
  sasData: SasTokenResponse,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<void> => {
  try {
    const uploadPromises = files.map((file, index) =>
      uploadFileToAzure(file, sasData, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      })
    );

    await Promise.all(uploadPromises);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to upload files');
  }
};

/**
 * Date utility functions for format conversions
 */

/**
 * Parse MM/YYYY format to separate year and month
 * @param monthStr - Month string in MM/YYYY format (e.g., "06/2025")
 * @returns Object with year and month strings
 */
function parseMonthYear(monthStr: string): { year: string; month: string } {
  const [month, year] = monthStr.split('/');
  return { year, month };
}

/**
 * Convert MM/YYYY to YYYY-MM format
 * @param monthStr - Month string in MM/YYYY format (e.g., "06/2025")
 * @returns String in YYYY-MM format (e.g., "2025-06")
 */
function toYYYYMM(monthStr: string): string {
  const { year, month } = parseMonthYear(monthStr);
  return `${year}-${month}`;
}

/**
 * Format year and month to MM/YYYY
 * @param year - Year number
 * @param month - Month string (MM format)
 * @returns String in MM/YYYY format
 */
function formatMonthYear(year: number, month: string): string {
  return `${month}/${year}`;
}

/**
 * Dashboard API Functions
 */

/**
 * Get all providers that have runs, with their latest run info.
 * Used by the dashboard page.
 */
export const getDashboardProviders = async (): Promise<Hospital[]> => {
  try {
    const response = await apiClient.get<Hospital[]>('/dashboard/providers');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get all periods for a specific provider (dashboard drilldown).
 * Used when clicking a hospital card on the dashboard.
 */
export const getDashboardProviderPeriods = async (
  providerId: number
): Promise<{ provider_id: number; provider_name: string; provider_code: string; periods: PeriodData[] }> => {
  try {
    const response = await apiClient.get(`/dashboard/providers/${providerId}/periods`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Hospital Management API Functions
 */

/**
 * Get all hospitals from blob storage
 */
export const getHospitalsFromApi = async (): Promise<Hospital[]> => {
  try {
    const response = await apiClient.get<Hospital[]>('/admin/providers');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new hospital
 */
export const createHospitalApi = async (
  name: string,
  code: string
): Promise<Hospital> => {
  try {
    const response = await apiClient.post<Hospital>('/admin/providers', {
      name,
      code,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a hospital and all its contents
 */
export const deleteHospitalApi = async (hospitalName: string): Promise<void> => {
  try {
    await apiClient.delete(`/admin/providers/${hospitalName}`);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Month Management API Functions
 */

/**
 * Get all months for a hospital
 */
export const getMonthsFromApi = async (
  hospitalName: string
): Promise<PeriodData[]> => {
  try {
    const response = await apiClient.get<PeriodData[]>(
      `/admin/providers/${hospitalName}/periods`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new month folder
 */
export const createMonthApi = async (
  hospitalName: string,
  month: string
): Promise<PeriodData> => {
  try {
    const response = await apiClient.post<PeriodData>(
      `/admin/providers/${hospitalName}/periods`,
      { period: month }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a month folder and all its contents
 */
export const deleteMonthApi = async (
  hospitalName: string,
  year: string,
  month: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `/admin/providers/${hospitalName}/periods/${year}/${month}`
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * File Management API Functions
 */

/**
 * Get all files grouped by type for a specific month
 */
export const getFilesByType = async (
  hospitalName: string,
  year: string,
  month: string
): Promise<FilesByTypeResponse> => {
  try {
    const response = await apiClient.get<FilesByTypeResponse>(
      `/admin/providers/${hospitalName}/periods/${year}/${month}/files`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a single file
 */
export const deleteFileApi = async (
  hospitalName: string,
  year: string,
  month: string,
  workflowType: string,
  fileName: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `/admin/providers/${hospitalName}/periods/${year}/${month}/files/${workflowType}/${encodeURIComponent(fileName)}`
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Workflow API Functions
 */

/** Map frontend category names to backend workflow type codes */
const CATEGORY_TO_WORKFLOW: Record<string, string> = {
  hospitalization: 'HSP',
  ambulatory: 'AMB',
  er: 'ER',
};

/**
 * Start a workflow run for a specific provider/period/workflow type.
 * Creates Run + BatchJob records in the database.
 */
export const startWorkflowApi = async (
  providerId: number,
  year: number,
  month: number,
  categoryId: string
): Promise<WorkflowStartResponse> => {
  const workflowType = CATEGORY_TO_WORKFLOW[categoryId] ?? categoryId;
  try {
    const response = await apiClient.post<WorkflowStartResponse>(
      '/admin/workflow/init',
      {
        provider_id: providerId,
        year,
        month,
        workflow_type: workflowType,
      }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Trigger the E2E processing pipeline for all pending runs of a provider-period.
 * Called when admin presses "הפעל הרצה".
 */
export const startRunApi = async (
  providerId: number,
  year: number,
  month: number
): Promise<RunStartResponse> => {
  try {
    const response = await apiClient.post<RunStartResponse>(
      '/admin/run/start',
      {
        provider_id: providerId,
        year,
        month,
      }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get workflow results for a specific provider/period/workflow.
 * Used by the MonthlyResults page after clicking a completed period.
 */
export const getDashboardWorkflowResults = async (
  providerCode: string,
  periodId: number,
  workflow: string
): Promise<WorkflowResultsResponse> => {
  try {
    const response = await apiClient.get<WorkflowResultsResponse>(
      `/dashboard/providers/${providerCode}/periods/${periodId}/results/${workflow}`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get detail data for a single hospitalization row (side panel).
 */
export const getRowDetail = async (
  providerCode: string,
  periodId: number,
  workflow: string,
  rowProcessId: number
): Promise<RowDetailResponse> => {
  try {
    const response = await apiClient.get<RowDetailResponse>(
      `/dashboard/providers/${providerCode}/periods/${periodId}/results/${workflow}/${rowProcessId}`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update row status (override) for a specific row.
 */
export const updateRowDetail = async (
  providerCode: string,
  periodId: number,
  workflow: string,
  rowProcessId: number,
  updateRequest: ResultUpdateRequest
): Promise<RowDetailResponse> => {
  try {
    const response = await apiClient.patch<RowDetailResponse>(
      `/dashboard/providers/${providerCode}/periods/${periodId}/results/${workflow}/${rowProcessId}`,
      updateRequest
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  uploadReferenceTable,
  getReferencetableSasToken,
  uploadFileToAzure,
  getDirectorySasToken,
  uploadMultipleFilesToAzure,
  // Dashboard APIs
  getDashboardProviders,
  getDashboardProviderPeriods,
  // Hospital APIs
  getHospitalsFromApi,
  createHospitalApi,
  deleteHospitalApi,
  // Month APIs
  getMonthsFromApi,
  createMonthApi,
  deleteMonthApi,
  // File APIs
  getFilesByType,
  deleteFileApi,
  // Workflow APIs
  startWorkflowApi,
  startRunApi,
  getDashboardWorkflowResults,
  getRowDetail,
  updateRowDetail,
  parseMonthYear,
  toYYYYMM,
  formatMonthYear,
};
