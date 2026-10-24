const axios = require('axios');

async function fetchAdzunaJobs(keyword, location = 'Melbourne', config = {}) {
  const appId = config.appId;
  const appKey = config.appKey;

  if (!appId || !appKey) {
    // Adzuna API credentials not configured
    return [];
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/au/search/1?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=10&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}&content-type=application/json`;

    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'MelbourneJobSeeker/1.0 (https://github.com/abcduio/Jobseeker)'
      },
      timeout: 10000
    });

    if (!res.data || !res.data.results) {
      return [];
    }

    return res.data.results.map(item => {
      const salaryMin = item.salary_min ? Math.round(item.salary_min) : null;
      const salaryMax = item.salary_max ? Math.round(item.salary_max) : null;
      let salaryLabel = 'Market Rate (Melbourne VIC)';

      if (salaryMin && salaryMax) {
        salaryLabel = `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} AUD`;
      } else if (salaryMin) {
        salaryLabel = `From $${salaryMin.toLocaleString()} AUD`;
      }

      const tags = ['Melbourne'];
      if (item.category && item.category.label) tags.push(item.category.label);
      if (item.title.toLowerCase().includes('senior')) tags.push('Senior');
      if (item.contract_type) tags.push(item.contract_type);

      return {
        id: `adzuna_${item.id}`,
        title: item.title.replace(/<\/?[^>]+(>|$)/g, ''),
        company: item.company?.display_name || 'Australian Enterprise',
        location: item.location?.display_name || 'Melbourne VIC',
        salary: salaryLabel,
        salaryMin,
        salaryMax,
        postDate: item.created ? item.created.substring(0, 10) : 'Recently',
        postedTimestamp: item.created ? new Date(item.created).getTime() : Date.now(),
        description: (item.description || '').replace(/<\/?[^>]+(>|$)/g, '').substring(0, 300) + '...',
        url: item.redirect_url,
        source: 'Adzuna AU',
        tags: tags.slice(0, 4),
        workType: 'Hybrid'
      };
    });
  } catch (err) {
    console.error(`Adzuna scanner error for "${keyword}":`, err.message);
    return [];
  }
}

module.exports = {
  fetchAdzunaJobs
};
