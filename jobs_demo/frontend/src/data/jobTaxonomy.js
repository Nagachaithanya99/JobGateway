export const OTHER_OPTION = "__other__";
const CUSTOM_TAXONOMY_KEY = "jobgateway_custom_job_taxonomy_v1";

export const BASE_JOB_TAXONOMY = {
  "IT & Software": {
    Development: ["Frontend", "Backend", "Full Stack", "Mobile App"],
    Data: ["Data Analyst", "Data Scientist"],
    "AI & ML": ["Machine Learning", "Deep Learning"],
    Cloud: ["Cloud Engineer"],
    "Cyber Security": ["Ethical Hacking"],
  },
  Engineering: {
    Mechanical: ["Production", "Automobile"],
    Civil: ["Structural", "Site Engineering"],
    Electrical: ["Power Systems"],
    Electronics: ["Embedded Systems"],
  },
  Healthcare: {
    Medical: ["General Physician", "Surgeon"],
    Nursing: ["ICU Nurse"],
    Pharmacy: ["Clinical Pharmacist"],
  },
  "Banking & Finance": {
    Banking: ["Relationship Manager"],
    Finance: ["Financial Analyst"],
    Accounting: ["Taxation"],
    Insurance: ["Insurance Advisor"],
  },
  Education: {
    Teaching: ["Primary Teacher", "Mathematics Teacher"],
    Training: ["Technical Trainer"],
  },
  "Marketing & Sales": {
    "Digital Marketing": ["SEO", "Social Media"],
    Sales: ["Field Sales Executive"],
  },
  Government: {
    "Civil Services": ["IAS"],
    Police: ["Sub Inspector"],
    Railways: ["Railway Clerk"],
  },
  Hospitality: {
    "Hotel Management": ["Front Office", "Chef"],
  },
  Manufacturing: {
    Production: ["Production Supervisor"],
    Quality: ["Quality Analyst"],
  },
  Law: {
    Legal: ["Corporate Lawyer"],
  },
  Agriculture: {
    Farming: ["Farm Supervisor"],
  },
  Media: {
    Design: ["Graphic Designer"],
  },
};

function normalizeText(value) {
  return String(value || "").trim();
}

function unique(list = []) {
  return Array.from(new Set(list.filter(Boolean)));
}

function readCustomTaxonomy() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_TAXONOMY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCustomTaxonomy(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOM_TAXONOMY_KEY, JSON.stringify(next || {}));
  } catch {
    // ignore localStorage failures
  }
}

export function mergeTaxonomy(base = {}, custom = {}) {
  const merged = {};
  const streams = unique([...Object.keys(base || {}), ...Object.keys(custom || {})]);
  streams.forEach((stream) => {
    const baseCategories = base?.[stream] || {};
    const customCategories = custom?.[stream] || {};
    const categoryNames = unique([...Object.keys(baseCategories), ...Object.keys(customCategories)]);
    merged[stream] = {};
    categoryNames.forEach((category) => {
      merged[stream][category] = unique([...(baseCategories?.[category] || []), ...(customCategories?.[category] || [])]);
    });
  });
  return merged;
}

export function getJobTaxonomy() {
  return mergeTaxonomy(BASE_JOB_TAXONOMY, readCustomTaxonomy());
}

export function getDefaultHierarchy(taxonomy = BASE_JOB_TAXONOMY) {
  const streams = Object.keys(taxonomy || {});
  const stream = streams[0] || "";
  const categories = Object.keys(taxonomy?.[stream] || {});
  const category = categories[0] || "";
  const subCategory = taxonomy?.[stream]?.[category]?.[0] || "";
  return { stream, category, subCategory };
}

export function resolveHierarchyValue(value, otherValue) {
  const raw = normalizeText(value);
  if (!raw) return "";
  if (raw === OTHER_OPTION || raw.toLowerCase() === "other") return normalizeText(otherValue);
  return raw;
}

export function persistCustomHierarchy({ stream, category, subCategory }) {
  const s = normalizeText(stream);
  const c = normalizeText(category);
  const sc = normalizeText(subCategory);
  if (!s || !c || !sc) return getJobTaxonomy();

  const custom = readCustomTaxonomy();
  if (!custom[s]) custom[s] = {};
  if (!custom[s][c]) custom[s][c] = [];
  custom[s][c] = unique([...(custom[s][c] || []), sc]);
  writeCustomTaxonomy(custom);
  return mergeTaxonomy(BASE_JOB_TAXONOMY, custom);
}
