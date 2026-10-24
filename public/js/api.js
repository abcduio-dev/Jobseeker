const API = {
  async getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/jobs?${query}`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async updateJobStatus(id, status) {
    const res = await fetch(`/api/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async getSettings() {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async saveSettings(settings) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  async getStats() {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async triggerScan() {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Scan failed to complete');
    return res.json();
  },

  async sendTestEmail(to) {
    const res = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to })
    });
    return res.json();
  },

  async sendDigestNow() {
    const res = await fetch('/api/email/send-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async getHistory() {
    const res = await fetch('/api/history');
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async getSeekLinks() {
    const res = await fetch('/api/seek-links');
    if (!res.ok) throw new Error('Failed to load portal links');
    return res.json();
  }
};
