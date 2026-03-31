'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useAuth } from '../../../src/providers/AuthProvider';
import { apiClient } from '../../../src/lib/apiClient';
import { RoleBadge } from '../../../src/components/Badge';
import { formatDate } from '@app/shared';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleProfileSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setProfileLoading(true);
      setProfileSuccess(false);
      await apiClient.patch('/users/me', profileForm);
      await refreshUser();
      setProfileSuccess(true);
      setProfileLoading(false);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    [profileForm, refreshUser],
  );

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPwError(null);
      setPwSuccess(false);

      if (pwForm.newPassword !== pwForm.confirmPassword) {
        setPwError('New passwords do not match.');
        return;
      }
      if (pwForm.newPassword.length < 8) {
        setPwError('New password must be at least 8 characters.');
        return;
      }

      setPwLoading(true);
      const res = await apiClient.patch('/users/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });

      if (res.success) {
        setPwSuccess(true);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPwSuccess(false), 3000);
      } else {
        setPwError(res.message);
      }
      setPwLoading(false);
    },
    [pwForm],
  );

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, PNG, and WebP images are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB.');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      setAvatarLoading(true);
      const res = await apiClient.upload<{ url: string }>('/upload/avatar', formData);
      if (res.success && res.data?.url) {
        await apiClient.patch('/users/me', { avatar: res.data.url });
        await refreshUser();
      }
      setAvatarLoading(false);
    },
    [refreshUser],
  );

  if (!user) return null;

  return (
    <div className="dash-page dash-page--narrow">
      {/* Account info */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">My Profile</h2>
        </div>
        <div className="card__body">
          <div className="profile-avatar-section">
            <div className="profile-avatar__wrapper">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="profile-avatar__img" />
              ) : (
                <span className="profile-avatar__initials">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <button
                type="button"
                className="profile-avatar__change-btn"
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                aria-label="Change avatar"
              >
                {avatarLoading ? (
                  <span className="spinner spinner--sm" aria-hidden="true" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="visually-hidden"
                onChange={handleAvatarChange}
                aria-label="Upload avatar"
              />
            </div>
            <div className="profile-avatar__meta">
              <div className="profile-avatar__badges">
                <RoleBadge role={user.role} />
              </div>
              <p className="text-muted text-sm">
                Member since {formatDate(new Date(user.createdAt))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <form className="card" onSubmit={handleProfileSubmit}>
        <div className="card__header">
          <h2 className="card__title">Edit Profile</h2>
        </div>
        <div className="card__body">
          <div className="form-group">
            <label htmlFor="profile-name" className="form-label">Name</label>
            <input
              id="profile-name"
              type="text"
              className="input"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, name: e.target.value }))
              }
              required
              minLength={2}
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-email" className="form-label">Email</label>
            <input
              id="profile-email"
              type="email"
              className="input"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
        </div>
        <div className="card__footer">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={profileLoading}
            aria-busy={profileLoading}
          >
            {profileLoading ? (
              <span className="spinner spinner--sm" aria-hidden="true" />
            ) : null}
            Update Profile
          </button>
          {profileSuccess && (
            <span className="settings-saved-msg" role="status">✓ Profile updated</span>
          )}
        </div>
      </form>

      {/* Change password */}
      <form className="card" onSubmit={handlePasswordSubmit}>
        <div className="card__header">
          <h2 className="card__title">Change Password</h2>
        </div>
        <div className="card__body">
          {pwError && (
            <div className="alert alert--danger" role="alert">{pwError}</div>
          )}
          <div className="form-group">
            <label htmlFor="current-pw" className="form-label">Current Password</label>
            <input
              id="current-pw"
              type="password"
              className="input"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              required
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-pw" className="form-label">New Password</label>
            <input
              id="new-pw"
              type="password"
              className="input"
              value={pwForm.newPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-pw" className="form-label">Confirm New Password</label>
            <input
              id="confirm-pw"
              type="password"
              className="input"
              value={pwForm.confirmPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="card__footer">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={pwLoading}
            aria-busy={pwLoading}
          >
            {pwLoading ? (
              <span className="spinner spinner--sm" aria-hidden="true" />
            ) : null}
            Change Password
          </button>
          {pwSuccess && (
            <span className="settings-saved-msg" role="status">✓ Password changed</span>
          )}
        </div>
      </form>
    </div>
  );
}
