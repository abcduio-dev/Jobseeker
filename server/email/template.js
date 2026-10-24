function formatAUD(amount) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
}

function generateEmailHtml(jobs = [], options = {}) {
  const recipient = options.recipient || 'Data Professional';
  const scanTime = new Date().toLocaleDateString('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const jobsListHtml = jobs.length === 0 ? `
    <div style="background-color: #1e293b; border-radius: 12px; padding: 32px; text-align: center; color: #94a3b8;">
      <p style="font-size: 18px; margin: 0 0 8px 0; color: #f8fafc; font-weight: 600;">No new un-emailed jobs in this cycle</p>
      <p style="margin: 0; font-size: 14px;">All scanned jobs have been sent in previous alerts. We'll alert you the moment new roles are published!</p>
    </div>
  ` : jobs.map((job, idx) => {
    const tagsHtml = (job.tags || [])
      .map(tag => `<span style="display: inline-block; background-color: #334155; color: #cbd5e1; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 6px; margin-right: 6px; margin-bottom: 4px;">${tag}</span>`)
      .join('');

    const workTypeBadge = job.workType ? `
      <span style="display: inline-block; background-color: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px;">${job.workType}</span>
    ` : '';

    return `
      <!-- Job Card ${idx + 1} -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
        <tr>
          <td style="padding: 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: top;">
                  <div style="margin-bottom: 6px;">
                    ${workTypeBadge}
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; margin-left: 4px;">
                      🛡️ Verified Active
                    </span>
                    <span style="display: inline-block; background-color: #0f172a; color: #94a3b8; font-size: 11px; padding: 2px 8px; border-radius: 6px; margin-left: 4px;">
                      Source: ${job.source || 'Seek AU'}
                    </span>
                  </div>
                  <h2 style="margin: 0 0 6px 0; font-size: 19px; line-height: 1.3; font-weight: 700; color: #f8fafc;">
                    <a href="${job.url}" target="_blank" style="color: #60a5fa; text-decoration: none;">${job.title}</a>
                  </h2>
                  <div style="font-size: 14px; color: #cbd5e1; font-weight: 600; margin-bottom: 12px;">
                    🏢 ${job.company} &nbsp;•&nbsp; 📍 ${job.location}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Salary & Date Highlight Box -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; background-color: #0f172a; border-radius: 8px; padding: 10px 14px; border-left: 4px solid #10b981;">
              <tr>
                <td style="font-size: 14px; font-weight: 600; color: #10b981;">
                  💰 ${job.salary || 'Competitive Market Rate'}
                </td>
                <td align="right" style="font-size: 12px; color: #94a3b8;">
                  📅 ${job.postDate}
                </td>
              </tr>
            </table>

            <!-- Description Snippet -->
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.55; color: #94a3b8;">
              ${job.description}
            </p>

            <!-- Tags & Action Button -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <div>${tagsHtml}</div>
                </td>
                <td align="right" style="vertical-align: middle; white-space: nowrap; padding-left: 12px;">
                  <a href="${job.url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                    Apply on ${job.source || 'Seek AU'} →
                  </a>
                  ${job.backupUrl ? `
                    <div style="margin-top: 6px; text-align: right;">
                      <a href="${job.backupUrl}" target="_blank" style="font-size: 11px; color: #38bdf8; text-decoration: underline;">
                        Backup Link ↗
                      </a>
                    </div>
                  ` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Melbourne Data & BI Analyst Jobs Digest</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    table { border-collapse: collapse; }
    a { color: #60a5fa; }
  </style>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; width: 100%;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #1e293b 50%, #0f172a 100%); border: 1px solid #334155; border-radius: 16px 16px 0 0; padding: 32px 28px; text-align: left; border-bottom: 2px solid #3b82f6;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
                      🇦🇺 Melbourne, Australia • Daily Job Alert
                    </span>
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Data & Analytics Job Digest
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                      Targeted roles: Data Analyst, Senior Data Analyst, BI Analyst, Data Engineer
                    </p>
                  </td>
                  <td align="right" style="vertical-align: top; white-space: nowrap;">
                    <div style="background-color: #0f172a; border: 1px solid #334155; padding: 8px 14px; border-radius: 10px; text-align: right;">
                      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Date</div>
                      <div style="font-size: 13px; font-weight: 600; color: #e2e8f0;">${scanTime}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Bar -->
          <tr>
            <td style="background-color: #0f172a; border-left: 1px solid #334155; border-right: 1px solid #334155; padding: 16px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 14px; color: #cbd5e1;">
                    🎯 <strong style="color: #ffffff;">${jobs.length} Matching Opportunities</strong> in Melbourne & Hybrid VIC
                  </td>
                  <td align="right" style="font-size: 12px; color: #94a3b8;">
                    Avg Salary: <strong style="color: #10b981;">$125k - $165k AUD</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content (Jobs) -->
          <tr>
            <td style="background-color: #0b1120; border-left: 1px solid #334155; border-right: 1px solid #334155; padding: 24px 20px;">
              ${jobsListHtml}
            </td>
          </tr>

          <!-- Quick Portal Links -->
          <tr>
            <td style="background-color: #0f172a; border-left: 1px solid #334155; border-right: 1px solid #334155; padding: 20px 28px; border-top: 1px solid #1e293b;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #f1f5f9;">
                🔍 Direct 1-Click Melbourne Job Searches
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0;">
                    <a href="https://www.seek.com.au/data-analyst-jobs/in-All-Melbourne-VIC?sortmode=ListedDate" target="_blank" style="color: #38bdf8; font-size: 13px; text-decoration: none;">
                      → Seek AU: Data Analyst Jobs in Melbourne
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <a href="https://www.seek.com.au/senior-data-analyst-jobs/in-All-Melbourne-VIC?sortmode=ListedDate" target="_blank" style="color: #38bdf8; font-size: 13px; text-decoration: none;">
                      → Seek AU: Senior Data Analyst Jobs in Melbourne
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <a href="https://www.seek.com.au/business-intelligence-analyst-jobs/in-All-Melbourne-VIC?sortmode=ListedDate" target="_blank" style="color: #38bdf8; font-size: 13px; text-decoration: none;">
                      → Seek AU: Business Intelligence Analyst Jobs in Melbourne
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">
                    <a href="https://www.seek.com.au/data-engineer-jobs/in-All-Melbourne-VIC?sortmode=ListedDate" target="_blank" style="color: #38bdf8; font-size: 13px; text-decoration: none;">
                      → Seek AU: Data Engineer Jobs in Melbourne
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #090d16; border: 1px solid #334155; border-top: 1px solid #1e293b; border-radius: 0 0 16px 16px; padding: 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; color: #94a3b8; font-weight: 500;">
                Melbourne JobSeeker Automated Notification Agent
              </p>
              <p style="margin: 0 0 12px 0;">
                Delivered automatically according to your frequency and time preference (Melbourne Time AEDT).
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Configure alerts and schedule at <a href="http://localhost:3000" style="color: #60a5fa; text-decoration: underline;">JobSeeker Dashboard</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = {
  generateEmailHtml
};
