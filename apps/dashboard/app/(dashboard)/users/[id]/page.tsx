'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../../../src/lib/apiClient';
import { RoleBadge, StatusBadge } from '../../../../src/components/Badge';
import { ConfirmModal } from '../../../../src/components/ConfirmModal';
import type { User } from '@app/shared';
import { formatDate, formatRelativeTime } from '@app/shared';

interface ActivityLog {
  id: string;
  action: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const res = await apiClient.get<User>(`/users/${params.id}`);
      if (res.success && res.data) {
        setUser(res.data);
        setEditName(res.data.name);
        setEditEmail(res.data.email);
        setEditRole(res.data.role);
      } else {
        setError(res.message);
      }
      setIsLoading(false);
    };

    const fetchActivity = async () => {
      const res = await apiClient.get<ActivityLog[]>(
        `/users/${params.id}/activity`,
      );
      if (res.success && res.data) setActivityLog(res.data);
    };

    void fetchUser();
    void fetchActivity();
  }, [params.id]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaveLoading(true);

    // Update profile (name, email)
    const profileRes = await apiClient.patch<User>(`/users/${user.id}`, {
      name: editName,
      email: editEmail,
    });

    // Update role separately if it changed
    if (editRole !== user.role) {
      await apiClient.patch(`/users/${user.id}/role`, { role: editRole });
    }

    if (profileRes.success && profileRes.data) {
      setUser({ ...profileRes.data, role: editRole as User['role'] });
      setEditMode(false);
    }
    setSaveLoading(false);
  }, [user, editName, editEmail, editRole]);

  const handleDelete = useCallback(async () => {
    if (!user) return;
    setDeleteLoading(true);
    const res = await apiClient.delete(`/users/${user.id}`);
    if (res.success) {
      router.push('/users');
    }
    setDeleteLoading(false);
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="dash-page dash-page--center">
        <span className="spinner" aria-label="Loading user" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="dash-page dash-page--center">
        <p className="text-danger">{error ?? 'User not found.'}</p>
        <Link href="/users" className="btn btn--primary" style={{ marginTop: '1rem' }}>
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="user-detail-grid">
        {/* Profile card */}
        <div className="card user-profile-card">
          <div className="card__header">
            <h2 className="card__title">Profile</h2>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setEditMode(false)}
                    disabled={saveLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={handleSave}
                    disabled={saveLoading}
                    aria-busy={saveLoading}
                  >
                    {saveLoading ? (
                      <span className="spinner spinner--sm" aria-hidden="true" />
                    ) : null}
                    Save
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="card__body">
            <div className="user-profile">
              <div className="user-profile__avatar">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="user-profile__img"
                  />
                ) : (
                  <span className="user-profile__initials">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="user-profile__info">
                {editMode ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="detail-name" className="form-label">Name</label>
                      <input
                        id="detail-name"
                        type="text"
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="detail-email" className="form-label">Email</label>
                      <input
                        id="detail-email"
                        type="email"
                        className="input"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="detail-role" className="form-label">Role</label>
                      <select
                        id="detail-role"
                        className="input"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="user-profile__name">{user.name}</h3>
                    <p className="user-profile__email">{user.email}</p>
                    <div className="user-profile__badges">
                      <RoleBadge role={user.role} />
                      <StatusBadge isActive={user.isActive} isBanned={user.isBanned} />
                    </div>
                    <dl className="user-profile__meta">
                      <dt>Member since</dt>
                      <dd>{formatDate(new Date(user.createdAt))}</dd>
                      <dt>Last updated</dt>
                      <dd>{formatRelativeTime(new Date(user.updatedAt))}</dd>
                    </dl>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card__footer card__footer--danger">
            <h4 className="danger-zone__title">Danger Zone</h4>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete User
            </button>
          </div>
        </div>

        {/* Activity log */}
        <div className="card user-activity-card">
          <div className="card__header">
            <h2 className="card__title">Activity Log</h2>
          </div>
          <div className="card__body">
            {activityLog.length === 0 ? (
              <p className="text-muted">No activity recorded.</p>
            ) : (
              <ul className="activity-log">
                {activityLog.map((entry) => (
                  <li key={entry.id} className="activity-log__item">
                    <span className="activity-log__dot" aria-hidden="true" />
                    <div className="activity-log__content">
                      <span className="activity-log__action">{entry.action}</span>
                      <span className="activity-log__meta">
                        {formatRelativeTime(new Date(entry.createdAt))} · {entry.ip}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${user.name}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
