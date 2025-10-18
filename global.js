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
  { url: 'cv/', title: 'CV' }
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  // next step: create link and add it to nav
  if (!url.startsWith('http')) {
  url = BASE_PATH + url;
}
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

a.classList.toggle(
  'current',
  a.host === location.host && a.pathname === location.pathname,
);

