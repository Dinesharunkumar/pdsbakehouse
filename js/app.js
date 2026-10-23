const SITE_PATH = "./data/site.json";
const CART_KEY = "pastryshop_cart_v1";

export const state = {
    site: null,
    pageMap: new Map(),
    currentPage: "home",
};

export function formatCurrency(value) {
    const currency = state.site?.order?.currency || "₹";
    return `${currency}${Number(value || 0).toLocaleString("en-IN")}`;
}

export function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : { items: [] };
        return { items: Array.isArray(parsed.items) ? parsed.items : [] };
    } catch (error) {
        console.warn("Cart parse error", error);
        return { items: [] };
    }
}

export function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function getPageMetaFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get("page");
    if (pageId) return pageId;

    const pathName = window.location.pathname.split("/").pop() || "index.html";
    if (!pathName || pathName === "" || pathName === "index.html")
        return "home";

    const matchingPage = (state.site?.pages || []).find(
        (page) => page.file === pathName,
    );
    return matchingPage?.id || null;
}

function parseSiteData(data) {
    state.site = data;
    const pages = Array.isArray(data.pages) ? data.pages : [];
    state.pageMap = new Map(pages.map((page) => [page.id, page]));
}

function getPageHref(page) {
    if (!page) return "index.html";
    return page.file === "catalog.html"
        ? `catalog.html?page=${page.id}`
        : page.file;
}

function setShopText() {
    const shopNameNodes = document.querySelectorAll("[data-shop-name]");
    shopNameNodes.forEach((node) => {
        node.textContent = state.site?.shop?.name || "PD's Bake House";
    });

    const taglineNodes = document.querySelectorAll("[data-shop-tagline]");
    taglineNodes.forEach((node) => {
        node.textContent =
            state.site?.shop?.tagline ||
            "Freshly baked joy, beautifully crafted since 2019.";
    });

    const phoneNodes = document.querySelectorAll("[data-shop-phone]");
    phoneNodes.forEach((node) => {
        node.textContent = state.site?.shop?.phone || "+91 98765 43210";
        const link = node.closest("a");
        if (link && state.site?.shop?.phone) {
            link.setAttribute(
                "href",
                `tel:${state.site.shop.phone.replace(/\s+/g, "")}`,
            );
        }
    });

    const emailNodes = document.querySelectorAll("[data-shop-email]");
    emailNodes.forEach((node) => {
        node.textContent = state.site?.shop?.email || "hello@pdsbakehouse.com";
        const link = node.closest("a");
        if (link && state.site?.shop?.email) {
            link.setAttribute("href", `mailto:${state.site.shop.email}`);
        }
    });

    const addressNodes = document.querySelectorAll("[data-shop-address]");
    addressNodes.forEach((node) => {
        node.textContent =
            state.site?.shop?.address ||
            "12 Rosewood Lane, Powai, Mumbai 400076";
    });

    const hoursNodes = document.querySelectorAll("[data-shop-hours]");
    hoursNodes.forEach((node) => {
        node.textContent =
            state.site?.shop?.hours || "Tue-Sun: 10:00 AM – 9:00 PM";
    });

    const instagramNodes = document.querySelectorAll("[data-shop-instagram]");
    instagramNodes.forEach((node) => {
        node.textContent = state.site?.shop?.instagram || "@pds_bake_house";
        const link = node.closest("a");
        if (link) {
            const url =
                state.site?.shop?.instagramUrl ||
                `https://instagram.com/${state.site?.shop?.instagram?.replace("@", "") || "pds_bake_house"}`;
            link.setAttribute("href", url);
        }
    });
}

function initMenuToggle() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const mobileMenu = document.querySelector("[data-mobile-nav]");
    if (!toggle || !mobileMenu) return;

    toggle.addEventListener("click", () => {
        const open = mobileMenu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
    });
}

function buildNavigation() {
    const enabledPages = (state.site?.pages || [])
        .filter((page) => Number(page.enabled) === 1)
        .sort((a, b) => Number(a.order) - Number(b.order));

    const renderPageLink = (page, active = false) => `
    <a href="${getPageHref(page)}" class="${active ? "active" : ""}">${page.title}</a>
  `;

    const navNodes = document.querySelectorAll("[data-nav]");
    navNodes.forEach((node) => {
        node.innerHTML = enabledPages
            .map((page) => renderPageLink(page, page.id === state.currentPage))
            .join("");
    });

    const mobileNode = document.querySelector("[data-mobile-nav]");
    if (mobileNode) {
        mobileNode.innerHTML = enabledPages
            .map((page) => renderPageLink(page, page.id === state.currentPage))
            .join("");
    }

    const footerLinks = document.querySelector("[data-footer-links]");
    if (footerLinks) {
        footerLinks.innerHTML = enabledPages
            .map((page) => `<a href="${getPageHref(page)}">${page.title}</a>`)
            .join("");
    }
}

