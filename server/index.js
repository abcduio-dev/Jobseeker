const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT, ROOT_DIR } = require('./config');
const db = require('./db');
const scheduler = require('./scheduler');
const { runJobScan } = require('./scanners');
const { sendJobDigestEmail, sendTestEmail, generateEmailHtml } = require('./email/mailer');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(ROOT_DIR, 'public')));

// --- API ROUTES ---

// 1. Get Jobs with filters
app.get('/api/jobs', (req, res) => {
  const {
    q,
    source,
    workType,
    status,
    minSalary,
    sort = 'newest',
    limit = 50,
    offset = 0
  } = req.query;

  let jobs = db.getAllJobs();

  // Search filter
  if (q) {
    const query = q.toLowerCase();
    jobs = jobs.filter(j =>
      (j.title && j.title.toLowerCase().includes(query)) ||
      (j.company && j.company.toLowerCase().includes(query)) ||
      (j.description && j.description.toLowerCase().includes(query)) ||
      (j.tags && j.tags.some(t => t.toLowerCase().includes(query)))
    );
  }

  // Source filter
  if (source && source !== 'All') {
    jobs = jobs.filter(j => j.source && j.source.toLowerCase().includes(source.toLowerCase()));
  }

  // Work type filter
  if (workType && workType !== 'All') {
    jobs = jobs.filter(j => j.workType && j.workType.toLowerCase() === workType.toLowerCase());
  }

  // Status filter
  if (status && status !== 'All') {
    jobs = jobs.filter(j => j.status === status);
  }

  // Min Salary filter
  if (minSalary && parseInt(minSalary, 10) > 0) {
    const min = parseInt(minSalary, 10);
    jobs = jobs.filter(j => !j.salaryMin || j.salaryMin >= min);
  }

  // Sorting
  if (sort === 'salary_high') {
    jobs.sort((a, b) => (b.salaryMin || 0) - (a.salaryMin || 0));
  } else if (sort === 'title') {
    jobs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    // newest default
    jobs.sort((a, b) => (b.postedTimestamp || 0) - (a.postedTimestamp || 0));
  }

  const total = jobs.length;
  const paginated = jobs.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));

  res.json({
    total,
    count: paginated.length,
    jobs: paginated
  });
});

// 2. Update Job Status
app.patch('/api/jobs/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['new', 'emailed', 'saved', 'applied', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const updated = db.updateJobStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({ success: true, job: updated });
});

// 3. Settings Management
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    // Dynamic scheduler reschedule
    scheduler.reschedule();
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Statistics
app.get('/api/stats', (req, res) => {
  res.json({
    ...db.getStats(),
    scheduler: scheduler.getStatus()
  });
});

// 5. Trigger Manual Scan
app.post('/api/scan', async (req, res) => {
  try {
    const result = await scheduler.executeScanAndNotify('manual_api');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Test Email
app.post('/api/email/test', async (req, res) => {
  try {
    const { to } = req.body;
    const result = await sendTestEmail(to);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Send Immediate Digest
app.post('/api/email/send-digest', async (req, res) => {
  try {
    const result = await sendJobDigestEmail();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Email HTML Preview
app.get('/api/email/preview', (req, res) => {
  const jobs = db.getAllJobs().slice(0, 10);
  const html = generateEmailHtml(jobs, { recipient: 'Candidate' });
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// 9. History Logs
app.get('/api/history', (req, res) => {
  res.json({
    scans: db.getScanHistory(),
    emails: db.getEmailLogs()
  });
});

// 10. Direct Seek Links Generator Helper
app.get('/api/seek-links', (req, res) => {
  const settings = db.getSettings();
  const links = (settings.targetTitles || []).map(title => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return {
      title,
      seekUrl: `https://www.seek.com.au/${slug}-jobs/in-All-Melbourne-VIC?sortmode=ListedDate`,
      indeedUrl: `https://au.indeed.com/jobs?q=${encodeURIComponent(title)}&l=Melbourne+VIC&sort=date`,
      linkedInUrl: `https://au.linkedin.com/jobs/search?keywords=${encodeURIComponent(title)}&location=Melbourne%2C%20Victoria%2C%20Australia`
    };
  });
  res.json(links);
});

// Catch-all fallback to serve SPA
app.use((req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'public', 'index.html'));
});

// Start application
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Melbourne JobSeeker App running on port ${PORT}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`=================================================`);

  // Start background scheduler
  scheduler.start();

  // If database is empty, seed with initial Melbourne jobs
  if (db.getAllJobs().length === 0) {
    console.log('[Init] Database is empty. Running initial scan & seed...');
    runJobScan().catch(err => console.error('[Init] Initial scan error:', err.message));
  }
});
