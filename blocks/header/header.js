import { getMetadata } from "../../scripts/aem.js";
import { loadFragment } from "../fragment/fragment.js";

function normalizePath(path) {
  if (!path) return "/";
  const normalized =
    path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  return normalized || "/";
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata("nav");
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : "/nav";
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = "";
  const nav = document.createElement("nav");
  nav.id = "nav";
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const navBrand = nav.firstElementChild;
  navBrand?.classList.add("nav-brand");

  const embeddedSections = navBrand?.querySelector(".sidebar-wrapper");
  if (embeddedSections) embeddedSections.classList.add("nav-sections");

  const brandLink = navBrand?.querySelector(".button");
  if (brandLink) {
    brandLink.className = "";
    brandLink.closest(".button-container").className = "";
  }

  const navSections = nav.querySelector(".nav-sections");
  if (navSections) {
    const currentPath = normalizePath(window.location.pathname);
    navSections.querySelectorAll("a[href]").forEach((link) => {
      const linkPath = normalizePath(
        new URL(link.href, window.location.origin).pathname,
      );
      if (linkPath === currentPath) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  const navWrapper = document.createElement("div");
  navWrapper.className = "nav-wrapper";
  navWrapper.append(nav);
  block.append(navWrapper);
}
