import { useEffect, useMemo, useState } from "react";
import { FiCreditCard, FiFileText, FiPercent } from "react-icons/fi";
import { getCompanyBillingMe } from "../../services/companyService.js";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Card({ title, value, hint, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function CompanyBilling() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ subscription: null, billingProfile: null, invoices: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getCompanyBillingMe();
        if (!mounted) return;
        setData({
          subscription: res?.subscription || null,
          billingProfile: res?.billingProfile || null,
          invoices: Array.isArray(res?.invoices) ? res.invoices : [],
        });
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load billing.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const latest = useMemo(() => data.invoices?.[0] || null, [data.invoices]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading billing...</div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A]">Billing & Invoices</h1>
        <p className="mt-1 text-sm text-slate-500">Subscription charges, GST breakdown, and payment history.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchased By</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#2563EB]">
            {String(data.billingProfile?.companyName || "C").trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{data.billingProfile?.companyName || "-"}</p>
            <p className="text-sm text-slate-500">{data.billingProfile?.billingEmail || "-"}</p>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Current Plan" value={data.subscription?.planName || "Starter"} hint={data.subscription?.billingCycle || "monthly"} icon={<FiFileText />} />
        <Card title="Subtotal" value={money(data.subscription?.subtotal || latest?.subtotal || 0)} hint="Plan amount" icon={<FiFileText />} />
        <Card title="GST (18%)" value={money(data.subscription?.gst || latest?.gst || 0)} hint="Tax breakdown" icon={<FiPercent />} />
        <Card title="Total Paid" value={money(data.subscription?.total || latest?.total || 0)} hint={latest?.paymentMethod || "Billing summary"} icon={<FiCreditCard />} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A]">Billing Profile</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</p>
              <p className="mt-2 font-semibold text-slate-900">{data.billingProfile?.companyName || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GST Number</p>
              <p className="mt-2 font-semibold text-slate-900">{data.billingProfile?.gstNumber || "Not added"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing Email</p>
              <p className="mt-2 font-semibold text-slate-900 break-all">{data.billingProfile?.billingEmail || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing Address</p>
              <p className="mt-2 font-semibold text-slate-900">{data.billingProfile?.billingAddress || "Not added"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A]">Latest Invoice</h2>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#fff7ed_100%)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">{latest?.invoiceId || "No invoice yet"}</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{latest?.planName || data.subscription?.planName || "Starter"}</p>
                <p className="mt-1 text-sm text-slate-600">{latest?.paidAt || data.subscription?.startDate || "-"}</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-[#2563EB]">{latest?.paymentMethod || "Billing"}</span>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-600">Plan amount</span><span className="font-semibold text-slate-900">{money(latest?.subtotal || data.subscription?.subtotal || 0)}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">GST</span><span className="font-semibold text-slate-900">{money(latest?.gst || data.subscription?.gst || 0)}</span></div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3"><span className="font-semibold text-slate-900">Total paid</span><span className="text-lg font-bold text-slate-900">{money(latest?.total || data.subscription?.total || 0)}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Transaction ID</span><span className="font-semibold text-slate-900">{latest?.transactionId || "-"}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0F172A]">Invoice History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {["Invoice", "Plan", "Method", "Subtotal", "GST", "Total", "Paid On", "Transaction"].map((item) => (
                  <th key={item} className="px-4 py-3">{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.invoiceId}</td>
                  <td className="px-4 py-3 text-slate-700">{row.planName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.paymentMethod}</td>
                  <td className="px-4 py-3 text-slate-700">{money(row.subtotal)}</td>
                  <td className="px-4 py-3 text-slate-700">{money(row.gst)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{money(row.total)}</td>
                  <td className="px-4 py-3 text-slate-700">{row.paidAt || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.transactionId || "-"}</td>
                </tr>
              ))}
              {!data.invoices.length ? <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No invoices found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
