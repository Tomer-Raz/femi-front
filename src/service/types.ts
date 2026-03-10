/**
 * Azure Blob Storage SAS token response from backend
 */
export interface SasTokenResponse {
  upload_base_url: string;
  path_prefix: string;
  sas_token: string;
  expires_at: string;
}

/**
 * Request to upload a reference table
 */
export interface UploadReferenceTableRequest {
  table_id: string;
  effective_date: string;
}

/**
 * File upload progress information
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * File information from blob storage
 */
export interface FileResponse {
  name: string;
  url: string;
  size: number;
  uploaded_at: string;
  type: string;
}

/**
 * Files grouped by type (hospitalization, ambulatory, er)
 */
export interface FilesByTypeResponse {
  hospitalization: FileResponse[];
  ambulatory: FileResponse[];
  er: FileResponse[];
}

/**
 * Workflow init response from POST /admin/workflow/init
 */
export interface WorkflowStartResponse {
  run_id: number;
  batch_id: number;
  provider_id: number;
  workflow_type: string;
  status: string;
  source_blob_url: string | null;
  message: string;
}

/**
 * Run start response from POST /admin/run/start
 */
export interface RunStartResponse {
  triggered_runs: number[];
  message: string;
}

/**
 * Workflow results response types
 */

export interface SourceFileEntry {
  file_type: string;
  label: string;
  received: boolean;
  original_filename: string | null;
  record_count: number | null;
}

export interface MatchingCheckEntry {
  check_name: string;
  label: string;
  description: string | null;
  passed: boolean | null;
}

export interface HospitalizationRowEntry {
  id: number;
  hospitalization_number: string;
  patient_name: string | null;
  id_number: string;
  referral_number: string | null;
  admission_date: string | null;
  discharge_date: string | null;
  service_code: string | null;
  amount: number | null;
  missing_documents: string[];
  row_status: string;
  is_overridden: boolean;
}

export interface WorkflowResultsResponse {
  provider_id: number;
  provider_name: string;
  provider_code: string;
  period: string;
  workflow_type: string;
  run_id: number;
  run_status: string;
  last_updated: string | null;
  source_files: SourceFileEntry[];
  matching_checks: MatchingCheckEntry[];
  rows: HospitalizationRowEntry[];
  total_count: number;
  patients_count: number;
}

/**
 * Row detail (side panel) types
 */

export interface RowDocumentEntry {
  id: number;
  document_type: string;
  label: string;
  original_filename: string;
}

export interface ValidationStepEntry {
  step_name: string;
  label: string;
  passed: boolean | null;
  description: string | null;
}

export interface ResultUpdateRequest {
  status: string | null;
  override_reason: string | null;
}

export interface RowDetailResponse {
  id: number;
  hospitalization_number: string;
  patient_name: string | null;
  id_number: string;
  referral_number: string | null;
  service_code: string | null;
  amount: number | null;
  admission_date: string | null;
  discharge_date: string | null;
  row_status: string;
  is_overridden: boolean;
  override_reason: string | null;
  override_by: string | null;
  override_date: string | null;
  original_status: string | null;
  match_score: number | null;
  documents: RowDocumentEntry[];
  validation_steps: ValidationStepEntry[];
  algorithm_summary: string | null;
  missing_documents: string[];
}

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  statusCode: number | undefined;
  details: unknown;

  constructor(
    message: string,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