function setPageMeta() {
    const pageId = getPageMetaFromUrl();
    const pageInfo = state.pageMap.get(pageId) || state.pageMap.get("home");
    state.currentPage = pageId || "home";

    const titleEl = document.querySelector("title");
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector(
        'meta[property="og:description"]',
    );

    const companyName = state.site?.shop?.name || "PD's Bake House";
    const tagline =
        state.site?.shop?.tagline ||
        "Freshly baked joy, beautifully crafted since 2019.";

    if (titleEl) {
        titleEl.textContent =
            pageInfo && pageInfo.title
                ? `${pageInfo.title} | ${companyName}`
                : companyName;
    }

    if (metaDescription) {
        metaDescription.setAttribute("content", tagline);
    }

    if (ogTitle) {
        ogTitle.setAttribute(
            "content",
            pageInfo && pageInfo.title
                ? `${pageInfo.title} | ${companyName}`
                : companyName,
        );
    }

    if (ogDescription) {
        ogDescription.setAttribute("content", tagline);
    }
}

function guardPage() {
    const pageId = getPageMetaFromUrl();
    const pageMeta = pageId
        ? state.pageMap.get(pageId)
        : state.pageMap.get("home");
    const pageRoot = document.querySelector("[data-page-root]");
    if (!pageRoot) return;

    if (!pageMeta || Number(pageMeta.enabled) !== 1) {
        pageRoot.innerHTML = `
      <div class="container section">
        <div class="status-box" role="alert">
          <h2>This page isn't available right now</h2>
          <p>We are refreshing this section and it will be back soon.</p>
          <a href="index.html" class="primary-btn">Back to home</a>
        </div>
      </div>
    `;
    }
}

function updateCartBadge() {
    const badge = document.querySelector("[data-cart-count]");
    if (!badge) return;
    const count = getCart().items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
    );
    badge.textContent = String(count);
    badge.classList.toggle("hidden", count === 0);
}

async function loadSite() {
    try {
        const response = await fetch(SITE_PATH, { cache: "no-store" });
        if (!response.ok) throw new Error("Site config failed to load");
        const data = await response.json();
        parseSiteData(data);
        window.dispatchEvent(new CustomEvent("site-ready"));
        setShopText();
        setPageMeta();
        buildNavigation();
        guardPage();
        initMenuToggle();
        initFloatingWhatsapp();
        validateCartOnLoad();
        return data;
    } catch (error) {
        console.error(error);
        const pageRoot = document.querySelector("[data-page-root]");
        if (pageRoot) {
            pageRoot.innerHTML = `
        <div class="container section">
          <div class="status-box" role="alert">
            <h2>Something went wrong</h2>
            <p>We could not load the page data. Please refresh and try again.</p>
          </div>
        </div>
      `;
        }
        return null;
    }
}

function initFloatingWhatsapp() {
    const button = document.querySelector("[data-floating-whatsapp]");
    if (!button || !state.site?.shop?.whatsapp) return;
    button.href = `https://wa.me/${state.site.shop.whatsapp}`;
    button.setAttribute("target", "_blank");
    button.setAttribute("rel", "noopener");
}

function isExpired(item) {
    return (
        !!item.validTill &&
        new Date(item.validTill) < new Date(new Date().toDateString())
    );
}

function getCatalogPrice(item, sizeLabel) {
    const match = (item.options?.sizes || []).find(
        (size) => size.label === sizeLabel,
    );
    if (match) return Number(match.price || 0);
    return Number(item.options?.sizes?.[0]?.price || 0);
}

