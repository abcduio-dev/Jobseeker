const path = require('path');
require('dotenv').config();

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'jobseeker.json');

const DEFAULT_SETTINGS = {
  // Target Search Criteria
  targetTitles: [
    'Data Analyst',
    'Senior Data Analyst',
    'Business Intelligence Analyst',
    'Senior Business Intelligence Analyst',
    'Data Engineer',
    'Senior Data Engineer',
    'Analytics Engineer',
    'BI Developer'
  ],
  location: 'Melbourne VIC, Australia',
  workTypes: ['All', 'Hybrid', 'Remote', 'On-site'],
  minSalaryAUD: 90000,
  skillsKeywords: ['SQL', 'Power BI', 'Python', 'Tableau', 'Snowflake', 'AWS', 'dbt', 'Azure'],

  // Email Notification Settings
  email: {
    enabled: true,
    to: process.env.NOTIFICATION_EMAIL || '',
    subjectPrefix: '[Melbourne JobAlert]',
    from: process.env.SMTP_FROM || '"Melbourne JobSeeker" <jobs@melbourne-jobs.local>',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    },
    sendOnlyNewJobs: true,
    maxJobsPerEmail: 25
  },

  // Automated Scheduler Settings
  schedule: {
    enabled: true,
    frequency: 'daily', // 'daily', 'twice_daily', 'every_6_hours', 'every_12_hours', 'weekly'
    timeOfDay: '08:30',  // 24h format (HH:MM) in Melbourne Time
    dayOfWeek: 1,        // 1 = Monday (for weekly)
    timezone: 'Australia/Melbourne'
  },

  // Enabled Scanners
  scanners: {
    linkedin: true,
    adzuna: true,
    remotive: true,
    seekDirect: true,
    melbourneEmployers: true
  },

  // Adzuna API credentials (optional free account)
  adzuna: {
    appId: process.env.ADZUNA_APP_ID || '',
    appKey: process.env.ADZUNA_APP_KEY || ''
  }
};

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  DB_FILE,
  PORT: process.env.PORT || 3000,
  DEFAULT_SETTINGS
};
