"use client";

import React, { useState, useEffect } from "react";
import {
  getPendingGatepasses,
  getGatepassDetail,
  approveGatepass,
  rejectGatepass,
  listAllGatepasses,
  printGatepass,
  GatePassOut,
  getGatePassPhotoFile,
} from "../../backend/admin";
import useAuthCheck from "@/lib/useAuthCheck";

// Simple status/toast component -----------------------
function Message({ type, text }: { type: "error" | "success" | "info"; text: string | null }) {
  if (!text) return null;
  const base = "px-4 py-3 rounded-lg text-sm max-w-full shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300";
  const cls =
    type === "error"
      ? "bg-red-50/90 text-red-800 border border-red-200"
      : type === "success"
      ? "bg-emerald-50/90 text-emerald-800 border border-emerald-200"
      : "bg-green-50/90 text-green-800 border border-green-200";
  return <div className={`${base} ${cls}`}>{text}</div>;
}

// Confirmation Modal
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  type = "approve",
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "approve" | "reject";
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className={`p-6 border-b-2 ${type === "approve" ? "border-green-100 bg-gradient-to-r from-emerald-50 to-green-50" : "border-red-100 bg-gradient-to-r from-red-50 to-pink-50"}`}>
          <h3 className={`text-xl font-bold ${type === "approve" ? "text-emerald-800" : "text-red-800"}`}>
            {title}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-lg text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 ${
                type === "approve"
                  ? "bg-gradient-to-r from-emerald-600 to-green-600"
                  : "bg-gradient-to-r from-red-600 to-pink-600"
              }`}
            >
              {type === "approve" ? "✓ Approve" : "✗ Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status History Modal
function StatusHistoryModal({ history, onClose }: { history?: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b-2 border-green-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-green-50">
          <h3 className="text-xl font-bold text-emerald-800">Status History</h3>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
          >
            ✕ Close
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {history && history.length > 0 ? (
            <div className="space-y-3">
              {history.map((h, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-gradient-to-br from-white to-green-50/30 border-2 border-green-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                      {h.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(h.changed_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Changed by: <span className="font-medium">{h.changed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No history available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({
  imageId,
  onClose,
}: {
  imageId: string;
  onClose: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchImage() {
      try {
        const blob = await getGatePassPhotoFile(imageId);

        if (!isMounted) return;

        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (error) {
        console.error("Failed to load image:", error);
        setImageUrl(null);
      }
    }

    fetchImage();

    return () => {
      isMounted = false;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageId]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b-2 border-green-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-green-50">
          <h3 className="text-lg font-bold text-emerald-800">Image Preview</h3>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 flex items-center justify-center bg-gray-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Gatepass photo"
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-gray-500 text-center">
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%239ca3af' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E"
                alt="Fallback"
                className="rounded-md"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Admin Gatepass Card Component
function AdminGatepassCard({
  pass,
  onApprove,
  onReject,
  onPrint,
}: {
  pass: GatePassOut;
  onApprove: (pass: GatePassOut) => void;
  onReject: (pass: GatePassOut) => void;
  onPrint: (pass: GatePassOut) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showExitPhoto, setShowExitPhoto] = useState(false);
  const [showReturnPhoto, setShowReturnPhoto] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "Not Available";
    if (typeof value === "string" && value.includes("T")) {
      return new Date(value).toLocaleString();
    }
    return value;
  };

  const isPending = pass.status === "pending";

  return (
    <>
      <article className="bg-gradient-to-br from-white to-green-50/30 rounded-xl shadow-md border-2 border-green-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Compact Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-green-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold mb-1.5">
                {pass.number}
              </div>
              <h3 className="font-bold text-lg text-gray-800 truncate">{pass.person_name}</h3>
              <p className="text-xs text-gray-600 mt-1">{pass.description}</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                pass.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : pass.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : pass.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {pass.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Compact Body */}
        <div className="p-4 space-y-3">
          {/* Key Info in Compact Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-white border border-green-100">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Created</div>
              <p className="text-gray-700 leading-tight">{new Date(pass.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="p-2 rounded bg-white border border-green-100">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Returnable</div>
              <p className="text-gray-700">{pass.is_returnable ? "✓ Yes" : "✗ No"}</p>
            </div>

            {pass.exit_time && (
              <div className="p-2 rounded bg-white border border-green-100">
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Exit</div>
                <p className="text-gray-700 leading-tight">{new Date(pass.exit_time).toLocaleString()}</p>
              </div>
            )}

            {pass.return_time && (
              <div className="p-2 rounded bg-white border border-green-100">
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Return</div>
                <p className="text-gray-700 leading-tight">{new Date(pass.return_time).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Photos - Compact Row */}
          {(pass.exit_photo_id || pass.return_photo_id) && (
            <div className="flex gap-2">
              {pass.exit_photo_id && (
                <button
                  onClick={() => setShowExitPhoto(true)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Exit Photo
                </button>
              )}
              {pass.return_photo_id && (
                <button
                  onClick={() => setShowReturnPhoto(true)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Return Photo
                </button>
              )}
            </div>
          )}

          {/* Collapsible Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-1"
          >
            {showDetails ? "▲ Hide Details" : "▼ Show Details"}
          </button>

          {showDetails && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2 rounded bg-white border border-green-100">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Created By</div>
                  <p className="text-gray-700">{formatValue(pass.created_by)}</p>
                </div>
                
                <div className="p-2 rounded bg-white border border-green-100">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Approved At</div>
                  <p className="text-gray-700">{formatValue(pass.approved_at)}</p>
                </div>

                <div className="p-2 rounded bg-white border border-green-100">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">QR Code</div>
                  <p className="text-gray-700">{formatValue(pass.qr_code_url)}</p>
                </div>

                <div className="p-2 rounded bg-white border border-green-100">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Gatepass ID</div>
                  <p className="text-gray-700 font-mono text-[10px] break-all">{pass.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Compact */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setShowHistory(true)}
              className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              📋 History
            </button>
            <button
              onClick={() => onPrint(pass)}
              className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              🖨️ Print
            </button>
          </div>

          {/* Admin Actions - Only show for pending */}
          {isPending && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onApprove(pass)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => onReject(pass)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      </article>

      {/* Modals */}
      {showHistory && <StatusHistoryModal history={pass.status_history} onClose={() => setShowHistory(false)} />}
      {showExitPhoto && pass.exit_photo_id && (
        <ImagePreviewModal imageId={pass.exit_photo_id} onClose={() => setShowExitPhoto(false)} />
      )}
      {showReturnPhoto && pass.return_photo_id && (
        <ImagePreviewModal imageId={pass.return_photo_id} onClose={() => setShowReturnPhoto(false)} />
      )}
    </>
  );
}

export default function AdminGatepass() {
    useAuthCheck(["admin"]);
  const [passes, setPasses] = useState<GatePassOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [numberFilter, setNumberFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: "approve" | "reject";
    pass: GatePassOut | null;
  }>({ show: false, type: "approve", pass: null });

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  // Fetch all gatepasses
  async function fetchGatepasses(status?: string) {
    setLoading(true);
    setPasses(null);
    try {
      const res = await listAllGatepasses(status || null);
      setPasses(res || []);
      setMessage({ type: "success", text: `Loaded ${res.length} gatepass(es)` });
    } catch (err: any) {
      console.error(err);
      const text = err?.response?.data?.detail || err?.message || "Failed to fetch gatepasses";
      setMessage({ type: "error", text: String(text) });
    } finally {
      setLoading(false);
    }
  }

  // Fetch gatepass by number
  async function fetchByNumber(number: string) {
    if (!number || number.trim().length === 0) {
      setMessage({ type: "error", text: "Please provide a gatepass number" });
      return;
    }
    setLoading(true);
    setPasses(null);
    try {
      const res = await getGatepassDetail(number.trim());
      setPasses([res]);
      setMessage({ type: "success", text: `Found gatepass: ${res.number}` });
    } catch (err: any) {
      console.error(err);
      const text = err?.response?.data?.detail || err?.message || "Failed to fetch gatepass";
      setMessage({ type: "error", text: String(text) });
    } finally {
      setLoading(false);
    }
  }

  // Handle print
  async function handlePrint(pass: GatePassOut) {
    try {
      setMessage({ type: "info", text: "Preparing download..." });
      const blob = await printGatepass(pass.number);
      const filename = `${pass.number}.pdf`;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: "success", text: `Downloaded ${filename}` });
    } catch (err: any) {
      console.error(err);
      const text = err?.response?.data?.detail || err?.message || "Print failed";
      setMessage({ type: "error", text: String(text) });
    }
  }

  // Handle approve
  async function handleApprove(pass: GatePassOut) {
    try {
      setMessage({ type: "info", text: "Approving gatepass..." });
      const res = await approveGatepass(pass.number);
      setMessage({ type: "success", text: `Gatepass ${res.number} approved successfully!` });
      // Refresh the list
      fetchGatepasses(statusFilter);
    } catch (err: any) {
      console.error(err);
      const text = err?.response?.data?.detail || err?.message || "Approval failed";
      setMessage({ type: "error", text: String(text) });
    }
  }

  // Handle reject
  async function handleReject(pass: GatePassOut) {
    try {
      setMessage({ type: "info", text: "Rejecting gatepass..." });
      const res = await rejectGatepass(pass.number);
      setMessage({ type: "success", text: `Gatepass ${res.number} rejected successfully!` });
      // Refresh the list
      fetchGatepasses(statusFilter);
    } catch (err: any) {
      console.error(err);
      const text = err?.response?.data?.detail || err?.message || "Rejection failed";
      setMessage({ type: "error", text: String(text) });
    }
  }

  // Apply filters
  function applyFilters() {
    if (numberFilter.trim()) {
      fetchByNumber(numberFilter);
    } else {
      fetchGatepasses(statusFilter || undefined);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 mb-4">
            <span className="text-emerald-800 font-semibold text-sm">ADMIN PORTAL</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
            Gatepass Management
          </h1>
          <p className="text-base text-gray-600 mt-3">Review, approve and manage all gatepasses</p>
        </header>

        <section className="mb-6 flex justify-center">
          <Message type={message?.type ?? "info"} text={message?.text ?? null} />
        </section>

        <main className="space-y-6">
          {/* Controls Section */}
          <section className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-green-100">
            <div className="flex flex-col gap-4">
              {/* Main Action Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => fetchGatepasses()}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  📋 View All Gatepasses
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 font-medium text-emerald-800"
                >
                  🔍 {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="p-5 rounded-lg bg-gray-50 border-2 border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <h3 className="font-semibold text-gray-700 mb-3">Filter Gatepasses</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-lg border-2 border-gray-00 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 px-4 py-2.5 text-sm transition-all duration-200 outline-none"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="returned">Returned</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Number Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Number</label>
                      <input
                        type="text"
                        value={numberFilter}
                        onChange={(e) => setNumberFilter(e.target.value)}
                        placeholder="e.g. GP-2025-0001"
                        className="w-full rounded-lg border-2 border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 px-4 py-2.5 text-sm transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setNumberFilter("");
                        setPasses(null);
                      }}
                      className="px-5 py-2 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium text-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyFilters}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Results Section */}
          <section>
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
                <p className="text-sm text-gray-500 mt-4">Loading gatepasses...</p>
              </div>
            )}

            {!loading && passes && passes.length === 0 && (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-green-100">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-xl text-gray-600 font-medium">No gatepasses found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or create a new gatepass</p>
              </div>
            )}

            {!loading && passes && passes.length > 0 && (
              <div className="space-y-6">
                {passes.map((pass) => (
                  <AdminGatepassCard
                    key={pass.id}
                    pass={pass}
                    onApprove={(p) =>
                      setConfirmModal({ show: true, type: "approve", pass: p })
                    }
                    onReject={(p) =>
                      setConfirmModal({ show: true, type: "reject", pass: p })
                    }
                    onPrint={handlePrint}
                  />
                ))}
              </div>
            )}
          </section>

          <footer className="text-xs text-gray-500 text-center py-4">
            Admin Portal — Manage gatepasses efficiently
          </footer>
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && confirmModal.pass && (
        <ConfirmModal
          title={confirmModal.type === "approve" ? "Approve Gatepass" : "Reject Gatepass"}
          message={`Are you sure you want to ${confirmModal.type} gatepass ${confirmModal.pass.number} for ${confirmModal.pass.person_name}?`}
          type={confirmModal.type}
          onConfirm={() => {
            if (confirmModal.type === "approve") {
              handleApprove(confirmModal.pass!);
            } else {
              handleReject(confirmModal.pass!);
            }
            setConfirmModal({ show: false, type: "approve", pass: null });
          }}
          onCancel={() => setConfirmModal({ show: false, type: "approve", pass: null })}
        />
      )}
    </div>
  );
}