'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@app/shared';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  isLoading?: boolean;
  onSave: (id: string, payload: { name: string; email: string; role: string; isActive: boolean }) => Promise<void>;
  onClose: () => void;
}

export function EditUserModal({
  user,
  isOpen,
  isLoading = false,
  onSave,
  onClose,
}: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setIsActive(user.isActive);
    }
  }, [user]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      await onSave(user.id, { name, email, role, isActive });
    },
    [user, name, email, role, isActive, onSave],
  );

  if (!isOpen || !user) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      <div className="modal edit-user-modal">
        <div className="modal__header">
          <h3 id="edit-user-title" className="modal__title">Edit User</h3>
          <button
            type="button"
            className="modal__close btn btn--icon btn--ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-name" className="form-label">Name</label>
            <input
              id="edit-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-email" className="form-label">Email</label>
            <input
              id="edit-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-role" className="form-label">Role</label>
            <select
              id="edit-role"
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group form-group--inline">
            <label className="form-label">Status</label>
            <label className="toggle">
              <input
                type="checkbox"
                className="toggle__input"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="toggle__track" aria-hidden="true" />
              <span className="toggle__label">{isActive ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? <span className="spinner spinner--sm" aria-hidden="true" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
