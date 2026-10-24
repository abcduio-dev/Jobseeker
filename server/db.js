const fs = require('fs');
const path = require('path');
const { DB_FILE, DATA_DIR, DEFAULT_SETTINGS } = require('./config');

class Database {
  constructor() {
    this.data = {
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      jobs: [],
      scanHistory: [],
      emailLogs: []
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
          scanHistory: Array.isArray(parsed.scanHistory) ? parsed.scanHistory : [],
          emailLogs: Array.isArray(parsed.emailLogs) ? parsed.emailLogs : []
        };
      } catch (err) {
        console.error('Failed to parse database file, initializing fresh:', err.message);
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err.message);
    }
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
      email: {
        ...this.data.settings.email,
        ...(newSettings.email || {})
      },
      schedule: {
        ...this.data.settings.schedule,
        ...(newSettings.schedule || {})
      },
      scanners: {
        ...this.data.settings.scanners,
        ...(newSettings.scanners || {})
      }
    };
    this.save();
    return this.data.settings;
  }

  // Jobs
  getAllJobs() {
    return this.data.jobs;
  }

  getJobById(id) {
    return this.data.jobs.find(j => j.id === id);
  }

  getNewJobsForEmail(limit = 25) {
    const minSalary = this.data.settings.minSalaryAUD || 0;
    return this.data.jobs
      .filter(j => j.status === 'new' && (!j.salaryMin || j.salaryMin >= minSalary))
      .sort((a, b) => (b.postedTimestamp || 0) - (a.postedTimestamp || 0))
      .slice(0, limit);
  }

  markJobsAsEmailed(jobIds) {
    const idSet = new Set(jobIds);
    let count = 0;
    this.data.jobs.forEach(job => {
      if (idSet.has(job.id) && job.status === 'new') {
        job.status = 'emailed';
        job.emailedAt = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) this.save();
    return count;
  }

  updateJobStatus(id, status) {
    const job = this.data.jobs.find(j => j.id === id);
    if (job) {
      job.status = status;
      this.save();
      return job;
    }
    return null;
  }

  addOrUpdateJobs(newJobs) {
    const jobById = new Map();
    const jobByNormKey = new Map();

    for (const job of this.data.jobs) {
      if (job.id) jobById.set(job.id, job);
      const normKey = `${(job.title || '').toLowerCase().trim()}:::${(job.company || '').toLowerCase().trim()}`;
      jobByNormKey.set(normKey, job);
    }

    let addedCount = 0;
    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    const newlyAdded = [];

    for (const job of newJobs) {
      const normKey = `${(job.title || '').toLowerCase().trim()}:::${(job.company || '').toLowerCase().trim()}`;
      const existing = (job.id && jobById.get(job.id)) || jobByNormKey.get(normKey);

      if (existing) {
        existing.lastSeenAt = nowIso;
        if (job.salary) existing.salary = job.salary;
        if (job.salaryMin) existing.salaryMin = job.salaryMin;
        if (job.salaryMax) existing.salaryMax = job.salaryMax;
        if (job.url) existing.url = job.url;
        if (job.backupUrl) existing.backupUrl = job.backupUrl;
        if (job.verified !== undefined) existing.verified = job.verified;
        if (job.verifiedSource) existing.verifiedSource = job.verifiedSource;
        if (job.source) existing.source = job.source;
        updatedCount++;
      } else {
        const enriched = {
          ...job,
          status: 'new',
          firstSeenAt: nowIso,
          lastSeenAt: nowIso
        };
        newlyAdded.push(enriched);
        if (job.id) jobById.set(job.id, enriched);
        jobByNormKey.set(normKey, enriched);
        addedCount++;
      }
    }

    if (newlyAdded.length > 0) {
      this.data.jobs = [...newlyAdded, ...this.data.jobs];
    }

    if (addedCount > 0 || updatedCount > 0) {
      this.save();
    }

    return { addedCount, updatedCount, totalInDb: this.data.jobs.length };
  }

  // Verify and sanitize all current jobs in database
  verifyAllExistingJobs(verifierFn) {
    let modified = 0;
    this.data.jobs = this.data.jobs.map(job => {
      const updated = verifierFn(job);
      if (updated.url !== job.url || updated.verified !== job.verified) {
        modified++;
      }
      return { ...job, ...updated };
    });
    if (modified > 0) {
      this.save();
    }
    return { modified, total: this.data.jobs.length };
  }

  setJobs(jobs) {
    this.data.jobs = Array.isArray(jobs) ? jobs : [];
    this.save();
    return this.data.jobs.length;
  }

  // Scan History
  logScan(record) {
    this.data.scanHistory.unshift({
      id: 'scan_' + Date.now(),
      timestamp: new Date().toISOString(),
      ...record
    });
    // Keep last 50 scans
    if (this.data.scanHistory.length > 50) {
      this.data.scanHistory = this.data.scanHistory.slice(0, 50);
    }
    this.save();
  }

  getScanHistory(limit = 20) {
    return this.data.scanHistory.slice(0, limit);
  }

  // Email Logs
  logEmail(record) {
    this.data.emailLogs.unshift({
      id: 'email_' + Date.now(),
      timestamp: new Date().toISOString(),
      ...record
    });
    if (this.data.emailLogs.length > 50) {
      this.data.emailLogs = this.data.emailLogs.slice(0, 50);
    }
    this.save();
  }

  getEmailLogs(limit = 20) {
    return this.data.emailLogs.slice(0, limit);
  }

  // Statistics
  getStats() {
    const jobs = this.data.jobs;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const newLast24h = jobs.filter(j => new Date(j.firstSeenAt).getTime() > oneDayAgo).length;
    const emailedCount = jobs.filter(j => j.status === 'emailed').length;
    const savedCount = jobs.filter(j => j.status === 'saved').length;

    // Salary stats
    const jobsWithSalaries = jobs.filter(j => j.salaryMin && j.salaryMin > 50000);
    const avgSalaryMin = jobsWithSalaries.length > 0
      ? Math.round(jobsWithSalaries.reduce((sum, j) => sum + j.salaryMin, 0) / jobsWithSalaries.length)
      : 125000;
    const avgSalaryMax = jobsWithSalaries.length > 0
      ? Math.round(jobsWithSalaries.reduce((sum, j) => sum + (j.salaryMax || j.salaryMin), 0) / jobsWithSalaries.length)
      : 155000;

    return {
      totalJobs: jobs.length,
      newLast24h,
      emailedCount,
      savedCount,
      avgSalaryMin,
      avgSalaryMax,
      lastScan: this.data.scanHistory[0] || null,
      lastEmail: this.data.emailLogs[0] || null
    };
  }
}

module.exports = new Database();
