# 🇦🇺 Melbourne JobSeeker

> Automated job scanner and scheduled email digest system tailored for **Data Analysts**, **Senior Data Analysts**, **Business Intelligence Analysts**, **Senior BI Analysts**, and **Data Engineers** in **Melbourne, Victoria, Australia**.

![Melbourne JobSeeker Banner](https://img.shields.io/badge/Melbourne-Australia%20%F0%9F%87%A6%F0%9F%87%BA-blue?style=for-the-badge)
![Roles](https://img.shields.io/badge/Target%20Roles-Data%20%7C%20BI%20%7C%20Engineering-indigo?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge)

---

## 🌟 Key Features

1. **Targeted Melbourne Job Portals**:
   - **Seek Australia Direct**: Australia's #1 employment marketplace with 1-click curated searches for Melbourne data jobs.
   - **LinkedIn Australia Live Guest Scanner**: Automatically crawls active Melbourne postings with full role descriptions, criteria, and apply links.
   - **Adzuna Australia**: Official AU API integration for structured salary ranges and job metadata.
   - **Melbourne Top Employers Seed Feed**: Live verified postings across ANZ, NAB, Telstra, REA Group, Coles Group, SEEK, Canva, Atlassian, and Victorian Government.
   - **Remote Australia / APAC**: Remote data roles offering Melbourne AUD salaries.

2. **Automated Scheduled Email Digests**:
   - **Configurable Frequency**: Daily, Twice Daily, Every 6 Hours, Every 12 Hours, or Weekly.
   - **Customizable Delivery Time**: Set exact time of day (e.g. `08:30 AM`) in Melbourne Time (`Australia/Melbourne` AEDT/AEST).
   - **Smart Deduplication**: Only sends newly discovered jobs to prevent inbox clutter.
   - **Direct Apply Links**: Every job card includes direct links to apply on Seek or LinkedIn.
   - **Full Job Details**: Post date, company, Melbourne suburb (Docklands, Richmond, Melbourne CBD, Clayton, etc.), salary package in AUD, and key skills tags (SQL, Power BI, Python, Snowflake, etc.).

3. **Modern Web Dashboard**:
   - **Live Melbourne Time Clock** in the header.
   - **Interactive Job Feed**: Instant search, filter by role, salary minimum, work type (Hybrid, Remote, On-site), and status.
   - **Job Management**: Bookmark / Save jobs, mark as applied, or inspect full requirements in the modal.
   - **Live Email Preview Tab**: Preview the exact responsive HTML email in your browser before it gets delivered.
   - **1-Click Manual Triggers**: "Scan Jobs Now" and "Send Email Digest Now".
   - **Scan History & Email Delivery Logs**: Track scan counts, new additions, and email delivery status.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/abcduio/Jobseeker.git
cd Jobseeker
npm install
```

### 2. Start the Application

```bash
npm start
```

Visit the dashboard in your browser:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📧 Email Notification Setup

You can configure your email notifications directly from the **Alerts & Schedule Settings** tab on the web dashboard or via environment variables in `.env`.

### Setting up with Gmail (Recommended):
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is enabled.
3. Under *2-Step Verification*, navigate to **App passwords** (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Create a new app password named `Melbourne JobSeeker` and copy the 16-character code.
5. In the JobSeeker dashboard under **Settings**:
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **SMTP User**: `your.email@gmail.com`
   - **SMTP Password**: Paste your 16-character Google App Password.
   - **Recipient Email**: Where you want alerts delivered.
6. Click **Send Test Email** to confirm delivery!

---

## ⏰ Schedule & Time Settings

You can customize the alert schedule to match your daily routine:
- **Daily at 08:30 AM AEDT** (Recommended): Catches all new overnight listings before business hours.
- **Twice Daily**: 08:30 AM morning digest + 06:30 PM evening digest.
- **Weekly Summary**: Every Monday morning with all roles from the week.

All schedules operate in the **Australia/Melbourne** timezone.

---

## 🛠️ Command-Line Usage

You can also run scans and send alerts via terminal or system cron:

```bash
# Run a scan and update the database
npm run scan

# Run a scan AND send an email digest immediately to the recipient
npm run scan:notify
```

---

## 📦 Pushing to GitHub

To push this repository to your GitHub account:

### Option A: Using GitHub CLI (`gh`)
```bash
# 1. Log in to GitHub
gh auth login

# 2. Create the remote repository and push
gh repo create Jobseeker --public --source=. --push
```

### Option B: Using Standard Git
```bash
# 1. Create a repository named 'Jobseeker' at https://github.com/new
# 2. Link and push:
git remote add origin https://github.com/YOUR_USERNAME/Jobseeker.git
git push -u origin main
```

Or simply run:
```bash
npm run github:setup
```

---

## 📁 Repository Structure

```
Jobseeker/
├── server/
│   ├── index.js              # Express app, REST API, static asset server
│   ├── config.js             # Configuration defaults (Melbourne criteria, ports)
│   ├── db.js                 # Crash-resilient persistent JSON database
│   ├── scheduler.js          # Cron scheduler (Melbourne timezone, auto-reschedule)
│   ├── email/
│   │   ├── mailer.js         # Nodemailer transporter & email sender
│   │   └── template.js       # Responsive HTML email digest template
│   └── scanners/
│       ├── index.js          # Scanner orchestrator & deduplicator
│       ├── linkedin.js       # LinkedIn AU live guest API crawler
│       ├── adzuna.js         # Adzuna Australia API client
│       ├── remotive.js       # Remote Australia/APAC data role client
│       └── melbourne_seed.js # Real Melbourne top employers (ANZ, NAB, Seek, Coles, etc.)
├── public/
│   ├── index.html            # Main single-page web dashboard
│   ├── css/
│   │   └── style.css         # Modern dark glassmorphism design system
│   └── js/
│       ├── api.js            # REST API client
│       └── app.js            # Interactive SPA controller
├── scripts/
│   ├── run_scan.js           # CLI runner for scans and digests
│   └── setup_github.sh       # GitHub repository setup helper
├── .env.example              # Sample environment variables
├── .gitignore                # Git ignore rules
└── package.json              # Project metadata & dependencies
```

---

## 🇦🇺 Target Job Roles Covered

- **Data Analyst**
- **Senior Data Analyst**
- **Business Intelligence Analyst**
- **Senior Business Intelligence Analyst**
- **Data Engineer**
- **Senior Data Engineer**
- **Analytics Engineer**
- **BI Developer**

---

## 📄 License

MIT License. Built for job seekers in Melbourne, Victoria, Australia.
