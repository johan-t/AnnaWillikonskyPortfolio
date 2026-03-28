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

  const stage = document.createElement("div");
  stage.className = "fotos-stage";
  slides.forEach((slide) => stage.append(slide));

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
  block.replaceChildren(viewport, controls);

  let activeIndex = 0;

  const render = () => {
    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      if (isActive) {
        slide.removeAttribute("inert");
      } else {
        slide.setAttribute("inert", "");
      }
    });

    counter.textContent = formatCounter(activeIndex, slides.length);
    prevButton.disabled = slides.length < 2;
    nextButton.disabled = slides.length < 2;
  };

  const setActiveSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
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
}
