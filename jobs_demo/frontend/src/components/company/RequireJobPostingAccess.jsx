import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCompanyBillingMe } from "../../services/companyService.js";
import {
  getCompanyJobPostingAccess,
  promptCompanyJobPostingAccess,
} from "../../utils/companyJobPostingAccess.js";

export default function RequireJobPostingAccess({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = new URLSearchParams(location.search).get("edit");
  const isEditMode = Boolean(String(editId || "").trim());
  const alertShownRef = useRef(false);
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    if (isEditMode) {
      setState({ loading: false, allowed: true });
      return undefined;
    }

    let active = true;

    async function checkPostingAccess() {
      try {
        const data = await getCompanyBillingMe();
        const access = getCompanyJobPostingAccess(data?.subscription || null);

        if (!active) return;

        if (access.allowed) {
          setState({ loading: false, allowed: true });
          return;
        }

        setState({ loading: false, allowed: false });

        if (!alertShownRef.current) {
          alertShownRef.current = true;
          await promptCompanyJobPostingAccess(access, navigate);
        }

        if (active) {
          navigate("/company/pricing", {
            replace: true,
            state: { from: location.pathname, blockedBy: access.code },
          });
        }
      } catch (error) {
        if (!active) return;
        setState({ loading: false, allowed: false });
        navigate("/company/pricing", {
          replace: true,
          state: {
            from: location.pathname,
            blockedBy: "SUBSCRIPTION_CHECK_FAILED",
            message: error?.response?.data?.message || "Could not verify your subscription right now.",
          },
        });
      }
    }

    checkPostingAccess();

    return () => {
      active = false;
    };
  }, [isEditMode, location.pathname, navigate]);

  if (state.loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Checking subscription access...
      </div>
    );
  }

  if (!state.allowed) return null;

  return children;
}
