export const isEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v = "") => /^\d{10}$/.test(String(v).replace(/\D/g, ""));
