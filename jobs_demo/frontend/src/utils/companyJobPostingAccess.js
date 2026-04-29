import { showSweetAlert } from "./sweetAlert.js";

const UNLIMITED_JOB_LIMIT = 999999;

export function getCompanyJobPostingAccess(subscription = null) {
  const planName = String(subscription?.planName || "Starter").trim() || "Starter";
  const status = String(subscription?.status || "inactive").toLowerCase();
  const jobsLimit = Number(subscription?.jobsLimit ?? 0);
  const jobsUsed = Number(subscription?.jobsUsed ?? 0);
  const isUnlimited = jobsLimit >= UNLIMITED_JOB_LIMIT;
  const remainingJobs = isUnlimited ? UNLIMITED_JOB_LIMIT : Math.max(0, jobsLimit - jobsUsed);

  if (status !== "active") {
    return {
      allowed: false,
      code: "SUBSCRIPTION_REQUIRED",
      planName,
      status,
      jobsLimit,
      jobsUsed,
      remainingJobs: 0,
      title: "Buy Subscription",
      message: "Buy a subscription to post jobs.",
      confirmButtonText: "Buy Subscription",
    };
  }

  if (!isUnlimited && jobsUsed >= jobsLimit) {
    return {
      allowed: false,
      code: "JOB_LIMIT_REACHED",
      planName,
      status,
      jobsLimit,
      jobsUsed,
      remainingJobs: 0,
      title: "Upgrade Subscription",
      message: `Your ${planName} plan limit is over (${jobsUsed}/${jobsLimit} jobs used). Upgrade your subscription to post more jobs.`,
      confirmButtonText: "Upgrade Plan",
    };
  }

  return {
    allowed: true,
    code: "ALLOWED",
    planName,
    status,
    jobsLimit,
    jobsUsed,
    remainingJobs,
    isUnlimited,
  };
}

export async function promptCompanyJobPostingAccess(access, navigate) {
  if (!access || access.allowed) return true;

  const result = await showSweetAlert(access.message, "warning", {
    title: access.title,
    confirmButtonText: access.confirmButtonText,
    cancelButtonText: "Later",
    showCancelButton: true,
    reverseButtons: true,
  });

  if (result?.isConfirmed && typeof navigate === "function") {
    navigate("/company/pricing");
  }

  return false;
}
