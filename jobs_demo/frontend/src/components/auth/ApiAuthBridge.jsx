import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setApiTokenGetter } from "../../services/api.js";

export default function ApiAuthBridge() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setApiTokenGetter(() => getToken());
  }, [isLoaded, getToken]);

  return null;
}
