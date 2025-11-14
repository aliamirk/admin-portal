import axios from "axios";

// Base API URL
const BASE_URL = "http://3.7.253.28:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// -------------------------------- Interfaces -------------------------------------------

export interface StatusHistoryItem {
  status: string;
  changed_at: string; // ISO datetime
  changed_by: string;
}

export interface GatePassOut {
  id: string;
  number: string;
  person_name: string;
  description: string;
  created_by: string;
  is_returnable: boolean;
  status: string;
  status_history: StatusHistoryItem[];
  created_at: string; // ISO datetime
  approved_at: string | null;
  exit_photo_id: string | null;
  return_photo_id: string | null;
  exit_time: string | null;
  return_time: string | null;
  qr_code_url: string | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// -------------------------------- Admin API Functions -------------------------------------------

// 1. Get Pending Gatepasses
export const getPendingGatepasses = async (): Promise<GatePassOut[]> => {
  const response = await api.get<GatePassOut[]>("/admin/gatepass/pending");
  return response.data;
};

// 2. Get Gatepass Detail
export const getGatepassDetail = async (passId: string): Promise<GatePassOut> => {
  const response = await api.get<GatePassOut>(`/admin/gatepass/${passId}`, {
    params: { pass_id: passId },
  });
  return response.data;
};

// 3. Approve Gatepass
export const approveGatepass = async (passNumber: string): Promise<GatePassOut> => {
  const response = await api.post<GatePassOut>(`/admin/gatepass/${passNumber}/approve`);
  return response.data;
};

// 4. Reject Gatepass
export const rejectGatepass = async (passNumber: string): Promise<GatePassOut> => {
  const response = await api.post<GatePassOut>(`/admin/gatepass/${passNumber}/reject`);
  return response.data;
};

// 5. List All Gatepasses
export const listAllGatepasses = async (status?: string | null): Promise<GatePassOut[]> => {
  const response = await api.get<GatePassOut[]>("/hr/gatepass/list", {
    params: status ? { status } : {},
  });
  return response.data;
};

// 6. Print Gatepass
export const printGatepass = async (passNumber: string): Promise<Blob> => {
  const response = await api.get(`/admin/gatepass/${passNumber}/print`, {
    responseType: "blob",
  });
  return response.data;
};
