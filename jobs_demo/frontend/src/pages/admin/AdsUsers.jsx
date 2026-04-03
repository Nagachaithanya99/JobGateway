import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiImage,
  FiPlus,
  FiPlayCircle,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import { showSweetConfirm, showSweetPrompt } from "../../utils/sweetAlert.js";

import {
  adminDeleteAdPlan,
  adminGetAdsCenter,
  adminSaveAdPlan,
  adminUpdateAdStatus,
  adminUpdateAdsPlanRequest,
} from "../../services/adminService";

function statusPill(status) {
  const value = String(status || "").toLowerCase();
  if (value === "approved" || value === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "rejected" || value === "archived") return "border-rose-200 bg-rose-50 text-rose-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function shortDate(value) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().slice(0, 10);
}

function StatCard({ icon, label, value, hint, tone }) {
  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
          <p className="mt-2 text-sm font-medium text-slate-600">{hint}</p>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-xl text-slate-700">
          {icon}
        </span>
      </div>
    </div>
  );
}

function renderMedia(ad) {
  const type = String(ad.mediaResourceType || "").toLowerCase();
  if (type === "video") {
    return (
      <video
        src={ad.mediaUrl}
        className="h-40 w-full rounded-[20px] object-cover"
        controls
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={ad.mediaUrl}
      alt={ad.title}
      className="h-40 w-full rounded-[20px] object-cover"
      loading="lazy"
    />
  );
}

export default function AdsUsers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [ads, setAds] = useState([]);
  const [plans, setPlans] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: 999,
    durationDays: 30,
    description: "",
    active: true,
    highlight: false,
    mediaTypes: ["banner", "video", "pamphlet", "other"],
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await adminGetAdsCenter();
        if (!mounted) return;
        setRequests(Array.isArray(data?.requests) ? data.requests : []);
        setAds(Array.isArray(data?.ads) ? data.ads : []);
        setPlans(Array.isArray(data?.plans) ? data.plans : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load ads center.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const pendingRequests = requests.filter((row) => row.status === "pending").length;
    const approvedUsers = requests.filter((row) => row.status === "approved").length;
    const activeAds = ads.filter((row) => row.status === "active").length;
    const mediaMix = ads.filter((row) => row.mediaType === "video").length;
    return { pendingRequests, approvedUsers, activeAds, mediaMix };
  }, [requests, ads]);

  const openPlanCreate = () => {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      price: 999,
      durationDays: 30,
      description: "",
      active: true,
      highlight: false,
      mediaTypes: ["banner", "video", "pamphlet", "other"],
    });
    setPlanOpen(true);
  };

  const openPlanEdit = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || "",
      price: plan.price || 0,
      durationDays: plan.durationDays || 30,
      description: plan.description || "",
      active: !!plan.active,
      highlight: !!plan.highlight,
      mediaTypes: Array.isArray(plan.mediaTypes) && plan.mediaTypes.length ? plan.mediaTypes : ["banner", "video", "pamphlet", "other"],
    });
    setPlanOpen(true);
  };

  const savePlan = async () => {
    try {
      const res = await adminSaveAdPlan({
        ...(editingPlan || {}),
        ...planForm,
        id: editingPlan?.id,
      });
      const next = res?.plan;
      if (!next) return;
      setPlans((prev) => {
        const exists = prev.some((item) => item.id === next.id);
        return exists ? prev.map((item) => (item.id === next.id ? next : item)) : [next, ...prev];
      });
      setPlanOpen(false);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to save ad plan.");
    }
  };

  const removePlan = async (plan) => {
    const ok = await showSweetConfirm({
      title: "Delete Ad Plan?",
      text: `Delete "${plan.name}" ad plan?`,
      confirmButtonText: "Delete",
      tone: "warning",
    });
    if (!ok) return;
    try {
      await adminDeleteAdPlan(plan.id);
      setPlans((prev) => prev.filter((item) => item.id !== plan.id));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete ad plan.");
    }
  };

  const onRequestStatus = async (row, status) => {
    try {
      setBusyId(row.id);
      const res = await adminUpdateAdsPlanRequest(row.id, status);
      if (!res?.request) return;
      setRequests((prev) => prev.map((item) => (item.id === row.id ? res.request : item)));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update request.");
    } finally {
      setBusyId("");
    }
  };

  const onAdStatus = async (row, status) => {
    const rejectedReason =
      status === "rejected"
        ? String(
            (
              await showSweetPrompt({
                title: "Reason for Rejection",
                inputValue: row.rejectedReason || "",
                inputPlaceholder: "Enter rejection reason",
                confirmButtonText: "Save",
              })
            ).value || "",
          )
        : "";
    try {
      setBusyId(row.id);
      const res = await adminUpdateAdStatus(row.id, { status, rejectedReason });
      if (!res?.ad) return;
      setAds((prev) => prev.map((item) => (item.id === row.id ? res.ad : item)));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update ad.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_45%,#eff6ff_100%)] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ea580c]">Ads Command Center</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Approve ad buyers and manage home-page campaigns</h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
          Review plan-buy requests, activate ad-posting access, and keep sponsored media on the student home page clean and current.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FiClock />} label="Pending Requests" value={stats.pendingRequests} hint="Need approval before posting" tone="border-amber-100 bg-amber-50/60" />
        <StatCard icon={<FiCheckCircle />} label="Approved Users" value={stats.approvedUsers} hint="Students allowed to post ads" tone="border-emerald-100 bg-emerald-50/60" />
        <StatCard icon={<FiGrid />} label="Live Ads" value={stats.activeAds} hint="Currently visible on home" tone="border-blue-100 bg-blue-50/60" />
        <StatCard icon={<FiPlayCircle />} label="Video Ads" value={stats.mediaMix} hint="Rich campaigns running" tone="border-fuchsia-100 bg-fuchsia-50/60" />
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900">Ads Users</h2>
          <p className="text-sm font-medium text-slate-500">Razorpay purchases are auto-verified. Manual requests can still be approved here.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => {
                const initial = String(row.userName || "U").charAt(0).toUpperCase();
                return (
                  <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-blue-100 text-lg font-black text-slate-800">
                          {initial}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{row.userName}</p>
                          <p className="text-xs font-medium text-slate-500">{row.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">{row.planName}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{row.amount || "Contact admin"}</td>
                    <td className="px-4 py-4 text-slate-600">{row.note || row.orderId || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{shortDate(row.requestedAt)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusPill(row.status)}`}>
                        {row.status}
                      </span>
                      {row.paymentId ? <p className="mt-2 text-xs text-slate-500">Payment: {row.paymentId}</p> : null}
                      {row.expiresAt ? <p className="mt-2 text-xs text-slate-500">Expires {shortDate(row.expiresAt)}</p> : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id || row.status === "approved" || Boolean(row.paymentStatus)}
                          onClick={() => onRequestStatus(row, "approved")}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id || row.status === "rejected" || Boolean(row.paymentStatus)}
                          onClick={() => onRequestStatus(row, "rejected")}
                          className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!requests.length && !loading ? (
                <tr className="border-t border-slate-100">
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No ad plan requests found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">Ad Plans</h2>
            <p className="text-sm font-medium text-slate-500">Create the plans students can buy before posting ads.</p>
          </div>
          <button type="button" onClick={openPlanCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white">
            <FiPlus /> Add Ad Plan
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-900">{plan.name}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">Rs {plan.price}</p>
                  <p className="text-sm font-medium text-slate-500">/{plan.durationDays} days</p>
                </div>
                {plan.highlight ? <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-[#F97316]">Popular</span> : null}
              </div>
              <p className="mt-3 text-sm text-slate-600">{plan.description || "Student home-page ad plan."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(plan.mediaTypes || []).map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button type="button" onClick={() => openPlanEdit(plan)} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-[#2563EB]">
                  <FiEdit2 /> Edit
                </button>
                <button type="button" onClick={() => removePlan(plan)} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600">
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
          {!plans.length && !loading ? <div className="col-span-full rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No ad plans configured yet.</div> : null}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Ads Gallery</h2>
            <p className="text-sm font-medium text-slate-500">Modern card view for the media currently submitted by users.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <article
              key={ad.id}
              className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
            >
              <div className="relative overflow-hidden bg-slate-100 p-3">
                {renderMedia(ad)}
                <span className={`absolute left-5 top-5 inline-flex rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em] ${statusPill(ad.status)}`}>
                  {ad.mediaType}
                </span>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-900">{ad.title}</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">By {ad.userName}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusPill(ad.status)}`}>
                    {ad.status}
                  </span>
                </div>

                <p className="text-sm leading-6 text-slate-600">{ad.description || "No description provided."}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Audience</p>
                    <p className="mt-1 font-semibold text-slate-800">{ad.audience || "Students"}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Created</p>
                    <p className="mt-1 font-semibold text-slate-800">{shortDate(ad.createdAt)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-sm">
                  <p className="font-bold text-slate-700">CTA</p>
                  <p className="mt-1 text-slate-600">{ad.ctaLabel || "Learn More"}</p>
                  <p className="mt-2 break-all text-xs text-blue-600">{ad.targetUrl || "No external link"}</p>
                </div>

                {ad.rejectedReason ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {ad.rejectedReason}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === ad.id || ad.status === "active"}
                    onClick={() => onAdStatus(ad, "active")}
                    className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    disabled={busyId === ad.id || ad.status === "rejected"}
                    onClick={() => onAdStatus(ad, "rejected")}
                    className="flex-1 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busyId === ad.id || ad.status === "archived"}
                    onClick={() => onAdStatus(ad, "archived")}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!ads.length && !loading ? (
            <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No ads have been posted yet.
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title={editingPlan ? "Edit Ad Plan" : "Add Ad Plan"}
        footer={<><button type="button" onClick={() => setPlanOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={savePlan} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Save Plan</button></>}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Plan Name<input value={planForm.name} onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none" /></label>
          <label className="text-sm font-semibold text-slate-700">Price<input type="number" value={planForm.price} onChange={(e) => setPlanForm((prev) => ({ ...prev, price: Number(e.target.value || 0) }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none" /></label>
          <label className="text-sm font-semibold text-slate-700">Duration Days<input type="number" value={planForm.durationDays} onChange={(e) => setPlanForm((prev) => ({ ...prev, durationDays: Number(e.target.value || 30) }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none" /></label>
          <label className="text-sm font-semibold text-slate-700">Highlight<select value={planForm.highlight ? "yes" : "no"} onChange={(e) => setPlanForm((prev) => ({ ...prev, highlight: e.target.value === "yes" }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none"><option value="no">No</option><option value="yes">Yes</option></select></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">Description<textarea rows={4} value={planForm.description} onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none" /></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">Media Types (comma separated)<input value={(planForm.mediaTypes || []).join(", ")} onChange={(e) => setPlanForm((prev) => ({ ...prev, mediaTypes: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none" /></label>
        </div>
      </Modal>
    </div>
  );
}
