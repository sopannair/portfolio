import { fetchJSON, renderProjects } from './global.js';

async function init() {
  // fetch from /lib/projects.json (one level up)
  const projects = await fetchJSON('../lib/projects.json');

  // take first 3 projects
  const latestProjects = projects.slice(0, 3);

  // find the container
  const container = document.querySelector('.projects');
  if (!container) {
    console.error('No .projects container found');
    return;
  }

  // render them
  renderProjects(latestProjects, container, 'h2');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
