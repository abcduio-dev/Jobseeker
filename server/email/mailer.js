const nodemailer = require('nodemailer');
const { generateEmailHtml } = require('./template');
const db = require('../db');

function createTransporter(smtpConfig) {
  if (!smtpConfig || !smtpConfig.auth?.user || !smtpConfig.auth?.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpConfig.host || 'smtp.gmail.com',
    port: smtpConfig.port || 587,
    secure: smtpConfig.secure || false,
    auth: {
      user: smtpConfig.auth.user,
      pass: smtpConfig.auth.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function sendJobDigestEmail(jobsToSend = null, customOptions = {}) {
  const settings = db.getSettings();
  const emailSettings = settings.email || {};

  const recipient = customOptions.to || emailSettings.to;
  if (!recipient) {
    const errorMsg = 'No recipient email configured. Please set your email address in Alerts & Schedule settings.';
    console.warn('[Mailer]', errorMsg);
    db.logEmail({
      recipient: 'None',
      jobsCount: 0,
      status: 'skipped',
      error: errorMsg
    });
    return { success: false, error: errorMsg, skipped: true };
  }

  // Get jobs to send
  const jobs = jobsToSend || (emailSettings.sendOnlyNewJobs !== false
    ? db.getNewJobsForEmail(emailSettings.maxJobsPerEmail || 25)
    : db.getAllJobs().slice(0, emailSettings.maxJobsPerEmail || 25));

  if (jobs.length === 0) {
    console.log('[Mailer] No new jobs to send in this cycle.');
    return { success: true, count: 0, message: 'No new jobs to send' };
  }

  const transporter = createTransporter(emailSettings.smtp);
  const subject = `${emailSettings.subjectPrefix || '[Melbourne JobAlert]'} ${jobs.length} New Data & BI Analyst Roles in Melbourne`;
  const htmlContent = generateEmailHtml(jobs, { recipient });

  if (!transporter) {
    const errorMsg = 'SMTP credentials not configured. Please enter your email credentials (e.g. Gmail App Password) to send live emails.';
    console.warn('[Mailer]', errorMsg);
    db.logEmail({
      recipient,
      jobsCount: jobs.length,
      status: 'not_configured',
      error: errorMsg
    });
    return {
      success: false,
      notConfigured: true,
      error: errorMsg,
      previewHtml: htmlContent,
      jobsCount: jobs.length
    };
  }

  try {
    const info = await transporter.sendMail({
      from: emailSettings.from || `"Melbourne JobSeeker" <${emailSettings.smtp.auth.user}>`,
      to: recipient,
      subject,
      html: htmlContent
    });

    console.log(`[Mailer] Successfully sent email to ${recipient}: ${info.messageId}`);

    // Mark sent jobs as emailed
    const markedCount = db.markJobsAsEmailed(jobs.map(j => j.id));

    db.logEmail({
      recipient,
      jobsCount: jobs.length,
      markedAsEmailed: markedCount,
      messageId: info.messageId,
      status: 'success'
    });

    return {
      success: true,
      recipient,
      jobsCount: jobs.length,
      messageId: info.messageId
    };
  } catch (err) {
    console.error('[Mailer] Send failed:', err.message);
    db.logEmail({
      recipient,
      jobsCount: jobs.length,
      status: 'failed',
      error: err.message
    });

    return {
      success: false,
      error: err.message
    };
  }
}

async function sendTestEmail(targetEmail = null) {
  const settings = db.getSettings();
  const recipient = targetEmail || settings.email?.to;

  if (!recipient) {
    return { success: false, error: 'Please specify a recipient email address.' };
  }

  const sampleJobs = db.getAllJobs().slice(0, 3);
  const fallbackSample = sampleJobs.length > 0 ? sampleJobs : [
    {
      id: 'test_1',
      title: 'Senior Data Analyst (Test Alert)',
      company: 'ANZ Banking Group',
      location: 'Docklands VIC (Hybrid)',
      salary: '$135,000 - $155,000 + Super',
      postDate: 'Today',
      description: 'This is a test notification from your Melbourne JobSeeker system to verify that email delivery is working properly.',
      url: 'https://www.seek.com.au',
      source: 'Seek AU',
      tags: ['Test', 'Power BI', 'SQL', 'Melbourne'],
      workType: 'Hybrid'
    }
  ];

  const transporter = createTransporter(settings.email?.smtp);
  if (!transporter) {
    return {
      success: false,
      notConfigured: true,
      error: 'SMTP credentials missing. Please set host, user, and password.'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: settings.email?.from || `"Melbourne JobSeeker" <${settings.email?.smtp?.auth?.user}>`,
      to: recipient,
      subject: '✅ [Melbourne JobSeeker] Test Alert Delivery Confirmation',
      html: generateEmailHtml(fallbackSample, { recipient })
    });

    return {
      success: true,
      recipient,
      messageId: info.messageId
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  sendJobDigestEmail,
  sendTestEmail,
  generateEmailHtml
};