async function validateCartOnLoad() {
    const cart = getCart();
    if (!cart.items.length) return;

    const activePages = (state.site?.pages || []).filter(
        (page) => Number(page.enabled) === 1,
    );
    const activeMap = new Map(activePages.map((page) => [page.id, page]));
    const validItems = [];
    let removedCount = 0;

    for (const line of cart.items) {
        const pageMeta = activeMap.get(line.pageId);
        if (!pageMeta || !pageMeta.data) {
            removedCount += 1;
            continue;
        }

        try {
            const response = await fetch(`./data/${pageMeta.data}`, {
                cache: "no-store",
            });
            if (!response.ok) throw new Error("Catalog failed");
            const data = await response.json();
            const item = (data.items || []).find(
                (entry) => entry.id === line.id,
            );
            if (!item || item.available === false || isExpired(item)) {
                removedCount += 1;
                continue;
            }
            validItems.push({
                ...line,
                name: item.name,
                price: getCatalogPrice(item, line.size),
            });
        } catch (error) {
            console.warn("Failed to validate cart item", error);
            removedCount += 1;
        }
    }

    if (removedCount > 0) {
        saveCart({ items: validItems });
        alert(
            "Some items were removed from your cart because they are unavailable or no longer valid.",
        );
    }
}

function renderFeaturedProducts(featuredItems) {
    const host = document.getElementById("featured-products");
    if (!host) return;

    host.innerHTML = featuredItems
        .slice(0, 3)
        .map(
            (item) => `
    <article class="product-card">
      <div class="image-slider">
        <div class="slides">
          ${(item.images || [])
              .map(
                  (image, idx) => `
            <img class="slide" src="${image}" alt="${item.name} image ${idx + 1}" loading="lazy" />
          `,
              )
              .join("")}
        </div>
      </div>
      <div class="content">
        <div class="topline">
          <h3>${item.name}</h3>
          ${item.badge ? `<span class="product-tag">${item.badge}</span>` : ""}
        </div>
        <p class="muted">${item.description}</p>
        <div class="product-price">From ${formatCurrency(item.options?.sizes?.[0]?.price || 0)}</div>
        <div class="product-actions">
          <a href="catalog.html?page=cakes" class="primary-btn">View item</a>
        </div>
      </div>
    </article>
  `,
        )
        .join("");
}

async function renderHomePage() {
    const host = document.getElementById("featured-products");
    if (!host) return;

    try {
        const response = await fetch("./data/cakes.json", {
            cache: "no-store",
        });
        if (!response.ok) throw new Error("Featured products fetch failed");
        const data = await response.json();
        renderFeaturedProducts(data.items || []);
    } catch (error) {
        console.error(error);
        host.innerHTML =
            '<div class="status-box">Featured items are temporarily unavailable.</div>';
    }

    const seasonalHost = document.getElementById("seasonal-banner");
    if (seasonalHost) {
        const seasonal = (state.site?.pages || []).find(
            (page) => page.id === "diwali-sale" && Number(page.enabled) === 1,
        );
        if (seasonal) {
            seasonalHost.innerHTML = `
        <div class="info-banner">
          <strong>Seasonal offer:</strong> <a href="catalog.html?page=diwali-sale">${seasonal.title}</a> is live with festive savings and limited-time flavours.
        </div>
      `;
        }
    }

    const reviewsHost = document.getElementById("reviews-preview");
    if (!reviewsHost) return;
    try {
        const response = await fetch("./data/reviews.json", {
            cache: "no-store",
        });
        if (!response.ok) throw new Error("Reviews fetch failed");
        const data = await response.json();
        reviewsHost.innerHTML = (data.items || [])
            .slice(0, 3)
            .map(
                (review) => `
      <div class="review-card">
        <div class="stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
        <p>“${review.text}”</p>
        <strong>${review.name}</strong>
      </div>
    `,
            )
            .join("");
    } catch (error) {
        console.error(error);
        reviewsHost.innerHTML =
            '<div class="status-box">Reviews are temporarily unavailable.</div>';
    }
}

