let allCountries = [];

const searchInput = document.getElementById('search');
const continentFilter = document.getElementById('continent-filter');
const sortBy = document.getElementById('sort-by');
const sortOrder = document.getElementById('sort-order');
const tableBody = document.getElementById('table-body');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const loadingEl = document.getElementById('loading');
const noResults = document.getElementById('no-results');

function formatNum(n) {
  if (n === undefined || n === null) return 'N/A';
  return Number(n).toLocaleString();
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function hideError() {
  errorBanner.classList.add('hidden');
}

async function loadGlobal() {
  try {
    const res = await fetch('/api/global');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    const d = json.data;
    document.getElementById('g-cases').textContent = formatNum(d.cases);
    document.getElementById('g-deaths').textContent = formatNum(d.deaths);
    document.getElementById('g-recovered').textContent = formatNum(d.recovered);
    document.getElementById('g-active').textContent = formatNum(d.active);
  } catch (err) {
    document.getElementById('g-cases').textContent = 'Error';
    document.getElementById('g-deaths').textContent = 'Error';
    document.getElementById('g-recovered').textContent = 'Error';
    document.getElementById('g-active').textContent = 'Error';
  }
}

async function loadCountries() {
  loadingEl.classList.remove('hidden');
  try {
    const res = await fetch('/api/countries');
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    allCountries = json.data;
    hideError();
    renderTable();
  } catch (err) {
    showError(err.message || 'Could not load country data. Please try again later.');
  } finally {
    loadingEl.classList.add('hidden');
  }
}

function renderTable() {
  const query = searchInput.value.toLowerCase();
  const continent = continentFilter.value;
  const field = sortBy.value;
  const order = sortOrder.value;

  let filtered = allCountries.filter(c => {
    const matchSearch = c.country.toLowerCase().includes(query);
    const matchContinent = continent === '' || c.continent === continent;
    return matchSearch && matchContinent;
  });

  filtered.sort((a, b) => {
    const valA = a[field] || 0;
    const valB = b[field] || 0;
    return order === 'desc' ? valB - valA : valA - valB;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  tableBody.innerHTML = filtered.map((c, i) => {
    const cfr = c.cases ? ((c.deaths / c.cases) * 100).toFixed(2) : 'N/A';
    return `
      <tr>
        <td>${i + 1}</td>
        <td>
          <img class="flag" src="${c.countryInfo.flag}" alt="${c.country} flag" />
          ${c.country}
        </td>
        <td>${formatNum(c.cases)}</td>
        <td>${formatNum(c.deaths)}</td>
        <td>${formatNum(c.recovered)}</td>
        <td>${formatNum(c.active)}</td>
        <td>${formatNum(c.population)}</td>
        <td>${cfr}%</td>
      </tr>
    `;
  }).join('');
}

// Event listeners
searchInput.addEventListener('input', renderTable);
continentFilter.addEventListener('change', renderTable);
sortBy.addEventListener('change', renderTable);
sortOrder.addEventListener('change', renderTable);

// Init
loadGlobal();
loadCountries();
