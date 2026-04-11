function normalizePath(path) {
  if (!path) return '/';
  const normalized = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  return normalized || '/';
}

/**
 * Decorates the sidebar block used for navigation sections.
 * @param {Element} block The sidebar block element
 */
export default async function decorate(block) {
  const wrapper = block.closest('.sidebar-wrapper');
  if (wrapper) wrapper.classList.add('nav-sections');

  const currentPath = normalizePath(window.location.pathname);
  block.querySelectorAll('a[href]').forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });
}
