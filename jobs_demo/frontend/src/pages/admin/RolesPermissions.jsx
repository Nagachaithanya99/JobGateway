import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiEdit2,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from "react-icons/fi";

import Modal from "../../components/common/Modal";
import {
  adminDeleteAdminUser,
  adminDeleteRole,
  adminGetRolesPermissions,
  adminSaveAdminUser,
  adminSaveRole,
  adminSaveRolePermissions,
  adminToggleAdminUserStatus,
} from "../../services/adminService";

const FALLBACK_PERMISSION_SECTIONS = [
  "Dashboard Access",
  "Companies Management",
  "Jobs Management",
  "Applicants Management",
  "Students Management",
  "Pricing Plans",
  "Content Management",
  "Government Updates",
  "Settings",
];

const FALLBACK_PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "approve", "export"];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#2563EB]" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">{icon}</span>
      </div>
    </div>
  );
}

export default function RolesPermissions() {
  const [loading, setLoading] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionSections, setPermissionSections] = useState(FALLBACK_PERMISSION_SECTIONS);
  const [permissionActions, setPermissionActions] = useState(FALLBACK_PERMISSION_ACTIONS);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId],
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminGetRolesPermissions();
        const nextRoles = Array.isArray(data?.roles) ? data.roles : [];
        const nextUsers = Array.isArray(data?.users) ? data.users : [];

        setRoles(nextRoles);
        setUsers(nextUsers);
        setPermissionSections(
          Array.isArray(data?.permissionSections) && data.permissionSections.length
            ? data.permissionSections
            : FALLBACK_PERMISSION_SECTIONS,
        );
        setPermissionActions(
          Array.isArray(data?.permissionActions) && data.permissionActions.length
            ? data.permissionActions
            : FALLBACK_PERMISSION_ACTIONS,
        );

        setSelectedRoleId(data?.selectedRoleId || nextRoles[0]?.id || "");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(
    () => ({
      totalAdmins: users.length,
      totalRoles: roles.length,
      activeSessions: users.filter((u) => u.status === "active").length,
    }),
    [users, roles],
  );

  const openAddAdmin = () => {
    setEditingAdmin(null);
    setAdminForm({ name: "", email: "", role: roles[0]?.name || "", password: "", confirmPassword: "" });
    setAdminModalOpen(true);
  };

  const openEditAdmin = (row) => {
    setEditingAdmin(row);
    setAdminForm({ name: row.name, email: row.email, role: row.role, password: "", confirmPassword: "" });
    setAdminModalOpen(true);
  };

  const saveAdmin = async () => {
    setSaveBusy(true);
    try {
      const res = await adminSaveAdminUser({
        id: editingAdmin?.id,
        name: adminForm.name,
        email: adminForm.email,
        role: adminForm.role,
        status: editingAdmin?.status || "active",
      });

      const row = res?.user;
      if (!row) return;

      setUsers((prev) => {
        const exists = prev.some((x) => x.id === row.id);
        return exists ? prev.map((x) => (x.id === row.id ? row : x)) : [row, ...prev];
      });
      setAdminModalOpen(false);
    } finally {
      setSaveBusy(false);
    }
  };

  const openAddRole = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "" });
    setRoleModalOpen(true);
  };

  const openEditRole = (row) => {
    setEditingRole(row);
    setRoleForm({ name: row.name, description: row.description });
    setRoleModalOpen(true);
  };

  const saveRole = async () => {
    setSaveBusy(true);
    try {
      const res = await adminSaveRole({
        id: editingRole?.id,
        name: roleForm.name,
        description: roleForm.description,
      });
      const row = res?.role;
      if (!row) return;

      setRoles((prev) => {
        const exists = prev.some((x) => x.id === row.id);
        return exists ? prev.map((x) => (x.id === row.id ? row : x)) : [row, ...prev];
      });
      setSelectedRoleId(row.id);
      setRoleModalOpen(false);
    } finally {
      setSaveBusy(false);
    }
  };

  const removeRole = async (row) => {
    await adminDeleteRole(row.id);
    setRoles((prev) => {
      const next = prev.filter((x) => x.id !== row.id);
      if (!next.some((x) => x.id === selectedRoleId)) setSelectedRoleId(next[0]?.id || "");
      return next;
    });
  };

  const updatePermission = (section, action, checked) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === selectedRoleId
          ? {
              ...role,
              permissions: {
                ...(role.permissions || {}),
                [section]: {
                  ...((role.permissions || {})[section] || {}),
                  [action]: checked,
                },
              },
            }
          : role,
      ),
    );
  };

  const setAllPermissions = (value) => {
    if (!selectedRole) return;
    const next = {};
    permissionSections.forEach((section) => {
      next[section] = {};
      permissionActions.forEach((action) => {
        next[section][action] = value;
      });
    });

    setRoles((prev) => prev.map((role) => (role.id === selectedRoleId ? { ...role, permissions: next } : role)));
  };

  const savePermissionChanges = async () => {
    if (!selectedRole) return;
    setSaveBusy(true);
    try {
      const res = await adminSaveRolePermissions(selectedRole.id, selectedRole.permissions || {});
      const nextRole = res?.role;
      if (!nextRole) return;

      setRoles((prev) => prev.map((r) => (r.id === nextRole.id ? nextRole : r)));
    } finally {
      setSaveBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 h-56 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">Manage admin access control and system permissions</p>
        <p className="mt-2 text-xs font-medium text-slate-400">Dashboard &gt; Roles & Permissions</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Admin Users" value={stats.totalAdmins} icon={<FiUsers />} />
        <StatCard title="Total Roles" value={stats.totalRoles} icon={<FiShield />} />
        <StatCard title="Active Sessions" value={stats.activeSessions} icon={<FiCheckCircle />} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0F172A]">Admin Users</h2>
          <button type="button" onClick={openAddAdmin} className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <FiPlus /> Add Admin User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.email}</td>
                  <td className="px-4 py-3 text-slate-700">{row.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${row.status === "active" ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" title="Edit Role" onClick={() => openEditAdmin(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEdit2 /></button>
                      <button type="button" title="Deactivate" onClick={async () => {
                        const nextStatus = row.status === "active" ? "inactive" : "active";
                        const res = await adminToggleAdminUserStatus(row.id, nextStatus);
                        const nextRow = res?.user;
                        if (!nextRow) return;
                        setUsers((prev) => prev.map((x) => (x.id === row.id ? nextRow : x)));
                      }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 text-[#F97316] hover:bg-orange-50"><FiUserX /></button>
                      <button type="button" title="Delete" onClick={async () => {
                        await adminDeleteAdminUser(row.id);
                        setUsers((prev) => prev.filter((x) => x.id !== row.id));
                      }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0F172A]">Roles</h2>
          <button type="button" onClick={openAddRole} className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <FiPlus /> Create New Role
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Role Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Number of Users</th>
                <th className="px-4 py-3">Permissions Count</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((row) => {
                const permissionsCount = Object.values(row.permissions || {}).reduce(
                  (sum, section) => sum + Object.values(section || {}).filter(Boolean).length,
                  0,
                );
                return (
                  <tr key={row.id} className={`border-t border-slate-100 transition hover:bg-blue-50/40 ${selectedRoleId === row.id ? "bg-blue-50/40" : ""}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-slate-700">{row.description}</td>
                    <td className="px-4 py-3 text-slate-700">{row.usersCount}</td>
                    <td className="px-4 py-3 text-slate-700">{permissionsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" title="Edit Role" onClick={() => { setSelectedRoleId(row.id); openEditRole(row); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-[#2563EB] hover:bg-blue-50"><FiEdit2 /></button>
                        <button type="button" title="Open Permissions" onClick={() => setSelectedRoleId(row.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50"><FiUserCheck /></button>
                        <button type="button" title="Delete Role" onClick={() => removeRole(row)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRole ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A]">Role Permissions Configuration</h2>
              <p className="text-sm text-slate-500">Editing role: {selectedRole.name}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAllPermissions(true)} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
                Select All
              </button>
              <button type="button" onClick={() => setAllPermissions(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Deselect All
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-[#9A3412]">
            <span className="font-semibold">Warning:</span> Changing permissions affects all users assigned to this role.
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {permissionSections.map((section) => (
              <div key={section} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="mb-2 text-sm font-semibold text-[#0F172A]">{section}</p>
                <div className="space-y-2">
                  {permissionActions.map((action) => (
                    <div key={`${section}-${action}`} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-slate-700">{action}</span>
                      <Toggle
                        checked={!!selectedRole.permissions?.[section]?.[action]}
                        onChange={() => updatePermission(section, action, !selectedRole.permissions?.[section]?.[action])}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" disabled={saveBusy} onClick={savePermissionChanges} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {saveBusy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      ) : null}

      <Modal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title={editingAdmin ? "Edit Admin User" : "Add Admin User"}
        footer={
          <>
            <button type="button" onClick={() => setAdminModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" disabled={saveBusy} onClick={saveAdmin} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {saveBusy ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={adminForm.name} onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full Name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <select value={adminForm.role} onChange={(e) => setAdminForm((p) => ({ ...p, role: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300">
            {roles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          <input type="password" value={adminForm.password} onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))} placeholder="Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <input type="password" value={adminForm.confirmPassword} onChange={(e) => setAdminForm((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm Password" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 md:col-span-2" />
        </div>
      </Modal>

      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={editingRole ? "Edit Role" : "Create New Role"}
        footer={
          <>
            <button type="button" onClick={() => setRoleModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" disabled={saveBusy} onClick={saveRole} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {saveBusy ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <input value={roleForm.name} onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))} placeholder="Role Name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-300" />
          <textarea value={roleForm.description} onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Description" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
        </div>
      </Modal>
    </div>
  );
}
