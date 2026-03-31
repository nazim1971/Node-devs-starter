'use client';

import React, { useCallback, useState } from 'react';
import { apiClient } from '../../../src/lib/apiClient';
import { ConfirmModal } from '../../../src/components/ConfirmModal';

interface SettingsForm {
  siteName: string;
  contactEmail: string;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    siteName: 'Node Devs Admin',
    contactEmail: 'admin@nodedevs.io',
    maintenanceMode: false,
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [clearCacheOpen, setClearCacheOpen] = useState(false);
  const [clearCacheLoading, setClearCacheLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaveLoading(true);
      setSaveSuccess(false);
      await apiClient.patch('/admin/settings', form);
      setSaveSuccess(true);
      setSaveLoading(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    [form],
  );

  const handleClearCache = useCallback(async () => {
    setClearCacheLoading(true);
    await apiClient.post('/admin/cache/clear');
    setClearCacheLoading(false);
    setClearCacheOpen(false);
  }, []);

  return (
    <div className="dash-page dash-page--narrow">
      <form className="card settings-card" onSubmit={handleSubmit}>
        <div className="card__header">
          <h2 className="card__title">General Settings</h2>
        </div>
        <div className="card__body">
          <div className="form-group">
            <label htmlFor="site-name" className="form-label">Site Name</label>
            <input
              id="site-name"
              type="text"
              className="input"
              value={form.siteName}
              onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-email" className="form-label">Contact Email</label>
            <input
              id="contact-email"
              type="email"
              className="input"
              value={form.contactEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, contactEmail: e.target.value }))
              }
              required
            />
          </div>

          <div className="form-group form-group--inline">
            <label className="form-label">Maintenance Mode</label>
            <label className="toggle">
              <input
                type="checkbox"
                className="toggle__input"
                checked={form.maintenanceMode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))
                }
              />
              <span className="toggle__track" aria-hidden="true" />
              <span className="toggle__label">
                {form.maintenanceMode ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        <div className="card__footer">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saveLoading}
            aria-busy={saveLoading}
          >
            {saveLoading ? (
              <span className="spinner spinner--sm" aria-hidden="true" />
            ) : null}
            Save Settings
          </button>
          {saveSuccess && (
            <span className="settings-saved-msg" role="status">
              ✓ Settings saved
            </span>
          )}
        </div>
      </form>

      {/* Danger Zone */}
      <div className="card settings-danger-card">
        <div className="card__header">
          <h2 className="card__title card__title--danger">Danger Zone</h2>
        </div>
        <div className="card__body">
          <div className="danger-zone-item">
            <div className="danger-zone-item__info">
              <h4 className="danger-zone-item__title">Clear Cache</h4>
              <p className="danger-zone-item__desc text-muted">
                Clears all Redis cached data. Active sessions will not be affected.
              </p>
            </div>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setClearCacheOpen(true)}
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={clearCacheOpen}
        title="Clear Cache"
        message="This will clear all cached data from Redis. Are you sure?"
        confirmLabel="Clear Cache"
        variant="danger"
        isLoading={clearCacheLoading}
        onConfirm={handleClearCache}
        onCancel={() => setClearCacheOpen(false)}
      />
    </div>
  );
}
