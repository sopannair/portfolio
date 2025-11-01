import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// --- Module-scope state used by the chart & interactions ---
let currentPieData = [];     // [{ value, label }, ...] for the current pie
let selectedIndex = -1;      // -1 = no selection

// --- Load all projects once and initial render ---
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// --- Helper: filter by a text query (title/desc/year) ---
function setQuery(q) {
  const query = (q ?? '').toLowerCase();
  return projects.filter(p =>
    (p.title ?? '').toLowerCase().includes(query) ||
    (p.description ?? '').toLowerCase().includes(query) ||
    String(p.year ?? '').includes(query)
  );
}

// --- Pie/Legend renderer: draws from the given list of projects ---
function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  if (svg.empty() || legend.empty()) return;

  // Roll up counts by year
  const rolled = d3.rollups(
    projectsGiven,
    v => v.length,
    d => String(d.year ?? 'Unknown')
  );

  // Sort by year desc (optional, looks nice)
  rolled.sort((a, b) => Number(b[0]) - Number(a[0]));

  // Convert to {value, label} the pie/legend expect
  const data = rolled.map(([year, count]) => ({ value: count, label: year }));
  currentPieData = data; // expose for click handlers

  // Slice generator & arc geometry
  const slice = d3.pie().value(d => d.value).sort(null);
  const arcData = slice(data);

  const arc = d3.arc().innerRadius(0).outerRadius(50);

  // Clear previous paths/legend (prevents duplicating on re-render)
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  // Colors
  const palette = d3.schemeTableau10.concat(d3.schemeSet3);
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.label))
    .range(palette.slice(0, data.length));

  // Draw slices
  svg.selectAll('path')
    .data(arcData)
    .join('path')
      .attr('d', d => arc(d))
      .attr('fill', d => color(d.data.label))
      .attr('class', d => (d.index === selectedIndex ? 'selected' : null))
      .on('click', (event, d) => {
        // Toggle selection
        selectedIndex = (selectedIndex === d.index) ? -1 : d.index;

        // Update wedge classes
        svg.selectAll('path')
          .attr('class', dd => (dd.index === selectedIndex ? 'selected' : null));

        // Update legend highlight (assumes same order)
        d3.selectAll('.legend__item')
          .classed('selected', (_, i) => i === selectedIndex);

        // Filter cards + replot pie/legend based on selection
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
          renderPieChart(projects);
        } else {
          const selectedYear = currentPieData[selectedIndex]?.label;
          const filtered = projects.filter(p => String(p.year) === String(selectedYear));
          renderProjects(filtered, projectsContainer, 'h2');
          renderPieChart(filtered);
        }
      })
    .append('title')
      .text(d => `${d.data.label}: ${d.data.value}`);

  // Build legend
  data.forEach(d => {
    legend.append('li')
      .attr('class', 'legend__item')
      .attr('style', `--color:${color(d.label)}`)
      .html(`<span class="legend__swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// --- Initial pie/legend render (full dataset) ---
renderPieChart(projects);

// --- Search wiring: filter as user submits (change). You can swap to 'input' for live typing. ---
const searchInput = document.querySelector('.searchBar');
searchInput?.addEventListener('change', (event) => {
  // New query -> clear any wedge selection
  selectedIndex = -1;

  const filtered = setQuery(event.target.value);
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
});
