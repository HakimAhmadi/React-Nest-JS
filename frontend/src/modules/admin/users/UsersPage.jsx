import { useState } from "react";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { getApi, postApi, putApi, deleteApi } from "@/services/api";
import { canAccess } from "@/utils/permissions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";

import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";

const CMS_ROLES = [
  { id: "SUPER_ADMIN", name: "Super Admin" },
  { id: "ADMIN", name: "Admin" },
  { id: "EDITOR", name: "Editor" },
  { id: "SUPPORT", name: "Support" },
  { id: "SUBSCRIBER", name: "Subscriber" },
];

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* API returns { success, data: { data: [...], total: N } } */
  const { data: res, isLoading, refetch } = useApiQuery(
    ["users", search, page],
    async () => {
      const response = await getApi("admin/users", { search, limit, offset: (page - 1) * limit });
      return response.data;
    }
  );

  const deleteMutation = useApiMutation({
    mutationFn: (id) => deleteApi(`admin/users/${id}`),
    onSuccess: () => {
      refetch();
      setDeleteTarget(null);
    },
  });

  const upsertMutation = useApiMutation({
    mutationFn: (formData) =>
      selectedUser
        ? putApi(`admin/users/${selectedUser.id}`, formData)
        : postApi("admin/users", formData),
    onSuccess: () => {
      toast.success(selectedUser ? "User updated!" : "User created!");
      refetch();
      setModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message || "Action failed"}`);
    },
  });

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (r) => <span className="text-gray-500 text-xs">#{r.id}</span>,
    },
    {
      key: "name",
      label: "User",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-xs text-primary-400 font-bold">
            {r.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-200">{r.name}</span>
            <span className="text-xs text-gray-500">{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (r) => <Badge variant="info">{r.role || "user"}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge variant={r.isActive ? "success" : "danger"}>
          {r.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          {canAccess("user.edit") && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit2}
              onClick={() => {
                setSelectedUser(r);
                setModalOpen(true);
              }}
            />
          )}
          {canAccess("user.delete") && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteTarget(r)}
            />
          )}
        </div>
      ),
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    // Don't submit empty password on edit
    if (selectedUser && !payload.password) delete payload.password;
    upsertMutation.mutate(payload);
  };

  const users = Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res)
      ? res
      : [];
  const total = res?.total ?? users.length;

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total accounts.</p>
        </div>
        {canAccess("user.create") && (
          <Button
            icon={Plus}
            onClick={() => {
              setSelectedUser(null);
              setModalOpen(true);
            }}
          >
            Add User
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={users}
        loading={isLoading}
        emptyMessage="No users found."
        currentPage={page}
        totalItems={total}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
      />

      {/* User Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        title={selectedUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            defaultValue={selectedUser?.name}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={selectedUser?.email}
            required
          />
          <Input
            label={
              selectedUser ? "New Password (leave blank to keep)" : "Password"
            }
            name="password"
            type="password"
            required={!selectedUser}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">
              Account Role
            </label>
            <select
              name="role"
              defaultValue={selectedUser?.role || "SUBSCRIBER"}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-100 text-sm px-3 py-2"
            >
              {CMS_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {upsertMutation.isError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {upsertMutation.error?.message || "Something went wrong."}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={upsertMutation.isPending}
            >
              {selectedUser ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action is permanent.`}
      />
    </div>
  );
};

export default UsersPage;
