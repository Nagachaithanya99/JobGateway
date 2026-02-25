export async function adminGetCompanyById(id) {
  // Mock company + related data
  return {
    id,
    name: "Tech Solutions Inc.",
    category: "IT Services",
    location: "Bangalore",
    status: "active",
    website: "https://example.com",
    email: "hr@techsolutions.com",
    phone: "+91 90000 11111",

    plan: {
      name: "Premium",
      start: "2026-02-01",
      end: "2026-03-01",
      jobsLimit: 20,
      jobsUsed: 12,
      appsLimit: 1000,
      appsUsed: 640,
      price: "₹350",
      status: "active",
    },

    jobs: [
      {
        id: "j1",
        title: "Senior Developer",
        stream: "IT",
        category: "Software",
        subCategory: "Full Stack",
        location: "Bangalore",
        salary: "₹10–15 LPA",
        experience: "3-5 yrs",
        status: "active",
        createdAt: "2026-02-15",
        applications: 120,
      },
      {
        id: "j2",
        title: "UI/UX Designer",
        stream: "Design",
        category: "UI/UX",
        subCategory: "Product Design",
        location: "Remote",
        salary: "₹6–10 LPA",
        experience: "1-3 yrs",
        status: "disabled",
        createdAt: "2026-02-14",
        applications: 80,
      },
    ],

    applicants: [
      {
        id: "a1",
        name: "Sarah Johnson",
        role: "UI/UX Designer",
        status: "shortlisted",
        appliedAt: "2026-02-15",
      },
      {
        id: "a2",
        name: "Michael Chen",
        role: "Senior Developer",
        status: "applied",
        appliedAt: "2026-02-14",
      },
      {
        id: "a3",
        name: "Emily Davis",
        role: "Senior Developer",
        status: "hold",
        appliedAt: "2026-02-13",
      },
    ],
  };
}