async function renderGalleryPage() {
    const host = document.getElementById("gallery-grid");
    const filterHost = document.getElementById("gallery-filters");
    if (!host || !filterHost) return;

    try {
        const response = await fetch("./data/gallery.json", {
            cache: "no-store",
        });
        if (!response.ok) throw new Error("Gallery fetch failed");
        const data = await response.json();
        const categories = ["All", ...(data.categories || [])];
        let activeFilter = "All";

        const applyFilter = () => {
            const items =
                activeFilter === "All"
                    ? data.items
                    : data.items.filter(
                          (item) => item.category === activeFilter,
                      );
            host.innerHTML = items
                .map(
                    (item) => `
        <article class="masonry-item">
          <img src="${item.image}" alt="${item.title}" loading="lazy" data-gallery-image="${item.image}" data-gallery-title="${item.title}" />
          <div class="masonry-caption">
            <span class="masonry-tag">Celebration pick</span>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <button type="button" class="gallery-order-btn" data-gallery-order="${item.title}">Order this design</button>
          </div>
        </article>
      `,
                )
                .join("");

            host.querySelectorAll("[data-gallery-image]").forEach((img) => {
                img.addEventListener("click", () => {
                    const lightbox = document.querySelector("[data-lightbox]");
                    const lightboxImage = document.querySelector(
                        "[data-lightbox-image]",
                    );
                    if (!lightbox || !lightboxImage) return;
                    lightboxImage.src = img.dataset.galleryImage;
                    lightbox.classList.add("open");
                    lightbox.setAttribute("aria-hidden", "false");
                });
            });

            host.querySelectorAll("[data-gallery-order]").forEach((button) => {
                button.addEventListener("click", () => {
                    const title = button.dataset.galleryOrder;
                    const product = {
                        id: `gallery-${title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, "")}`,
                        name: title,
                        category: "Previous Works",
                        description:
                            "Custom celebration design inspired by this previous work.",
                        images: [
                            button
                                .closest(".masonry-item")
                                ?.querySelector("img")?.src || "",
                        ].filter(Boolean),
                        available: true,
                        options: {
                            sizes: [
                                { label: "Half kg", price: 1500 },
                                { label: "1 kg", price: 2400 },
                                { label: "2 kg", price: 3600 },
                            ],
                            flavours: [
                                "Vanilla Bean",
                                "Chocolate Fudge",
                                "Strawberry Cream",
                            ],
                            colors: [
                                "Classic Pastel",
                                "Custom Theme",
                                "Royal Gold",
                            ],
                            allowMessage: true,
                            allowDate: true,
                        },
                    };

                    if (typeof window.openOrderModal === "function") {
                        window.openOrderModal(product, "previous-works");
                        return;
                    }

                    window.dispatchEvent(
                        new CustomEvent("open-order-modal", {
                            detail: { item: product, pageId: "previous-works" },
                        }),
                    );
                });
            });
        };

        filterHost.innerHTML = categories
            .map(
                (category) => `
      <button type="button" class="${category === activeFilter ? "active" : ""}" data-gallery-filter="${category}">${category}</button>
    `,
            )
            .join("");

        filterHost
            .querySelectorAll("[data-gallery-filter]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    activeFilter = button.dataset.galleryFilter;
                    filterHost
                        .querySelectorAll("[data-gallery-filter]")
                        .forEach((item) =>
                            item.classList.toggle(
                                "active",
                                item.dataset.galleryFilter === activeFilter,
                            ),
                        );
                    applyFilter();
                });
            });

        applyFilter();
    } catch (error) {
        console.error(error);
        host.innerHTML =
            '<div class="status-box">Gallery items are temporarily unavailable.</div>';
    }
}

async function renderReviewsPage() {
    const host = document.getElementById("reviews-list");
    if (!host) return;

    try {
        const response = await fetch("./data/reviews.json", {
            cache: "no-store",
        });
        if (!response.ok) throw new Error("Reviews file failed");
        const data = await response.json();
        host.innerHTML = (data.items || [])
            .map(
                (item) => `
      <article class="review-card">
        <div class="stars">${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</div>
        <p>“${item.text}”</p>
        <div class="mt-3">
          <strong>${item.name}</strong>
          ${item.date ? `<div class="small-note">${item.date}</div>` : ""}
        </div>
      </article>
    `,
            )
            .join("");
    } catch (error) {
        console.error(error);
        host.innerHTML =
            '<div class="status-box">Reviews are temporarily unavailable.</div>';
    }
}

function initPageContent() {
    if (document.body.dataset.page === "home") {
        renderHomePage();
    }
    if (document.body.dataset.page === "previous-works") {
        renderGalleryPage();
    }
    if (document.body.dataset.page === "reviews") {
        renderReviewsPage();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadSite();
    initPageContent();
    updateCartBadge();
});

window.formatCurrency = formatCurrency;
window.getCart = getCart;
window.saveCart = saveCart;
window.state = state;
window.validateCartOnLoad = validateCartOnLoad;
