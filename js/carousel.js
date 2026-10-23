export class ProductCarousel {
    constructor(root) {
        this.root = root;
        this.slides = [...root.querySelectorAll(".slide")];
        this.dotContainer = root.querySelector(".slider-dots");
        this.prev = root.querySelector("[data-carousel-prev]");
        this.next = root.querySelector("[data-carousel-next]");
        this.track = root.querySelector(".slides");
        this.index = 0;
        this.bindEvents();
        this.renderDots();
        this.updateSlider();
    }

    bindEvents() {
        this.prev?.addEventListener("click", () => this.goTo(this.index - 1));
        this.next?.addEventListener("click", () => this.goTo(this.index + 1));
        this.track?.addEventListener(
            "scroll",
            () => {
                const slideWidth = this.track.clientWidth;
                const nextIndex = Math.round(
                    this.track.scrollLeft / slideWidth,
                );
                if (Number.isFinite(nextIndex)) this.index = nextIndex;
                this.updateSlider();
            },
            { passive: true },
        );

        this.slides.forEach((img) => {
            img.addEventListener("click", () => {
                const lightbox = document.querySelector("[data-lightbox]");
                const lightboxImage = document.querySelector(
                    "[data-lightbox-image]",
                );
                if (!lightbox || !lightboxImage) return;
                lightboxImage.src = img.dataset.full || img.src;
                lightbox.classList.add("open");
                lightbox.setAttribute("aria-hidden", "false");
            });
        });
    }

    renderDots() {
        if (!this.dotContainer) return;
        this.dotContainer.innerHTML = this.slides
            .map(
                (_, idx) => `
      <button class="slider-dot ${idx === this.index ? "active" : ""}" type="button" aria-label="Go to slide ${idx + 1}" data-dot-index="${idx}"></button>
    `,
            )
            .join("");

        this.dotContainer.querySelectorAll(".slider-dot").forEach((dot) => {
            dot.addEventListener("click", () =>
                this.goTo(Number(dot.dataset.dotIndex)),
            );
        });
    }

    goTo(index) {
        const max = Math.max(this.slides.length - 1, 0);
        this.index = Math.min(Math.max(index, 0), max);
        if (this.track) {
            this.track.scrollTo({
                left: this.track.clientWidth * this.index,
                behavior: "smooth",
            });
        }
        this.updateSlider();
    }

    updateSlider() {
        this.slides.forEach((slide, idx) => {
            slide.setAttribute(
                "aria-hidden",
                idx === this.index ? "false" : "true",
            );
        });

        const hasMultipleSlides = this.slides.length > 1;
        const isFirstSlide = this.index === 0;
        const isLastSlide = this.index >= this.slides.length - 1;

        if (this.prev) {
            this.prev.disabled = !hasMultipleSlides || isFirstSlide;
            this.prev.hidden = !hasMultipleSlides || isFirstSlide;
        }

        if (this.next) {
            this.next.disabled = !hasMultipleSlides || isLastSlide;
            this.next.hidden = !hasMultipleSlides || isLastSlide;
        }

        this.renderDots();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const carousels = document.querySelectorAll("[data-carousel]");
    carousels.forEach((carousel) => new ProductCarousel(carousel));

    const lightbox = document.querySelector("[data-lightbox]");
    if (lightbox) {
        const close = lightbox.querySelector("[data-lightbox-close]");
        close?.addEventListener("click", () => {
            lightbox.classList.remove("open");
            lightbox.setAttribute("aria-hidden", "true");
        });
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) {
                lightbox.classList.remove("open");
                lightbox.setAttribute("aria-hidden", "true");
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && lightbox.classList.contains("open")) {
                lightbox.classList.remove("open");
                lightbox.setAttribute("aria-hidden", "true");
            }
        });
    }
});
