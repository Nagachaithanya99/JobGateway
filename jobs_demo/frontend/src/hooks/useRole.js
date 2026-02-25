import { useContext } from "react";
import { RoleContext } from "../context/RoleContext.jsx";

export default function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
