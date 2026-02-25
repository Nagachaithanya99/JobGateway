import api from "./api"; // your axios instance

export async function studentGovList(params = {}) {
  const { data } = await api.get("/student/government", { params });
  return data;
}

export async function studentGovDetails(id) {
  const { data } = await api.get(`/student/government/${id}`);
  return data;
}
