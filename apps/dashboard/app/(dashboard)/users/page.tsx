'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { DataTable, type ColumnDef } from '../../../src/components/DataTable';
import { RoleBadge, StatusBadge } from '../../../src/components/Badge';
import { Pagination } from '../../../src/components/Pagination';
import { SearchInput } from '../../../src/components/SearchInput';
import { ConfirmModal } from '../../../src/components/ConfirmModal';
import { EditUserModal } from '../../../src/components/EditUserModal';
import { useUsers } from '../../../src/hooks/useUsers';
import type { User } from '@app/shared';
import { formatDate } from '@app/shared';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'user', label: 'User' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'banned', label: 'Banned' },
];

type ConfirmAction =
  | { type: 'ban'; user: User }
  | { type: 'unban'; user: User }
  | { type: 'delete'; user: User };

export default function UsersPage() {
  const {
    users,
    isLoading,
    pagination,
    setPage,
    setSearch,
    setRole,
    setStatus,
    banUser,
    deleteUser,
    updateUser,
  } = useUsers();

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);

    if (confirmAction.type === 'ban') {
      await banUser(confirmAction.user.id, true);
    } else if (confirmAction.type === 'unban') {
      await banUser(confirmAction.user.id, false);
    } else if (confirmAction.type === 'delete') {
      await deleteUser(confirmAction.user.id);
    }

    setConfirmLoading(false);
    setConfirmAction(null);
  }, [confirmAction, banUser, deleteUser]);

  const handleEditSave = useCallback(
    async (
      id: string,
      payload: { name: string; email: string; role: string; isActive: boolean },
    ) => {
      setEditLoading(true);
      await updateUser(id, payload);
      setEditLoading(false);
      setEditUser(null);
    },
    [updateUser],
  );

  const columns: ColumnDef<User>[] = [
    {
      key: 'avatar',
      header: '',
      width: '48px',
      render: (row) => (
        <div className="user-avatar-cell">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="user-avatar-cell__img" />
          ) : (
            <span className="user-avatar-cell__initials">
              {row.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Link href={`/users/${row.id}`} className="user-name-link">
          {row.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge isActive={row.isActive} isBanned={row.isBanned} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => formatDate(new Date(row.createdAt)),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="table-actions">
          <Link
            href={`/users/${row.id}`}
            className="btn btn--ghost btn--sm"
            aria-label={`View ${row.name}`}
          >
            View
          </Link>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setEditUser(row)}
            aria-label={`Edit ${row.name}`}
          >
            Edit
          </button>
          <button
            type="button"
            className={`btn btn--sm ${row.isBanned ? 'btn--secondary' : 'btn--warning'}`}
            onClick={() =>
              setConfirmAction(
                row.isBanned
                  ? { type: 'unban', user: row }
                  : { type: 'ban', user: row },
              )
            }
            aria-label={row.isBanned ? `Unban ${row.name}` : `Ban ${row.name}`}
          >
            {row.isBanned ? 'Unban' : 'Ban'}
          </button>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => setConfirmAction({ type: 'delete', user: row })}
            aria-label={`Delete ${row.name}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const confirmConfig = confirmAction
    ? confirmAction.type === 'delete'
      ? {
          title: 'Delete User',
          message: `Are you sure you want to delete ${confirmAction.user.name}? This action cannot be undone.`,
          confirmLabel: 'Delete',
          variant: 'danger' as const,
        }
      : confirmAction.type === 'ban'
      ? {
          title: 'Ban User',
          message: `Are you sure you want to ban ${confirmAction.user.name}?`,
          confirmLabel: 'Ban',
          variant: 'danger' as const,
        }
      : {
          title: 'Unban User',
          message: `Are you sure you want to unban ${confirmAction.user.name}?`,
          confirmLabel: 'Unban',
          variant: 'primary' as const,
        }
    : null;

  return (
    <div className="dash-page">
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Users</h2>
          <span className="text-muted text-sm">
            {pagination ? `${pagination.total} total` : ''}
          </span>
        </div>

        <div className="card__toolbar">
          <SearchInput
            placeholder="Search by name or email…"
            onChange={setSearch}
            className="flex-1"
          />
          <select
            className="input input--sm users-filter"
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by role"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="input input--sm users-filter"
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="card__body card__body--flush">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyMessage="No users found."
          />
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="card__footer">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmConfig?.title ?? ''}
        message={confirmConfig?.message ?? ''}
        confirmLabel={confirmConfig?.confirmLabel}
        variant={confirmConfig?.variant}
        isLoading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      <EditUserModal
        user={editUser}
        isOpen={editUser !== null}
        isLoading={editLoading}
        onSave={handleEditSave}
        onClose={() => setEditUser(null)}
      />
    </div>
  );
}
