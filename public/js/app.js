// Melbourne JobSeeker App Controller
document.addEventListener('DOMContentLoaded', () => {
  let currentSettings = null;
  let activeTab = 'jobsTab';
  let cachedJobs = [];
  let selectedJob = null;
  let searchDebounceTimeout = null;

  // Initialize
  startMelbourneClock();
  initTabs();
  initFilters();
  initActions();
  loadAll();

  // 1. Live Melbourne Clock
  function startMelbourneClock() {
    const clockEl = document.getElementById('melbourneClock');
    const updateTime = () => {
      try {
        const melbTimeStr = new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Melbourne',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(new Date());

        const melbDateStr = new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Melbourne',
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }).format(new Date());

        clockEl.textContent = `Melbourne: ${melbDateStr}, ${melbTimeStr}`;
      } catch (e) {
        clockEl.textContent = 'Melbourne: AEST/AEDT';
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // 2. Navigation Tabs
  function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        switchTab(targetId);
      });
    });
  }

  function switchTab(targetId) {
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === targetId);
    });

    document.querySelectorAll('.tab-pane').forEach(p => {
      if (p.id === targetId) {
        p.classList.remove('hidden');
      } else {
        p.classList.add('hidden');
      }
    });

    activeTab = targetId;

    if (targetId === 'previewTab') {
      refreshEmailPreview();
    } else if (targetId === 'historyTab') {
      loadHistory();
    } else if (targetId === 'portalsTab') {
      loadPortals();
    }
  }

  // 3. Load Application Data
  async function loadAll() {
    await Promise.all([
      loadStats(),
      loadJobs(),
      loadSettings()
    ]);
  }

  async function loadStats() {
    try {
      const stats = await API.getStats();
      document.getElementById('statTotalJobs').textContent = stats.totalJobs || 0;
      document.getElementById('statNewJobs').textContent = stats.newLast24h || 0;
      document.getElementById('tabJobsCount').textContent = stats.totalJobs || 0;

      if (stats.avgSalaryMin && stats.avgSalaryMax) {
        document.getElementById('statAvgSalary').textContent = `$${Math.round(stats.avgSalaryMin / 1000)}k - $${Math.round(stats.avgSalaryMax / 1000)}k`;
      }

      if (stats.scheduler) {
        const sch = stats.scheduler;
        const timeOfDay = sch.timeOfDay || '08:30';
        document.getElementById('statNextAlert').textContent = `${timeOfDay} AEDT`;
        document.getElementById('schedulerStatusText').textContent = `${sch.frequency || 'Daily'} at ${timeOfDay} AEDT`;
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function loadJobs() {
    const grid = document.getElementById('jobsGrid');
    const emptyState = document.getElementById('emptyState');

    try {
      const params = getFilterParams();
      const res = await API.getJobs(params);
      cachedJobs = res.jobs || [];

      if (cachedJobs.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
        renderJobs(cachedJobs);
      }
    } catch (err) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Error loading jobs. Please check if the server is running.</p>
        </div>
      `;
    }
  }

  function getFilterParams() {
    const q = document.getElementById('jobSearchInput').value.trim();
    const workType = document.getElementById('filterWorkType').value;
    const source = document.getElementById('filterSource').value;
    const status = document.getElementById('filterStatus').value;
    const minSalary = document.getElementById('filterMinSalary').value;
    const sort = document.getElementById('filterSort').value;

    return { q, workType, source, status, minSalary, sort };
  }

  function renderJobs(jobs) {
    const grid = document.getElementById('jobsGrid');
    grid.innerHTML = '';

    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = `job-card ${job.status === 'saved' ? 'saved-job' : ''} ${job.status === 'applied' ? 'applied-job' : ''}`;

      const tagsHtml = (job.tags || [])
        .map(tag => `<span class="tag-pill ${['SQL', 'Power BI', 'Python', 'Snowflake'].includes(tag) ? 'highlight' : ''}">${escapeHtml(tag)}</span>`)
        .join('');

      card.innerHTML = `
        <div class="job-card-header">
          <div class="job-company">🏢 ${escapeHtml(job.company)}</div>
          <div style="display:flex;gap:5px;align-items:center;">
            <span class="job-verified-tag" title="Verified exact job apply page - validated directly">✓ Direct Apply Page</span>
            <span class="job-source-tag">${escapeHtml(job.source || 'Seek AU')}</span>
          </div>
        </div>

        <h3 class="job-title">
          <a href="${job.url}" target="_blank">${escapeHtml(job.title)}</a>
        </h3>

        <div class="job-location">
          <span>📍 ${escapeHtml(job.location)}</span>
          ${job.workType ? `<span>• <strong>${escapeHtml(job.workType)}</strong></span>` : ''}
        </div>

        <div class="job-salary-box">
          <span class="job-salary-val">💰 ${escapeHtml(job.salary || 'Market Rate (Melbourne)')}</span>
          <span class="job-date-val">📅 ${escapeHtml(job.postDate)}</span>
        </div>

        <p class="job-snippet">${escapeHtml(job.description)}</p>

        <div class="job-tags-row">
          ${tagsHtml}
        </div>

        <div class="job-actions-row">
          <div class="job-action-buttons">
            <button class="btn-icon-only btn-save ${job.status === 'saved' ? 'active' : ''}" title="Save / Bookmark Job">
              ⭐
            </button>
            <button class="btn-icon-only btn-applied ${job.status === 'applied' ? 'active' : ''}" title="Mark as Applied">
              ✅
            </button>
            <button class="btn btn-sm btn-secondary btn-details">
              Details
            </button>
          </div>

          <div style="display:flex;gap:6px;align-items:center;">
            <a href="${job.url}" target="_blank" class="btn btn-sm btn-primary" title="Open exact verified apply page directly">
              Apply for this Role ↗
            </a>
          </div>
        </div>
      `;

      // Event listeners for card buttons
      const btnSave = card.querySelector('.btn-save');
      btnSave.addEventListener('click', async (e) => {
        e.stopPropagation();
        const nextStatus = job.status === 'saved' ? 'new' : 'saved';
        await toggleJobStatus(job.id, nextStatus);
      });

      const btnApplied = card.querySelector('.btn-applied');
      btnApplied.addEventListener('click', async (e) => {
        e.stopPropagation();
        const nextStatus = job.status === 'applied' ? 'new' : 'applied';
        await toggleJobStatus(job.id, nextStatus);
      });

      const btnDetails = card.querySelector('.btn-details');
      btnDetails.addEventListener('click', () => {
        openJobModal(job);
      });

      grid.appendChild(card);
    });
  }

  async function toggleJobStatus(jobId, newStatus) {
    try {
      await API.updateJobStatus(jobId, newStatus);
      showToast(`Job status updated to ${newStatus}`, 'success');
      loadJobs();
      loadStats();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  }

  // 4. Job Details Modal
  function openJobModal(job) {
    selectedJob = job;
    document.getElementById('modalCompany').textContent = job.company;
    document.getElementById('modalTitle').textContent = job.title;
    document.getElementById('modalSalary').textContent = `💰 ${job.salary || 'Melbourne Market Rate'}`;
    document.getElementById('modalLocation').textContent = `📍 ${job.location}`;
    document.getElementById('modalDate').textContent = `📅 ${job.postDate}`;
    document.getElementById('modalSource').textContent = job.source || 'Seek AU';
    document.getElementById('modalDescription').textContent = job.description;

    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = (job.tags || [])
      .map(tag => `<span class="tag-pill highlight">${escapeHtml(tag)}</span>`)
      .join('');

    const applyLink = document.getElementById('btnModalApplyLink');
    applyLink.href = job.url;
    applyLink.textContent = job.url.includes('linkedin.com') ? 'Apply on LinkedIn ↗' : (job.url.includes('seek.com.au') ? 'Apply on Seek AU ↗' : `Apply at ${job.company.split(' ')[0]} ↗`);

    const backupLink = document.getElementById('btnModalBackupLink');
    if (backupLink) {
      if (job.backupUrl) {
        backupLink.href = job.backupUrl;
        backupLink.textContent = job.backupUrl.includes('seek.com.au') ? 'Seek AU Search ↗' : 'Alternative Source ↗';
        backupLink.classList.remove('hidden');
      } else {
        backupLink.classList.add('hidden');
      }
    }

    document.getElementById('jobDetailModal').classList.remove('hidden');
  }

  function closeJobModal() {
    document.getElementById('jobDetailModal').classList.add('hidden');
    selectedJob = null;
  }

  document.getElementById('btnCloseModal').addEventListener('click', closeJobModal);
  document.querySelector('.modal-backdrop').addEventListener('click', closeJobModal);

  document.getElementById('btnModalSave').addEventListener('click', async () => {
    if (!selectedJob) return;
    const nextStatus = selectedJob.status === 'saved' ? 'new' : 'saved';
    await toggleJobStatus(selectedJob.id, nextStatus);
    closeJobModal();
  });

  document.getElementById('btnModalApplied').addEventListener('click', async () => {
    if (!selectedJob) return;
    const nextStatus = selectedJob.status === 'applied' ? 'new' : 'applied';
    await toggleJobStatus(selectedJob.id, nextStatus);
    closeJobModal();
  });

  // 5. Filters & Search setup
  function initFilters() {
    const searchInput = document.getElementById('jobSearchInput');
    const clearBtn = document.getElementById('btnClearSearch');

    searchInput.addEventListener('input', () => {
      clearBtn.classList.toggle('hidden', !searchInput.value);
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(loadJobs, 250);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.add('hidden');
      loadJobs();
    });

    ['filterWorkType', 'filterSource', 'filterStatus', 'filterMinSalary', 'filterSort'].forEach(id => {
      document.getElementById(id).addEventListener('change', loadJobs);
    });

    document.getElementById('btnResetFilters').addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.add('hidden');
      document.getElementById('filterWorkType').value = 'All';
      document.getElementById('filterSource').value = 'All';
      document.getElementById('filterStatus').value = 'All';
      document.getElementById('filterMinSalary').value = '0';
      document.getElementById('filterSort').value = 'newest';
      loadJobs();
    });
  }

  // 6. Settings Page Controller
  async function loadSettings() {
    try {
      currentSettings = await API.getSettings();
      renderSettings(currentSettings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  function renderSettings(s) {
    // Schedule
    document.getElementById('settingScheduleEnabled').checked = !!s.schedule?.enabled;
    document.getElementById('settingFrequency').value = s.schedule?.frequency || 'daily';
    document.getElementById('settingTimeOfDay').value = s.schedule?.timeOfDay || '08:30';

    // Email
    document.getElementById('settingRecipientEmail').value = s.email?.to || '';
    document.getElementById('settingSendOnlyNew').checked = s.email?.sendOnlyNewJobs !== false;
    document.getElementById('settingMaxJobs').value = s.email?.maxJobsPerEmail || 25;

    // Recipient badge in header stat
    const recipientBadge = document.getElementById('statAlertRecipient');
    if (s.email?.to) {
      recipientBadge.textContent = `To: ${s.email.to}`;
    } else {
      recipientBadge.textContent = 'To: Not configured';
    }

    // SMTP
    document.getElementById('smtpHost').value = s.email?.smtp?.host || '';
    document.getElementById('smtpPort').value = s.email?.smtp?.port || 587;
    document.getElementById('smtpUser').value = s.email?.smtp?.auth?.user || '';
    document.getElementById('smtpPass').value = s.email?.smtp?.auth?.pass || '';

    // Target titles
    renderTargetTitles(s.targetTitles || []);

    // Criteria
    document.getElementById('settingLocation').value = s.location || 'Melbourne VIC, Australia';
    const minSal = s.minSalaryAUD || 100000;
    document.getElementById('settingMinSalaryPref').value = minSal;
    document.getElementById('salaryDisplayVal').textContent = `$${parseInt(minSal).toLocaleString()} AUD`;

    // Skills
    renderSkillsEditor(s.skillsKeywords || []);
  }

  function renderTargetTitles(titles) {
    const container = document.getElementById('targetTitlesEditor');
    container.innerHTML = '';

    titles.forEach((title, index) => {
      const item = document.createElement('div');
      item.className = 'tag-item';
      item.innerHTML = `
        <span>${escapeHtml(title)}</span>
        <button class="tag-remove-btn" title="Remove">&times;</button>
      `;

      item.querySelector('.tag-remove-btn').addEventListener('click', () => {
        titles.splice(index, 1);
        renderTargetTitles(titles);
      });

      container.appendChild(item);
    });
  }

  function renderSkillsEditor(skills) {
    const container = document.getElementById('skillsKeywordsEditor');
    container.innerHTML = skills.map(skill => `<span class="tag-pill highlight">${escapeHtml(skill)}</span>`).join('');
  }

  // Salary range slider live feedback
  document.getElementById('settingMinSalaryPref').addEventListener('input', (e) => {
    document.getElementById('salaryDisplayVal').textContent = `$${parseInt(e.target.value).toLocaleString()} AUD`;
  });

  // Add new title
  document.getElementById('btnAddTitle').addEventListener('click', () => {
    const input = document.getElementById('newTitleInput');
    const val = input.value.trim();
    if (val && currentSettings) {
      if (!currentSettings.targetTitles) currentSettings.targetTitles = [];
      if (!currentSettings.targetTitles.includes(val)) {
        currentSettings.targetTitles.push(val);
        renderTargetTitles(currentSettings.targetTitles);
        input.value = '';
      }
    }
  });

  // Save Settings Button
  document.getElementById('btnSaveSettings').addEventListener('click', async () => {
    const feedback = document.getElementById('saveSettingsFeedback');
    feedback.textContent = 'Saving & rescheduling...';

    const titles = Array.from(document.querySelectorAll('#targetTitlesEditor .tag-item span')).map(el => el.textContent.trim());

    const updated = {
      targetTitles: titles,
      location: document.getElementById('settingLocation').value.trim(),
      minSalaryAUD: parseInt(document.getElementById('settingMinSalaryPref').value, 10),
      schedule: {
        enabled: document.getElementById('settingScheduleEnabled').checked,
        frequency: document.getElementById('settingFrequency').value,
        timeOfDay: document.getElementById('settingTimeOfDay').value,
        timezone: 'Australia/Melbourne'
      },
      email: {
        enabled: true,
        to: document.getElementById('settingRecipientEmail').value.trim(),
        sendOnlyNewJobs: document.getElementById('settingSendOnlyNew').checked,
        maxJobsPerEmail: parseInt(document.getElementById('settingMaxJobs').value, 10),
        smtp: {
          host: document.getElementById('smtpHost').value.trim(),
          port: parseInt(document.getElementById('smtpPort').value, 10) || 587,
          auth: {
            user: document.getElementById('smtpUser').value.trim(),
            pass: document.getElementById('smtpPass').value.trim()
          }
        }
      }
    };

    try {
      const res = await API.saveSettings(updated);
      feedback.textContent = '✅ Settings saved & background schedule updated!';
      showToast('Settings saved successfully', 'success');
      loadStats();
      setTimeout(() => { feedback.textContent = ''; }, 4000);
    } catch (err) {
      feedback.textContent = '❌ Failed to save settings';
      showToast('Failed to save settings: ' + err.message, 'error');
    }
  });

  // Test Email Button
  document.getElementById('btnSendTestEmail').addEventListener('click', async () => {
    const emailTo = document.getElementById('settingRecipientEmail').value.trim();
    if (!emailTo) {
      showToast('Please enter a recipient email address first', 'error');
      return;
    }

    showToast('Sending test email...', 'info');
    try {
      const res = await API.sendTestEmail(emailTo);
      if (res.success) {
        showToast('✅ Test email sent to ' + emailTo, 'success');
      } else {
        showToast('❌ Test email failed: ' + (res.error || 'Check SMTP credentials'), 'error');
      }
    } catch (err) {
      showToast('Error sending test email', 'error');
    }
  });

  // 7. Header Top Actions
  function initActions() {
    // Scan Now
    const btnScan = document.getElementById('btnScanNow');
    btnScan.addEventListener('click', async () => {
      btnScan.disabled = true;
      btnScan.innerHTML = `<span class="spinner" style="width:14px;height:14px;margin:0;display:inline-block;"></span> Scanning...`;
      showToast('Scanning Seek, LinkedIn, and Melbourne job portals...', 'info');

      try {
        const res = await API.triggerScan();
        showToast(`Scan complete! Found ${res.scan?.jobsFound || 0} jobs (${res.scan?.newJobsAdded || 0} new).`, 'success');
        await loadAll();
        refreshEmailPreview();
      } catch (err) {
        showToast('Scan encountered an error: ' + err.message, 'error');
      } finally {
        btnScan.disabled = false;
        btnScan.innerHTML = `<span class="btn-icon">⚡</span><span class="btn-label">Scan Jobs Now</span>`;
      }
    });

    // Verify Links
    const btnVerify = document.getElementById('btnVerifyLinks');
    if (btnVerify) {
      btnVerify.addEventListener('click', async () => {
        btnVerify.disabled = true;
        btnVerify.innerHTML = `<span class="spinner" style="width:14px;height:14px;margin:0;display:inline-block;"></span> Validating...`;
        showToast('Validating exact job application pages directly in real time...', 'info');

        try {
          const res = await API.verifyAllLinks();
          showToast(`Exact Apply Page Validation Complete! ${res.verifiedCount || 0} direct apply pages verified, ${res.rejectedCount || 0} invalid pages pruned.`, 'success');
          await loadJobs();
          refreshEmailPreview();
        } catch (err) {
          showToast('Validation failed: ' + err.message, 'error');
        } finally {
          btnVerify.disabled = false;
          btnVerify.innerHTML = `<span class="btn-icon">🛡️</span><span class="btn-label">Validate Apply Pages</span>`;
        }
      });
    }

    // Send Digest Now
    const btnSendDigest = document.getElementById('btnSendDigestNow');
    btnSendDigest.addEventListener('click', async () => {
      btnSendDigest.disabled = true;
      showToast('Preparing and sending job digest to your inbox...', 'info');

      try {
        const res = await API.sendDigestNow();
        if (res.success) {
          showToast(`Digest sent successfully to ${res.recipient}!`, 'success');
          loadStats();
          loadJobs();
        } else if (res.notConfigured) {
          showToast('Please configure SMTP settings in the Settings tab to send emails.', 'error');
          switchTab('settingsTab');
        } else {
          showToast('Digest failed: ' + (res.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        showToast('Error sending digest: ' + err.message, 'error');
      } finally {
        btnSendDigest.disabled = false;
      }
    });

    // Email Preview buttons
    document.getElementById('btnRefreshPreview').addEventListener('click', refreshEmailPreview);
    document.getElementById('btnSendPreviewDigest').addEventListener('click', () => {
      document.getElementById('btnSendDigestNow').click();
    });
  }

  function refreshEmailPreview() {
    const frame = document.getElementById('emailPreviewFrame');
    frame.src = `/api/email/preview?t=${Date.now()}`;
  }

  // 8. Direct Portals tab
  async function loadPortals() {
    const grid = document.getElementById('portalsGrid');
    try {
      const links = await API.getSeekLinks();
      grid.innerHTML = links.map(item => `
        <div class="portal-card">
          <h4 class="portal-role-title">💼 ${escapeHtml(item.title)}</h4>
          <div class="portal-links-list">
            <a href="${item.seekUrl}" target="_blank" class="portal-link-btn">
              <span>Seek AU (Melbourne)</span>
              <span>↗</span>
            </a>
            <a href="${item.indeedUrl}" target="_blank" class="portal-link-btn">
              <span>Indeed Australia</span>
              <span>↗</span>
            </a>
            <a href="${item.linkedInUrl}" target="_blank" class="portal-link-btn">
              <span>LinkedIn Australia</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = '<p>Failed to load direct portal links.</p>';
    }
  }

  // 9. History tab
  async function loadHistory() {
    const scansBody = document.getElementById('scansTableBody');
    const emailsBody = document.getElementById('emailsTableBody');

    try {
      const history = await API.getHistory();

      // Render scans
      if (!history.scans || history.scans.length === 0) {
        scansBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No scan history yet</td></tr>';
      } else {
        scansBody.innerHTML = history.scans.map(s => `
          <tr>
            <td>${formatDate(s.timestamp)}</td>
            <td>${(s.titlesQueried || []).slice(0, 2).join(', ')}${(s.titlesQueried || []).length > 2 ? '...' : ''}</td>
            <td><strong>${s.jobsFound || 0}</strong></td>
            <td><span class="status-badge success">+${s.newJobsAdded || 0}</span></td>
            <td>${s.durationMs ? Math.round(s.durationMs / 1000) + 's' : 'N/A'}</td>
          </tr>
        `).join('');
      }

      // Render emails
      if (!history.emails || history.emails.length === 0) {
        emailsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No email delivery logs yet</td></tr>';
      } else {
        emailsBody.innerHTML = history.emails.map(e => `
          <tr>
            <td>${formatDate(e.timestamp)}</td>
            <td>${escapeHtml(e.recipient || 'N/A')}</td>
            <td>${e.jobsCount || 0} roles</td>
            <td>
              <span class="status-badge ${e.status === 'success' ? 'success' : (e.status === 'failed' ? 'failed' : 'pending')}">
                ${escapeHtml(e.status || 'unknown')}
              </span>
            </td>
            <td>${escapeHtml(e.error || e.messageId ? 'Delivered' : 'Pending')}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  // Utilities
  function formatDate(isoStr) {
    if (!isoStr) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Melbourne',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(isoStr));
    } catch (e) {
      return isoStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
});
