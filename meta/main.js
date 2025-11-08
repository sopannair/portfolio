import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}


function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        enumerable: false,
        configurable: false
        });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const fmt = d3.format(',');
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // ---- aggregates ----
  const filesRollup = d3.rollups(data, v => v.length, d => d.file);
  const numFiles = filesRollup.length;

  const [maxFile, maxLines] = d3.greatest(filesRollup, d => d[1]) ?? [null, 0];

  const dowLines = d3.rollups(data, v => v.length, d => d.datetime.getDay());
  const [topDow, topDowLines] = d3.greatest(dowLines, d => d[1]) ?? [null, 0];

  // Longest single line by character count
  const longestRow = d3.greatest(data, d => d.length) ?? null;
  const longestChars = longestRow ? longestRow.length : 0;

  const workByPeriod = d3.rollups(
  data,
  (v) => v.length,
  (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
);


  const maxPeriodPair = d3.greatest(workByPeriod, d => d[1]);
  const maxPeriod = maxPeriodPair?.[0];
  const maxPeriodCount = maxPeriodPair?.[1] ?? 0;


  // ---- render ----
  const container = d3.select('#stats');
  const section = container.append('section').attr('class', 'summary');
  section.append('h2').text('Summary');

  const grid = section.append('dl').attr('class', 'stats-grid');

  const tile = (label, value, sub=null) => {
    const card = grid.append('div').attr('class', 'stat');
    card.append('dt').html(label);
    card.append('dd').text(value);
    if (sub) card.append('small').html(sub);
  };

  tile('Commits', fmt(commits.length));
  tile('Files', fmt(numFiles));
  tile('Total LOC', fmt(data.length));
  tile('Max Depth', fmt(d3.max(data, d => d.depth) ?? 0));
  tile('Longest Line', fmt(longestChars));
  tile('Max Lines', fmt(maxLines), maxFile ? `<code>${maxFile}</code>` : null);
  tile('Most Active Day', topDow != null ? DOW[topDow] : '—', `${fmt(topDowLines)} lines`);
  tile(
  'Most Active Period',
  maxPeriod ?? '—',
  `${d3.format(',')(maxPeriodCount)} lines`
);
}



function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  const width = 1000;
  const height = 600;
  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  const xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();

const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

const dots = svg.append('g').attr('class', 'dots');

dots
  .selectAll('circle')
  .data(commits)
  .join('circle')
  .attr('cx', d => xScale(d.datetime))
  .attr('cy', d => yScale(d.hourFrac))
  .attr('r', 5)
  .attr('fill', 'steelblue')
  .on('mouseenter', (event, commit) => {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.classList.remove('hidden'); // show tooltip
    renderTooltipContent(commit);
  })
    .on('mouseleave', () => {
    document.getElementById('commit-link').textContent = '';
    document.getElementById('commit-date').textContent = '';
    });




  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

// Update scales with new ranges
xScale.range([usableArea.left, usableArea.right]);
yScale.range([usableArea.bottom, usableArea.top]);

// Add gridlines BEFORE the axes
const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

// Create gridlines as an axis with no labels and full-width ticks
gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));


// Create the axes
const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

// Add X axis
svg
  .append('g')
  .attr('transform', `translate(0, ${usableArea.bottom})`)
  .call(xAxis);

// Add Y axis
svg
  .append('g')
  .attr('transform', `translate(${usableArea.left}, 0)`)
  .call(yAxis);



}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}


let data = await loadData();
let commits = processCommits(data);

renderScatterPlot(data, commits);


