const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Helper: fetch data from disease.sh API
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse API response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Route: get all countries
app.get('/api/countries', async (req, res) => {
  try {
    const data = await fetchData('https://disease.sh/v3/covid-19/countries');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch country data. The API may be down.' });
  }
});

// Route: get global stats
app.get('/api/global', async (req, res) => {
  try {
    const data = await fetchData('https://disease.sh/v3/covid-19/all');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch global data. The API may be down.' });
  }
});

// Route: get stats by continent
app.get('/api/continents', async (req, res) => {
  try {
    const data = await fetchData('https://disease.sh/v3/covid-19/continents');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch continent data. The API may be down.' });
  }
});

// Route: get single country
app.get('/api/country/:name', async (req, res) => {
  try {
    const country = encodeURIComponent(req.params.name);
    const data = await fetchData(`https://disease.sh/v3/covid-19/countries/${country}`);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, error: `Country "${req.params.name}" not found.` });
  }
});

// Health check endpoint (useful for load balancer)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: process.env.SERVER_NAME || 'web' });
});

app.listen(PORT, () => {
  console.log(`Health Tracker running on port ${PORT}`);
});
