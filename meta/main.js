import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';



let xScale;
let yScale;

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

function createBrushSelector(svg) {
  // Create brush
svg.call(d3.brush().on('start brush end', brushed));

// Raise dots and everything after overlay
svg.selectAll('.dots, .overlay ~ *').raise();
}


function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;   // brush pixel bounds
  const x = xScale(commit.datetime);        // point pixel coords
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}


function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height, 0]);

  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits, (d) => d.id) // change this line
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.5)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', event => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // ... axes and gridlines (you can leave that part unchanged)





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
    .attr('class', 'x-axis') // new line to mark the g tag
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // just for consistency
    .call(yAxis);

  createBrushSelector(svg)


}

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

// Reuse existing axis group instead of appending a new one
svg.select('.x-axis').call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
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
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');

  // Nothing selected -> clear and bail
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap(d => d.lines);

  // Count lines per language
  const roll = d3.rollups(lines, v => v.length, d => d.type); // [[lang, count], ...]
  // Sort by count desc
  roll.sort((a, b) => d3.descending(a[1], b[1]));

  const total = lines.length;
  const fmtPct = d3.format('.1~%');

  // Build card grid
  const grid = document.createElement('div');
  grid.className = 'lang-grid';

  for (const [language, count] of roll) {
    const pct = fmtPct(count / total);

    const card = document.createElement('div');
    card.className = 'lang-card';

    const name = document.createElement('div');
    name.className = 'lang-name';
    name.textContent = (language || '').toUpperCase();

    const linesEl = document.createElement('div');
    linesEl.className = 'lang-lines';
    linesEl.textContent = `${count} lines`;

    const pctEl = document.createElement('div');
    pctEl.className = 'lang-pct';
    pctEl.textContent = `(${pct})`;

    card.append(name, linesEl, pctEl);
    grid.appendChild(card);
  }

  // Inject grid into your existing element
  container.innerHTML = '';
  container.appendChild(grid);
}

function setCommitMaxTime(maxTime) {
  // 1. Store new max time
  commitMaxTime = maxTime;

  // 2. Compute slider value from time (0–100)
  commitProgress = timeScale(maxTime);
  const slider = document.getElementById('commit-progress');
  slider.value = commitProgress;

  // 3. Update <time> label
  const timeEl = document.getElementById('commit-time');
  timeEl.textContent = commitMaxTime.toLocaleString();

  // 4. Filter commits & update visuals
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}


let data = await loadData();
let commits = processCommits(data);

// Sort commits chronologically (oldest → newest)
commits = d3.sort(commits, d => d.datetime);


renderScatterPlot(data, commits);

let commitProgress = 100;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);


// Will get updated as user changes slider
let filteredCommits = commits;



function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      // This code only runs when the div is initially rendered
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').append('code');
          div.append('dd');
        }),
    );

  // This code updates the div info
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  filesContainer.select('dt > code').text((d) => d.name);
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('--color', (d) => colors(d.type));


}




function onTimeSliderChange(event) {
  // Slider gives us a 0–100 value
  commitProgress = +event.target.value;

  // Map slider value -> Date
  const maxTime = timeScale.invert(commitProgress);

  // Delegate to shared helper
  setCommitMaxTime(maxTime);
}


document
  .getElementById('commit-progress')
  .addEventListener('input', onTimeSliderChange);

// Call once to initialize
onTimeSliderChange({ target: document.getElementById('commit-progress') });


d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

function onStepEnter(response) {
  const commit = response.element.__data__;
  const dt = commit.datetime;

  // Log if you still want to debug
  console.log(dt);

  // Use the same pipeline as the slider:
  setCommitMaxTime(dt);
}


const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);