import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Badge,
  Avatar,
  SegmentedControl,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconUsers,
  IconPlus,
  IconEye,
  IconShield,
  IconUser,
  IconMail,
  IconCalendar,
  IconPin,
  IconBookmark,
  IconCheck,
} from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import UserTable from '../../components/admin/UserTable';
import SearchInput from '../../components/common/SearchInput';
import Loading from '../../components/common/Loading';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { appStore } from '../../services/store';
import { userService } from '../../services/userService';
import { formatDate } from '../../utils/formatDate';
import { toast } from '../../context/ToastContext';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Confirmation dialogs
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Member Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('chhivtyy16@gmail.com');
  const [newRole, setNewRole] = useState('user');
  const [newBio, setNewBio] = useState('');

  // View User Details Modal state
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await userService.getAdminUsers(params);
      const userList = Array.isArray(data) ? data : (data?.users || appStore.getUsers() || []);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`User role updated to ${newRole}.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    const targetUser = users.find((u) => u.id === userId);
    setConfirmTitle(newStatus === 'suspended' ? 'Suspend User' : 'Activate User');
    setConfirmMessage(
      newStatus === 'suspended'
        ? `Are you sure you want to suspend @${targetUser?.username}? They will not be able to publish pins or comments.`
        : `Activate account for @${targetUser?.username}?`
    );
    setConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        await userService.updateUserStatus(userId, newStatus);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
        setConfirmOpen(false);
        toast.success(`User status updated to ${newStatus}.`);
      } catch (err) {
        toast.error(err.message || 'Failed to update user status');
      } finally {
        setActionLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  const handleDeleteUser = (user) => {
    setConfirmTitle('Delete User Account');
    setConfirmMessage(
      `Are you sure you want to permanently delete @${user.username} and all their saved boards and pins? This action cannot be undone.`
    );
    setConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        await userService.deleteUser(user.id);
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(user.id)));
        setConfirmOpen(false);
        toast.success(`User @${user.username} deleted.`);
      } catch (err) {
        toast.error(err.message || 'Failed to delete user');
      } finally {
        setActionLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setCreating(true);
    try {
      const created = await userService.createUser({
        username: newUsername.trim(),
        full_name: newFullName.trim() || newUsername.trim(),
        email: newEmail.trim() || 'chhivtyy16@gmail.com',
        role: newRole,
        bio: newBio.trim(),
      });
      setUsers((prev) => [created, ...prev]);
      setCreateModalOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewBio('');
      toast.success(`User @${created.username} created successfully.`);
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };



  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-slate-700 transition-all cursor-pointer"
      >
        <IconArrowLeft size={15} />
        Back to Admin Dashboard
      </button>

      <PageHeader
        title="Manage Users"
        description="Inspect registered members, adjust administrative access levels, suspend bad actors, and delete accounts."
        actions={
          <Button
            color="brandRed"
            radius="xl"
            size="sm"
            leftSection={<IconPlus size={15} />}
            onClick={() => setCreateModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 shadow-sm font-bold"
          >
            Add Member
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
        <div className="max-w-md flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder="Search by username, full name, or email..."
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SegmentedControl
            size="xs"
            radius="xl"
            value={roleFilter}
            onChange={setRoleFilter}
            data={[
              { label: 'All Roles', value: 'all' },
              { label: 'Users', value: 'user' },
              { label: 'Admins', value: 'admin' },
            ]}
          />

          <SegmentedControl
            size="xs"
            radius="xl"
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { label: 'All Status', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <Loading message="Loading user directory..." />
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <IconUsers size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No users found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'No registered users match your search query.' : 'There are currently no registered users matching the selected filters.'}
          </p>
        </div>
      ) : (
        <UserTable
          users={users}
          onRoleChange={handleRoleChange}
          onStatusChange={handleStatusChange}
          onDeleteUser={handleDeleteUser}
          onViewUser={(user) => setSelectedUser(user)}
        />
      )}

      {/* Add New Member Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Member Account"
        radius="xl"
        size="md"
        centered
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4 pt-2">
          <TextInput
            label="Username"
            placeholder="e.g. creative_mind"
            value={newUsername}
            onChange={(e) => setNewUsername(e.currentTarget.value)}
            required
            radius="md"
          />

          <TextInput
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            value={newFullName}
            onChange={(e) => setNewFullName(e.currentTarget.value)}
            radius="md"
          />

          <TextInput
            label="Email Address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.currentTarget.value)}
            required
            radius="md"
          />

          <Select
            label="Account Role"
            value={newRole}
            onChange={(val) => setNewRole(val || 'user')}
            data={[
              { value: 'user', label: 'User (Standard Member)' },
              { value: 'admin', label: 'Administrator (Full Moderation Access)' },
            ]}
            radius="md"
          />

          <Textarea
            label="Short Bio"
            placeholder="Curator interests, aesthetic focus..."
            value={newBio}
            onChange={(e) => setNewBio(e.currentTarget.value)}
            rows={2}
            radius="md"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="default" radius="xl" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="brandRed"
              radius="xl"
              size="sm"
              loading={creating}
              className="bg-brand-600 hover:bg-brand-700 font-bold"
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* User Details Inspection Dialog */}
      {selectedUser && (
        <Modal
          opened={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title="User Account Details"
          radius="2xl"
          size="lg"
          centered
        >
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <Avatar src={selectedUser.avatar_url} radius="xl" size={60} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                    {selectedUser.full_name || selectedUser.username}
                  </h4>
                  <Badge color={selectedUser.role === 'admin' ? 'red' : 'gray'} variant="light" size="xs">
                    {selectedUser.role}
                  </Badge>
                  <Badge color={selectedUser.status === 'suspended' ? 'orange' : 'teal'} variant="dot" size="xs">
                    {selectedUser.status === 'suspended' ? 'Suspended' : 'Active'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">@{selectedUser.username}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  {selectedUser.bio || 'No bio provided yet.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Email</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 break-all">{selectedUser.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Joined Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(selectedUser.created_at)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Pins Published</span>
                <span className="font-bold text-brand-600 text-sm">{selectedUser.pins_count || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Curated Boards</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedUser.boards_count || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/profile/${selectedUser.id}`}
                className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-1 group"
              >
                <span>Open Public Profile Page</span>
                <IconArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Button
                variant="default"
                radius="xl"
                size="xs"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        loading={actionLoading}
      />
    </div>
  );
}
