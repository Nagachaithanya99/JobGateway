// src/services/authService.js
export async function authLogin({ email, password }) {
  // Admin demo
  if (email === "admin@jobgateway.com" && password === "admin123") {
    return {
      token: "demo_admin_token",
      user: { role: "admin", name: "JobGateway Admin", email },
    };
  }

  // Company demo (main)
  if (email === "company@jobgateway.com" && password === "company123") {
    return {
      token: "demo_company_token",
      user: { role: "company", name: "WebSoft Technologies", email },
    };
  }

  // ✅ ALSO allow your email as company (so you can login with your own)
  if (email === "chaithanyan917@gmail.com" && password === "company123") {
    return {
      token: "demo_company_token_2",
      user: { role: "company", name: "Chaithanya Company", email },
    };
  }

  // Student demo
  if (email === "student@jobgateway.com" && password === "student123") {
    return {
      token: "demo_student_token",
      user: { role: "student", name: "John Doe", email },
    };
  }

  // return same shape for UI
  throw new Error("Invalid email or password");
}
