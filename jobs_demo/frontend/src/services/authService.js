import api from "./api.js";

export async function authLogin({ email, password }) {
  if (email === "company@jobgateway.com" && password === "company123") {
    return {
      token: "demo_company_token",
      user: { role: "company", name: "WebSoft Technologies", email },
    };
  }

  if (email === "chaithanyan917@gmail.com" && password === "company123") {
    return {
      token: "demo_company_token_2",
      user: { role: "company", name: "Chaithanya Company", email },
    };
  }

  if (email === "student@jobgateway.com" && password === "student123") {
    return {
      token: "demo_student_token",
      user: { role: "student", name: "John Doe", email },
    };
  }

  throw new Error("Invalid email or password");
}

export async function bootstrapAuthSession(payload = {}) {
  const { data } = await api.post("/auth/bootstrap", payload);
  return data;
}
