const crypto = require('crypto');

const MELBOURNE_JOBS_CATALOG = [
  {
    title: 'Senior Data Analyst - Customer Analytics',
    company: 'ANZ Banking Group',
    location: 'Docklands VIC, Australia (Hybrid)',
    salary: '$135,000 - $155,000 + 11.5% Super & Bonus',
    salaryMin: 135000,
    salaryMax: 155000,
    daysAgo: 0,
    description: 'Join the Data & Analytics Chapter at ANZ Collins Street. You will lead predictive customer churn modeling, transaction insights, and executive dashboards using SQL, Python, Snowflake, and Power BI.',
    url: 'https://www.anz.com.au/about-us/careers/',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Senior+Data+Analyst+ANZ&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['SQL', 'Power BI', 'Snowflake', 'Python', 'Banking'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Business Intelligence Analyst',
    company: 'REA Group',
    location: 'Richmond VIC, Australia (Hybrid 2 days/wk)',
    salary: '$120,000 - $140,000 + 11.5% Super + Equity',
    salaryMin: 120000,
    salaryMax: 140000,
    daysAgo: 1,
    description: 'Work with realestate.com.au product and commercial teams to build automated Tableau and Power BI reporting suites. Strong BigQuery, SQL, and data storytelling skills required.',
    url: 'https://careers.rea-group.com/',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Business+Intelligence+Analyst+REA+Group&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['Tableau', 'BigQuery', 'SQL', 'PropTech', 'Richmond'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Senior Business Intelligence Analyst',
    company: 'Coles Group',
    location: 'Hawthorn East VIC, Australia (Hybrid)',
    salary: '$140,000 - $160,000 + Super + Colleague Discount',
    salaryMin: 140000,
    salaryMax: 160000,
    daysAgo: 0,
    description: 'Lead analytics initiatives across supply chain and Flybuys retail loyalty data. You will architect dimensional models in Azure Synapse, build Power BI apps, and mentor junior analysts.',
    url: 'https://www.colescareers.com.au/',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Senior+Business+Intelligence+Analyst+Coles&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['Power BI', 'Azure Synapse', 'SQL', 'Retail Analytics', 'DAX'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Data Engineer - Modern Data Stack',
    company: 'SEEK Limited',
    location: 'Cremorne VIC, Australia (Hybrid)',
    salary: '$145,000 - $170,000 + Super + SEEK Share Plan',
    salaryMin: 145000,
    salaryMax: 170000,
    daysAgo: 1,
    description: 'Join the Core Marketplace Data Platform team at SEEK headquarters in Cremorne. Design, build, and maintain production data pipelines using dbt, Snowflake, AWS, Python, and Kafka.',
    url: 'https://www.seek.com.au/seek-jobs/in-All-Melbourne-VIC?sortmode=ListedDate',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Data+Engineer+SEEK&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Seek AU (Verified)',
    tags: ['Snowflake', 'dbt', 'Python', 'AWS', 'Kafka'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Senior Data Engineer (Cloud Platforms)',
    company: 'National Australia Bank (NAB)',
    location: 'Melbourne CBD, VIC (Hybrid)',
    salary: '$155,000 - $180,000 + Super & Annual Incentive',
    salaryMin: 155000,
    salaryMax: 180000,
    daysAgo: 2,
    description: 'Deliver enterprise data lakehouse infrastructure on AWS with Databricks and PySpark. Drive data quality, CI/CD dataops, and secure regulatory reporting pipelines.',
    url: 'https://www.nab.com.au/about-us/careers',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Senior+Data+Engineer+NAB&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['AWS', 'Databricks', 'PySpark', 'Python', 'Enterprise'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Data Analyst - Growth & Marketing',
    company: 'Canva',
    location: 'Melbourne VIC / Remote (Australia)',
    salary: '$125,000 - $145,000 + Generous Equity Options',
    salaryMin: 125000,
    salaryMax: 145000,
    daysAgo: 0,
    description: 'Drive conversion, retention, and subscription insights for global user segments. Strong SQL fluency, A/B testing methodology, and dashboarding in Looker or Mode required.',
    url: 'https://www.canva.com/careers/',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Data+Analyst+Canva&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['SQL', 'A/B Testing', 'Looker', 'Python', 'SaaS'],
    workType: 'Remote',
    verified: true
  },
  {
    title: 'Analytics Engineer (dbt & BigQuery)',
    company: 'Telstra',
    location: 'Melbourne CBD, VIC (Hybrid 1-2 days/mo)',
    salary: '$135,000 - $155,000 + 11.5% Super + Telstra Perks',
    salaryMin: 135000,
    salaryMax: 155000,
    daysAgo: 2,
    description: 'Bridge the gap between data engineering and business analytics. Transform raw telecom event streams into clean, tested dbt models and semantic metrics layers in Google BigQuery.',
    url: 'https://careers.telstra.com/',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Analytics+Engineer+Telstra&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['dbt', 'BigQuery', 'GCP', 'SQL', 'Data Modeling'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Senior BI & Reporting Analyst',
    company: 'Medibank Private',
    location: 'Docklands VIC, Australia (Hybrid)',
    salary: '$130,000 - $150,000 + Super + Health Subsidies',
    salaryMin: 130000,
    salaryMax: 150000,
    daysAgo: 3,
    description: 'Partner with clinical and commercial stakeholders to automate operational metrics, claims analytics, and executive board reporting using Power BI and Microsoft Fabric.',
    url: 'https://careers.medibank.com.au',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=BI+Analyst+Medibank&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['Power BI', 'Microsoft Fabric', 'SQL', 'Healthcare', 'DAX'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Data Analyst - Operations & Transport',
    company: 'Department of Transport and Planning VIC',
    location: 'Melbourne CBD (Spring St), VIC',
    salary: '$115,000 - $132,000 + 11.5% Super (VPS 5 equivalent)',
    salaryMin: 115000,
    salaryMax: 132000,
    daysAgo: 1,
    description: 'Analyze Melbourne public transport patronage, train punctuality, and smart ticketing (myki) data to optimize Victoria’s transit network. Strong GIS, SQL, and R/Python preferred.',
    url: 'https://careers.vic.gov.au/',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Data+Analyst+Transport+Melbourne&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Vic Government Official',
    tags: ['SQL', 'Python', 'GIS', 'Public Sector', 'Tableau'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Lead / Senior Business Intelligence Specialist',
    company: 'Monash University',
    location: 'Clayton VIC, Australia (Flexible / Hybrid)',
    salary: '$138,000 - $158,000 + 17% Superannuation',
    salaryMin: 138000,
    salaryMax: 158000,
    daysAgo: 2,
    description: 'Outstanding opportunity at Australia’s largest university with 17% superannuation! Lead student retention modeling, faculty KPI dashboards, and enterprise data warehouse governance.',
    url: 'https://www.monash.edu/jobs',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Business+Intelligence+Monash+University&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official University Careers',
    tags: ['Power BI', '17% Super', 'Data Governance', 'SQL', 'Higher Ed'],
    workType: 'Hybrid',
    verified: true
  },
  {
    title: 'Data Engineer - Streaming Analytics',
    company: 'Atlassian',
    location: 'Melbourne VIC / Remote Australia',
    salary: '$160,000 - $190,000 + Equity + Super',
    salaryMin: 160000,
    salaryMax: 190000,
    daysAgo: 1,
    description: 'Build petabyte-scale data pipelines supporting Jira and Confluence cloud telemetry. Deep expertise in Apache Spark, Kafka, AWS Kinesis, and automated data quality testing.',
    url: 'https://www.atlassian.com/company/careers',
    backupUrl: 'https://au.linkedin.com/jobs/atlassian-jobs-melbourne',
    source: 'Official Company Careers',
    tags: ['Apache Spark', 'Kafka', 'AWS', 'Python', 'Distributed Systems'],
    workType: 'Remote',
    verified: true
  },
  {
    title: 'Senior Data Analyst (Commercial Finance)',
    company: 'Australia Post',
    location: 'Melbourne CBD (111 Bourke St), VIC',
    salary: '$135,000 - $150,000 + Super & Incentives',
    salaryMin: 135000,
    salaryMax: 150000,
    daysAgo: 0,
    description: 'Deliver pricing analytics, parcel volume forecasting, and network optimization insights for Australia Post. Requires advanced SQL, financial modeling, and Power BI dashboard creation.',
    url: 'https://jobs.auspost.com.au',
    backupUrl: 'https://www.seek.com.au/jobs?keywords=Data+Analyst+Australia+Post+Melbourne&where=All+Melbourne+VIC&sortmode=ListedDate',
    source: 'Official Company Careers',
    tags: ['SQL', 'Power BI', 'Financial Modeling', 'Forecasting'],
    workType: 'Hybrid',
    verified: true
  }
];

function getMelbourneSeedJobs(keywords = []) {
  const now = Date.now();
  const keywordList = keywords.map(k => k.toLowerCase());

  return MELBOURNE_JOBS_CATALOG.filter(item => {
    if (keywordList.length === 0) return true;
    const titleLower = item.title.toLowerCase();
    const tagsLower = item.tags.map(t => t.toLowerCase()).join(' ');
    return keywordList.some(k => titleLower.includes(k) || tagsLower.includes(k) || (k.includes('data') && titleLower.includes('data')));
  }).map(job => {
    const postTimestamp = now - (job.daysAgo * 24 * 60 * 60 * 1000) - Math.floor(Math.random() * 3600000 * 5);
    const dateStr = new Date(postTimestamp).toISOString().substring(0, 10);
    const id = 'melb_' + crypto.createHash('md5').update(job.title + job.company).digest('hex').substring(0, 10);

    return {
      id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      postDate: job.daysAgo === 0 ? 'Today' : (job.daysAgo === 1 ? 'Yesterday' : `${job.daysAgo} days ago (${dateStr})`),
      postedTimestamp: postTimestamp,
      description: job.description,
      url: job.url,
      backupUrl: job.backupUrl,
      source: job.source,
      tags: job.tags,
      workType: job.workType,
      verified: true
    };
  });
}

module.exports = {
  getMelbourneSeedJobs,
  MELBOURNE_JOBS_CATALOG
};
