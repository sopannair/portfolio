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