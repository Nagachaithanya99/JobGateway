import { AnimatePresence, motion as Motion } from "framer-motion";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiX } from "react-icons/fi";
import PrimaryButton from "./PrimaryButton";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";

function companyAvatar(company) {
  if (company?.logoUrl) return company.logoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || "Company")}&background=DBEAFE&color=2563EB&bold=true`;
}

export default function CompanyDetailsDrawer({
  open,
  company,
  jobs = [],
  applicants = [],
  onClose,
  onSuspend,
  onActivate,
  onResetPlan,
  onUpgradePlan,
}) {
  const isActive = String(company?.status || "").toLowerCase() === "active";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <Motion.div
            className="fixed inset-0 z-[70] bg-slate-900/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <Motion.aside
            className="fixed right-0 top-0 z-[71] h-screen w-full overflow-y-auto border-l border-slate-200 bg-white shadow-2xl sm:w-[620px]"
            initial={{ x: 620 }}
            animate={{ x: 0 }}
            exit={{ x: 620 }}
            transition={{ type: "spring", stiffness: 230, damping: 25 }}
          >
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={companyAvatar(company)}
                    alt={company?.name}
                    className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-[#1F2937]">{company?.name || "Company"}</h3>
                    <p className="text-sm text-slate-500">{company?.category || "-"}</p>
                    <div className="mt-1 flex gap-2">
                      <StatusBadge value={company?.status || "active"} type="account" />
                      <StatusBadge value={company?.plan?.status || "active"} type="planStatus" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB]"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-[#1F2937]">Company Details</h4>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><FiExternalLink /> {company?.website || "-"}</p>
                  <p className="flex items-center gap-2"><FiPhone /> {company?.phone || "-"}</p>
                  <p className="flex items-center gap-2"><FiMail /> {company?.email || "-"}</p>
                  <p className="flex items-center gap-2"><FiMapPin /> {company?.address || "-"}</p>
                  <p><span className="font-semibold text-slate-700">HR:</span> {company?.hrName || "-"} ({company?.hrEmail || "-"})</p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-[#1F2937]">Plan Information</h4>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <p><span className="text-slate-500">Plan:</span> <span className="font-semibold">{company?.plan?.name || "-"}</span></p>
                  <p><span className="text-slate-500">Status:</span> <span className="font-semibold">{company?.plan?.status || "-"}</span></p>
                  <p><span className="text-slate-500">Start:</span> <span className="font-semibold">{company?.plan?.start || "-"}</span></p>
                  <p><span className="text-slate-500">End:</span> <span className="font-semibold">{company?.plan?.end || "-"}</span></p>
                  <p><span className="text-slate-500">Jobs Limit:</span> <span className="font-semibold">{company?.plan?.jobsLimit || 0}</span></p>
                  <p><span className="text-slate-500">Jobs Used:</span> <span className="font-semibold">{company?.plan?.jobsUsed || 0}</span></p>
                  <p><span className="text-slate-500">Apps Limit:</span> <span className="font-semibold">{company?.plan?.appsLimit || 0}</span></p>
                  <p><span className="text-slate-500">Apps Used:</span> <span className="font-semibold">{company?.plan?.appsUsed || 0}</span></p>
                </div>

                <div className="mt-4 space-y-3">
                  <ProgressBar
                    label="Jobs Used vs Limit"
                    used={company?.plan?.jobsUsed}
                    limit={company?.plan?.jobsLimit}
                    color="blue"
                  />
                  <ProgressBar
                    label="Applications Used vs Limit"
                    used={company?.plan?.appsUsed}
                    limit={company?.plan?.appsLimit}
                    color="orange"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#1F2937]">Recent Jobs Posted</h4>
                  <span className="text-xs font-medium text-slate-500">Recent Applications: {applicants.length}</span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Job</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Applications</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length ? (
                        jobs.slice(0, 5).map((job) => (
                          <tr key={job.id} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-700">{job.title}</td>
                            <td className="px-3 py-2"><StatusBadge value={job.status || "active"} type="planStatus" /></td>
                            <td className="px-3 py-2 text-right font-medium text-slate-700">{job.applications || 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-5 text-center text-sm text-slate-500">No recent jobs.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                {isActive ? (
                  <PrimaryButton variant="danger" onClick={onSuspend}>
                    Suspend Company
                  </PrimaryButton>
                ) : (
                  <PrimaryButton variant="outline" onClick={onActivate}>
                    Activate Company
                  </PrimaryButton>
                )}
                <PrimaryButton variant="outline" onClick={onResetPlan}>Reset Plan</PrimaryButton>
                <PrimaryButton variant="primary" className="col-span-2" onClick={onUpgradePlan}>Upgrade Plan</PrimaryButton>
              </section>
            </div>
          </Motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
