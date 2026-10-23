import { formatCurrency, state } from "./app.js";
import { ProductCarousel } from "./carousel.js";

const productCatalog = {
    currentPageId: null,
    sourceData: null,
    filter: "All",
};

async function loadCatalogPage() {
    const pageId =
        new URLSearchParams(window.location.search).get("page") || "cakes";
    productCatalog.currentPageId = pageId;

    const pageMeta = state.pageMap.get(pageId);
    if (!pageMeta || Number(pageMeta.enabled) !== 1) {
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(`./data/${pageMeta.data}`, {
            cache: "no-store",
        });
        if (!response.ok) throw new Error("Catalog fetch failed");
        const data = await response.json();
        productCatalog.sourceData = data;
        renderCatalog(data);
    } catch (error) {
        console.error(error);
        const root = document.querySelector("[data-page-root]");
        if (root) {
            root.innerHTML = `
        <div class="container section">
          <div class="status-box" role="alert">
            <h2>We could not load this menu right now</h2>
            <p>Please refresh the page or check back soon.</p>
          </div>
        </div>
      `;
        }
    }
}

function getFilteredItems() {
    const items = productCatalog.sourceData?.items || [];
    if (productCatalog.filter === "All") return items;
    return items.filter((item) => item.category === productCatalog.filter);
}

function isExpired(item) {
    return (
        !!item.validTill &&
        new Date(item.validTill) < new Date(new Date().toDateString())
    );
}

function renderProductCard(item) {
    const isAvailable = item.available !== false && !isExpired(item);
    const cheapestSize = (item.options?.sizes || []).reduce(
        (smallest, current) => {
            const price = Number(current.price || 0);
            return price < smallest ? price : smallest;
        },
        Number.POSITIVE_INFINITY,
    );
    const displayPrice = Number.isFinite(cheapestSize) ? cheapestSize : 0;
    const displayOriginal = item.originalPrice
        ? ` <span class="old">${formatCurrency(item.originalPrice)}</span>`
        : "";

    return `
    <article class="product-card" data-product-id="${item.id}">
      <div class="image-slider" data-carousel>
        <div class="slides">
          ${(item.images || [])
              .map(
                  (image, idx) => `
            <img class="slide" src="${image}" alt="${item.name} image ${idx + 1}" loading="lazy" data-full="${image}" />
          `,
              )
              .join("")}
        </div>
        ${
            (item.images || []).length > 1
                ? `
          <div class="slider-controls">
            <button type="button" class="slider-control" data-carousel-prev aria-label="Previous image">‹</button>
            <button type="button" class="slider-control" data-carousel-next aria-label="Next image">›</button>
          </div>
        `
                : ""
        }
        <div class="slider-dots"></div>
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
      </div>
      <div class="content">
        <div class="topline">
          <div>
            <h3>${item.name}</h3>
          </div>
          <div class="meta">
            ${item.eggless ? '<span class="product-tag">Eggless</span>' : ""}
          </div>
        </div>
        <p class="muted">${item.description}</p>
        <div class="product-price">
          ${isAvailable ? `From ${formatCurrency(displayPrice)}` : "Unavailable"}
          ${item.originalPrice && isAvailable ? displayOriginal : ""}
        </div>
        <div class="product-actions">
          <button type="button" class="primary-btn order-item" data-item-id="${item.id}" ${!isAvailable ? "disabled" : ""}>${isAvailable ? "Add to cart" : "Sold out"}</button>
        </div>
      </div>
    </article>
  `;
}

function bindFilterEvents() {
    const buttons = document.querySelectorAll("[data-category]");
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            productCatalog.filter = button.dataset.category;
            renderCatalog(productCatalog.sourceData);
        });
    });
}

function bindProductButtons() {
    document.querySelectorAll(".order-item").forEach((button) => {
        button.addEventListener("click", () => {
            const itemId = button.dataset.itemId;
            const item = (productCatalog.sourceData?.items || []).find(
                (entry) => entry.id === itemId,
            );
            if (!item || isExpired(item) || item.available === false) return;

            if (typeof window.openOrderModal === "function") {
                window.openOrderModal(item, productCatalog.currentPageId);
                return;
            }

            window.dispatchEvent(
                new CustomEvent("open-order-modal", {
                    detail: { item, pageId: productCatalog.currentPageId },
                }),
            );
        });
    });
}

function renderCatalog(data) {
    const root = document.querySelector("[data-page-root]");
    if (!root) return;

    const categoryButtons = ["All", ...(data.categories || [])];
    const filteredItems = getFilteredItems();

    root.innerHTML = `
    <div class="page-hero">
      <div class="container hero-inner">
        <span class="eyebrow">${data.title}</span>
        <div>
          <h1>${data.title}</h1>
          <p class="lead">${data.subtitle || ""}</p>
        </div>
        ${data.banner ? `<div class="info-banner">${data.banner}</div>` : ""}
      </div>
    </div>
    <div class="container section">
      <div class="catalog-filter" data-category-filters>
        ${categoryButtons
            .map(
                (category) => `
          <button type="button" class="${productCatalog.filter === category ? "active" : ""}" data-category="${category}">${category}</button>
        `,
            )
            .join("")}
      </div>
      <div class="grid-3" data-product-grid>
        ${filteredItems.map((item) => renderProductCard(item)).join("")}
      </div>
      <div class="empty-state ${filteredItems.length ? "" : "visible"}">No products match this category yet.</div>
    </div>
  `;

    bindFilterEvents();
    bindProductButtons();

    document.querySelectorAll("[data-carousel]").forEach((carouselNode) => {
        new ProductCarousel(carouselNode);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (state.pageMap.size) {
        loadCatalogPage();
        return;
    }

    window.addEventListener(
        "site-ready",
        () => {
            loadCatalogPage();
        },
        { once: true },
    );
});

window.productCatalog = productCatalog;
