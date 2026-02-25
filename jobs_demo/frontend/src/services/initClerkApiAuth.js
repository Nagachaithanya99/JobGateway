import { setApiTokenGetter } from "./api.js";

export function wireClerkToken(getToken) {
  setApiTokenGetter(() => getToken());
}
