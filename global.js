console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/portfolio/'; // GitHub Pages repo name

// --- Inject color scheme switch (top-right) ---
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector('.color-scheme select');

if ('colorScheme' in localStorage) {
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', savedScheme);
  select.value = savedScheme; // keep dropdown in sync
}


select.addEventListener('input', (event) => {
  const newScheme = event.target.value;
  console.log('color scheme changed to', newScheme);

  // Apply the scheme to the root element
  document.documentElement.style.setProperty('color-scheme', newScheme);

  // Save the user’s preference for next time
  localStorage.colorScheme = newScheme;
});


let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'meta/', title: 'Meta' },
  { url: 'cv/', title: 'CV' }
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith('http')) url = BASE_PATH + url;
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

// Highlight current page link
const navLinks = nav.querySelectorAll('a');
navLinks.forEach((a) => {
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h3') {
  containerElement.innerHTML = '';

  for (const project of projects) {
    const article = document.createElement('article');

    // wrap description + year together in a div so they stay in same grid cell
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      ${project.image ? `<img src="${project.image}" alt="${project.title}">` : ''}
      <div class="project-details">
        ${project.description ? `<p>${project.description}</p>` : ''}
        ${project.year ? `<p class="project-year"><strong>${project.year}</strong></p>` : ''}
      </div>
    `;

    containerElement.appendChild(article);
  }
}


// --- Fetch GitHub data helper ---
export async function fetchGitHubData(username) {
  // Uses your existing fetchJSON utility to get data from GitHub’s API
  return fetchJSON(`https://api.github.com/users/${username}`);
}
