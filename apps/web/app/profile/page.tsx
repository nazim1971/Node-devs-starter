'use client';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { updateProfileSchema, changePasswordSchema } from '@app/shared';
import { useAuth } from '../../src/providers/AuthProvider';
import { apiClient } from '../../src/lib/apiClient';
import { useToast } from '../../src/hooks/useToast';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { Header } from '../../src/components/Header';
import { Avatar } from '../../src/components/Avatar';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ToastContainer } from '../../src/components/Toast';
import type { User } from '@app/shared';

// ── Types ──────────────────────────────────────────────────────────────────────

type ProfileErrors = Partial<Record<keyof z.infer<typeof updateProfileSchema>, string>>;
type PasswordErrors = Partial<Record<keyof z.infer<typeof changePasswordSchema>, string>>;

// ── Role badge colours ─────────────────────────────────────────────────────────

const ROLE_VARIANT: Record<string, string> = {
  admin: 'badge--admin',
  editor: 'badge--editor',
  user: 'badge--user',
};

// ── Avatar upload section ──────────────────────────────────────────────────────

interface AvatarSectionProps {
  user: User;
  onUpdated: (url: string) => void;
  toastFn: (msg: string, v?: 'success' | 'danger' | 'warning' | 'info') => void;
}

function AvatarSection({ user, onUpdated, toastFn }: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toastFn('Please select an image file.', 'warning'); return; }
    if (file.size > 5 * 1024 * 1024) { toastFn('Image must be under 5 MB.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsSaving(true);
    // 1. Get signed upload params from our API
    const sigRes = await apiClient.get<{ signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string }>('/upload/avatar');
    if (!sigRes.success || !sigRes.data) { toastFn('Could not get upload credentials.', 'danger'); setIsSaving(false); return; }

    const { signature, timestamp, cloudName, apiKey, folder } = sigRes.data;

    // 2. Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', apiKey);
    formData.append('folder', folder);

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!cloudRes.ok) { toastFn('Image upload failed.', 'danger'); setIsSaving(false); return; }

    const cloudData = await cloudRes.json() as { secure_url: string };

    // 3. Save the URL to our API
    const updateRes = await apiClient.patch<User>(`/users/${user.id}`, { avatar: cloudData.secure_url });
    setIsSaving(false);

    if (updateRes.success && updateRes.data) {
      onUpdated(cloudData.secure_url);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toastFn('Avatar updated!', 'success');
    } else {
      toastFn(updateRes.message || 'Failed to save avatar.', 'danger');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div
        className="avatar-upload__preview"
        style={{ width: 100, height: 100 }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Change avatar"
        onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
      >
        {preview ? (
          <img src={preview} alt="Preview" />
        ) : (
          <Avatar src={user.avatar} name={user.name} size="2xl" />
        )}
        <div className="avatar-upload__overlay" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {preview && (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save avatar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {!preview && (
        <p className="avatar-upload__hint">Click avatar to change · Max 5 MB</p>
      )}
    </div>
  );
}

// ── Profile form ───────────────────────────────────────────────────────────────

function ProfileForm({ user, onUpdated, toastFn }: { user: User; onUpdated: (u: User) => void; toastFn: AvatarSectionProps['toastFn'] }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = updateProfileSchema.safeParse({ name, email });
    if (!result.success) {
      const fe: ProfileErrors = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof ProfileErrors;
        if (k && !fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }

    setIsSaving(true);
    const res = await apiClient.patch<User>(`/users/${user.id}`, { name, email });
    setIsSaving(false);

    if (res.success && res.data) {
      onUpdated(res.data);
      toastFn('Profile updated!', 'success');
    } else {
      toastFn(res.message || 'Failed to update profile.', 'danger');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} noValidate>
      <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
      <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
      <Button type="submit" variant="primary" isLoading={isSaving}>Save changes</Button>
    </form>
  );
}

// ── Change password form ───────────────────────────────────────────────────────

function PasswordForm({ userId, toastFn }: { userId: string; toastFn: AvatarSectionProps['toastFn'] }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const fe: PasswordErrors = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof PasswordErrors;
        if (k && !fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      return;
    }

    setIsSaving(true);
    const res = await apiClient.patch(`/users/${userId}/password`, { currentPassword, newPassword });
    setIsSaving(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toastFn('Password changed!', 'success');
    } else {
      toastFn(res.message || 'Could not change password.', 'danger');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} noValidate>
      <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} error={errors.currentPassword} showPasswordToggle autoComplete="current-password" />
      <Input label="New password" type="password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.newPassword} showPasswordToggle autoComplete="new-password" />
      <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} showPasswordToggle autoComplete="new-password" />
      <Button type="submit" variant="primary" isLoading={isSaving}>Change password</Button>
    </form>
  );
}

// ── Account info ───────────────────────────────────────────────────────────────

function AccountInfo({ user }: { user: User }) {
  return (
    <dl style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[
        { label: 'Role', value: <span className={`badge ${ROLE_VARIANT[user.role] ?? 'badge--user'}`}>{user.role}</span> },
        { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
        { label: 'Status', value: <span className={`badge ${user.isActive ? 'badge--success' : 'badge--neutral'}`}>{user.isActive ? 'Active' : 'Inactive'}</span> },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
          <dt style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</dt>
          <dd style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 'var(--space-8)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function ProfileContent() {
  const { user, setUser } = useAuth();
  const { toasts, toast, dismiss } = useToast();

  if (!user) return null;

  function handleAvatarUpdated(url: string) {
    setUser({ ...user!, avatar: url });
  }

  function handleProfileUpdated(updated: User) {
    setUser(updated);
  }

  return (
    <>
      <Header />
      <main>
        <div className="container" style={{ maxWidth: 780, paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <SectionCard title="Your avatar">
            <AvatarSection user={user} onUpdated={handleAvatarUpdated} toastFn={toast} />
          </SectionCard>

          <SectionCard title="Profile information">
            <ProfileForm user={user} onUpdated={handleProfileUpdated} toastFn={toast} />
          </SectionCard>

          <SectionCard title="Change password">
            <PasswordForm userId={user.id} toastFn={toast} />
          </SectionCard>

          <SectionCard title="Account info">
            <AccountInfo user={user} />
          </SectionCard>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
