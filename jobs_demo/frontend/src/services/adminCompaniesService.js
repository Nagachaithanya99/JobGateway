const COMPANIES = [
  {
    id: "c1",
    name: "Tech Solutions Inc.",
    category: "IT",
    location: "Bangalore",
    status: "active",
    jobs: 12,
    apps: 340,
    email: "hr@techsolutions.com",
    phone: "+91 90000 11111",
    website: "https://techsolutions.com",
    websiteLabel: "techsolutions.com",
    tagline: "Enterprise software and staffing partner",
    logoUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=200&fit=crop",
    address: "2nd Floor, MG Road, Bangalore",
    hrName: "Ananya Rao",
    hrEmail: "ananya.rao@techsolutions.com",
    plan: {
      name: "premium",
      start: "2026-02-01",
      end: "2026-03-01",
      jobsUsed: 12,
      jobsLimit: 20,
      appsUsed: 640,
      appsLimit: 1000,
      status: "active",
    },
  },
  {
    id: "c2",
    name: "Global Enterprises",
    category: "Healthcare",
    location: "Hyderabad",
    status: "active",
    jobs: 9,
    apps: 460,
    email: "careers@globalenterprises.com",
    phone: "+91 98888 22222",
    website: "https://globalenterprises.com",
    websiteLabel: "globalenterprises.com",
    tagline: "Hospital staffing and workforce platform",
    logoUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&h=200&fit=crop",
    address: "Hitech City, Hyderabad",
    hrName: "Sathvik Menon",
    hrEmail: "sathvik@globalenterprises.com",
    plan: {
      name: "unlimited",
      start: "2026-01-20",
      end: "2026-04-20",
      jobsUsed: 9,
      jobsLimit: 999,
      appsUsed: 1400,
      appsLimit: 5000,
      status: "active",
    },
  },
  {
    id: "c3",
    name: "StartUp Labs",
    category: "Finance",
    location: "Pune",
    status: "suspended",
    jobs: 2,
    apps: 32,
    email: "hello@startuplabs.io",
    phone: "+91 97777 33333",
    website: "https://startuplabs.io",
    websiteLabel: "startuplabs.io",
    tagline: "Early-stage fintech hiring",
    logoUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&h=200&fit=crop",
    address: "Koregaon Park, Pune",
    hrName: "Karan Joshi",
    hrEmail: "karan@startuplabs.io",
    plan: {
      name: "starter",
      start: "2026-01-10",
      end: "2026-02-10",
      jobsUsed: 2,
      jobsLimit: 5,
      appsUsed: 130,
      appsLimit: 500,
      status: "expired",
    },
  },
  {
    id: "c4",
    name: "Innovation Corp",
    category: "Manufacturing",
    location: "Chennai",
    status: "active",
    jobs: 7,
    apps: 212,
    email: "jobs@innovationcorp.com",
    phone: "+91 95555 44444",
    website: "https://innovationcorp.com",
    websiteLabel: "innovationcorp.com",
    tagline: "Automation and industrial talent hiring",
    logoUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=200&h=200&fit=crop",
    address: "Guindy Industrial Estate, Chennai",
    hrName: "Priya Nair",
    hrEmail: "priya.nair@innovationcorp.com",
    plan: {
      name: "growth",
      start: "2026-02-05",
      end: "2026-03-05",
      jobsUsed: 7,
      jobsLimit: 15,
      appsUsed: 320,
      appsLimit: 1200,
      status: "active",
    },
  },
];

export async function adminListCompanies() {
  await wait(250);
  return COMPANIES.map((company) => ({ ...company }));
}

export async function adminGetCompanyById(id) {
  await wait(200);
  return COMPANIES.find((company) => company.id === id) || null;
}

export async function adminGetCompanyDetails(id) {
  await wait(250);

  const company = COMPANIES.find((item) => item.id === id) || COMPANIES[0];

  const jobs = [
    { id: "j1", title: "Senior Software Engineer", status: "active", applications: 45, createdAt: "2026-02-15" },
    { id: "j2", title: "UI/UX Designer", status: "active", applications: 22, createdAt: "2026-02-14" },
    { id: "j3", title: "Backend Developer", status: "active", applications: 18, createdAt: "2026-02-13" },
  ];

  const applicants = [
    { id: "a1", name: "Sarah Johnson", role: "UI/UX Designer", status: "shortlisted", appliedAt: "2026-02-15" },
    { id: "a2", name: "Michael Chen", role: "Senior Software Engineer", status: "applied", appliedAt: "2026-02-14" },
    { id: "a3", name: "Emily Davis", role: "Backend Developer", status: "hold", appliedAt: "2026-02-13" },
  ];

  return { company, jobs, applicants };
}

export async function adminToggleCompanyStatus(id, nextStatus) {
  await wait(200);
  const idx = COMPANIES.findIndex((item) => item.id === id);
  if (idx !== -1) COMPANIES[idx].status = nextStatus;
  return { ok: true };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
