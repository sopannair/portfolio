import { fetchJSON, renderProjects } from '../global.js';

async function init() {
  const container = document.querySelector('.projects');
  if (!container) return;

  const data = await fetchJSON('../lib/projects.json'); // <-- correct path
  renderProjects(data, container, 'h2'); // render ALL
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
