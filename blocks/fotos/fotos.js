function createButton(direction) {
  const button = document.createElement("button");
  button.className = `fotos-nav fotos-nav-${direction}`;
  button.type = "button";
  button.setAttribute(
    "aria-label",
    direction === "prev" ? "Previous slide" : "Next slide",
  );
  button.innerHTML = direction === "prev" ? "&lsaquo;" : "&rsaquo;";
  return button;
}

function formatCounter(index, total) {
  return `${index + 1}/${total}`;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const slides = rows
    .map((row, index) => {
      const slide = document.createElement("div");
      slide.className = "fotos-slide";
      slide.dataset.index = index;

      const inner =
        row.firstElementChild?.cloneNode(true) || row.cloneNode(true);
      inner.classList.add("fotos-slide-inner");

      const image = inner.querySelector("img");
      if (image) {
        slide.classList.add("fotos-slide-media");
        image.loading = index === 0 ? "eager" : "lazy";
        image.decoding = "async";
      } else {
        slide.classList.add("fotos-slide-text");
      }

      slide.append(inner);
      return slide;
    })
    .filter(
      (slide) =>
        slide.textContent.trim() || slide.querySelector("img, picture"),
    );

  if (!slides.length) {
    block.classList.add("is-empty");
    return;
  }

  const mediaSlides = slides.filter((s) => s.classList.contains("fotos-slide-media"));
  const textSlides = slides.filter((s) => s.classList.contains("fotos-slide-text"));

  const stage = document.createElement("div");
  stage.className = "fotos-stage";
  mediaSlides.forEach((slide) => stage.append(slide));

  const viewport = document.createElement("div");
  viewport.className = "fotos-viewport";
  viewport.append(stage);

  const prevButton = createButton("prev");
  const nextButton = createButton("next");

  const counter = document.createElement("p");
  counter.className = "fotos-counter";
  counter.setAttribute("aria-live", "polite");

  const controls = document.createElement("div");
  controls.className = "fotos-controls";
  controls.append(prevButton, counter, nextButton);

  const children = [viewport, controls];

  if (textSlides.length) {
    const caption = document.createElement("div");
    caption.className = "fotos-caption";
    textSlides.forEach((s) => {
      caption.append(...s.querySelector(".fotos-slide-inner").childNodes);
    });
    children.push(caption);
  }

  block.replaceChildren(...children);

  let activeIndex = 0;

  // Gap kept between a wide image and the sidebar when the image can't be
  // fully centered on the viewport.
  const SIDEBAR_GAP = 24;
  const desktop = window.matchMedia("(min-width: 600px)");

  // Center the active image on the viewport, but never let it overlap the
  // sidebar: shift left toward the page centre only as far as the image's left
  // edge allows. Wide images on narrow windows simply shift less.
  const adjustShift = () => {
    if (!desktop.matches) {
      block.style.removeProperty("--fotos-shift");
      return;
    }
    const header = document.querySelector("header");
    const image =
      stage.querySelector(".fotos-slide.is-active img") ||
      stage.querySelector("img");
    const wrapper = block.closest(".fotos-wrapper") || block.parentElement;
    if (!header || !image || !wrapper) return;

    const imageWidth = image.getBoundingClientRect().width;
    if (!imageWidth) return; // not laid out / loaded yet

    // wrapper is not transformed, so its geometry is stable regardless of shift
    const content = wrapper.getBoundingClientRect();
    const contentCenter = content.left + content.width / 2;
    const centeredShift = contentCenter - window.innerWidth / 2;
    const imageLeftUnshifted = contentCenter - imageWidth / 2;
    const sidebarRight = header.getBoundingClientRect().right;
    const maxShiftNoOverlap = imageLeftUnshifted - (sidebarRight + SIDEBAR_GAP);

    const shift = Math.max(0, Math.min(centeredShift, maxShiftNoOverlap));
    block.style.setProperty("--fotos-shift", `${-shift}px`);
  };

  const scheduleAdjust = () => window.requestAnimationFrame(adjustShift);

  const render = () => {
    mediaSlides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      if (isActive) {
        slide.removeAttribute("inert");
      } else {
        slide.setAttribute("inert", "");
      }
    });

    counter.textContent = formatCounter(activeIndex, mediaSlides.length);
    prevButton.disabled = mediaSlides.length < 2;
    nextButton.disabled = mediaSlides.length < 2;
    scheduleAdjust();
  };

  const setActiveSlide = (index) => {
    activeIndex = (index + mediaSlides.length) % mediaSlides.length;
    render();
  };

  prevButton.addEventListener("click", () => setActiveSlide(activeIndex - 1));
  nextButton.addEventListener("click", () => setActiveSlide(activeIndex + 1));

  block.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveSlide(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveSlide(activeIndex + 1);
    }
  });

  block.tabIndex = 0;
  render();

  // Recompute the shift when the layout can change or images finish loading.
  window.addEventListener("resize", scheduleAdjust);
  desktop.addEventListener("change", scheduleAdjust);
  mediaSlides.forEach((slide) => {
    const img = slide.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", scheduleAdjust, { once: true });
    }
  });
}
