import { formatCurrency, getCart, saveCart, state } from "./app.js";

const orderState = {
    currentItem: null,
    currentPageId: null,
};

function getDefaultSelectionIndex(options) {
    if (!Array.isArray(options) || options.length === 0) return 0;
    return Math.min(
        options.length - 1,
        Math.max(0, Math.floor((options.length - 1) / 2)),
    );
}

function openOrderModal(item, pageId) {
    orderState.currentItem = item;
    orderState.currentPageId = pageId;
    const modal = document.querySelector("[data-order-modal]");
    const body = modal?.querySelector("[data-order-body]");
    if (!modal || !body) return;

    const sizeList = item.options?.sizes || [];
    const flavourList = item.options?.flavours || [];
    const colorList = item.options?.colors || [
        "Classic Rose",
        "Pastel Pink",
        "Cream Theme",
        "Royal Gold",
        "Custom",
    ];

    const defaultSizeIndex = getDefaultSelectionIndex(sizeList);
    const defaultFlavourIndex = getDefaultSelectionIndex(flavourList);
    const defaultColourIndex = getDefaultSelectionIndex(colorList);

    const sizeOptions = sizeList
        .map(
            (size, idx) => `
    <button type="button" class="size-option ${idx === defaultSizeIndex ? "active" : ""}" data-size-label="${size.label}" data-size-price="${size.price}">${size.label} - ${formatCurrency(size.price)}</button>
  `,
        )
        .join("");

    const flavourOptions = flavourList
        .map(
            (flavour, idx) => `
    <button type="button" class="${idx === defaultFlavourIndex ? "active" : ""}" data-flavour="${flavour}">${flavour}</button>
  `,
        )
        .join("");

    const colorOptions = colorList
        .map(
            (color, idx) => `
    <button type="button" class="${idx === defaultColourIndex ? "active" : ""}" data-colour="${color}">${color}</button>
  `,
        )
        .join("");

    body.innerHTML = `
    <div class="drawer-header">
      <div class="topline">
        <h3>${item.name}</h3>
        <button type="button" class="icon-btn" data-close-order>×</button>
      </div>
    </div>
    <div class="drawer-body">
      <div class="field-group">
        <label>Size</label>
        <div class="inline-toggle" data-size-picker>${sizeOptions}</div>
      </div>
      <div class="field-group">
        <label>Flavour</label>
        <div class="inline-toggle" data-flavour-picker>${flavourOptions}</div>
      </div>
      <div class="field-group">
        <label>Colour</label>
        <div class="inline-toggle" data-colour-picker>${colorOptions}</div>
      </div>
      <div class="field-group">
        <label>Quantity</label>
        <div class="qty-control">
          <button type="button" data-decrease-qty aria-label="Decrease quantity">−</button>
          <span data-order-qty>1</span>
          <button type="button" data-increase-qty aria-label="Increase quantity">+</button>
        </div>
      </div>
      ${
          item.options?.allowMessage !== false
              ? `
        <div class="field-group">
          <label>Message on cake</label>
          <textarea rows="3" data-order-message placeholder="Optional message"></textarea>
        </div>
      `
              : ""
      }
    </div>
    <div class="drawer-footer">
      <div class="product-actions">
        <button type="button" class="primary-btn" data-add-cart>Add to cart</button>
      </div>
    </div>
  `;

    bindOrderInteractions();
    modal.classList.add("open");
}

function bindOrderInteractions() {
    const modal = document.querySelector("[data-order-modal]");
    if (!modal) return;

    const closeButton = modal.querySelector("[data-close-order]");
    closeButton?.addEventListener("click", () =>
        modal.classList.remove("open"),
    );

    modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.classList.remove("open");
    });

    modal.querySelector("[data-add-cart]")?.addEventListener("click", () => {
        addCurrentItemToCart();
        modal.classList.remove("open");
        openCartDrawer();
    });

    modal
        .querySelector("[data-decrease-qty]")
        ?.addEventListener("click", () => {
            const qtyDisplay = modal.querySelector("[data-order-qty]");
            let qty = Number(qtyDisplay?.textContent || 1);
            qty = Math.max(1, qty - 1);
            qtyDisplay.textContent = String(qty);
        });

    modal
        .querySelector("[data-increase-qty]")
        ?.addEventListener("click", () => {
            const qtyDisplay = modal.querySelector("[data-order-qty]");
            let qty = Number(qtyDisplay?.textContent || 1);
            qty = Math.min(99, qty + 1);
            qtyDisplay.textContent = String(qty);
        });

    modal.querySelectorAll("[data-size-label]").forEach((button) => {
        button.addEventListener("click", () => {
            modal
                .querySelectorAll("[data-size-label]")
                .forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
        });
    });

    modal.querySelectorAll("[data-flavour]").forEach((button) => {
        button.addEventListener("click", () => {
            modal
                .querySelectorAll("[data-flavour]")
                .forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
        });
    });

    modal.querySelectorAll("[data-colour]").forEach((button) => {
        button.addEventListener("click", () => {
            modal
                .querySelectorAll("[data-colour]")
                .forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
        });
    });
}

function addCurrentItemToCart() {
    if (!orderState.currentItem) return;
    const modal = document.querySelector("[data-order-modal]");
    const selectedSize = modal?.querySelector("[data-size-label].active");
    const selectedFlavour = modal?.querySelector("[data-flavour].active");
    const selectedColour = modal?.querySelector("[data-colour].active");
    const qty = Number(
        modal?.querySelector("[data-order-qty]")?.textContent || 1,
    );
    const message = modal?.querySelector("[data-order-message]")?.value || "";

    const parsedItem = {
        id: orderState.currentItem.id,
        name: orderState.currentItem.name,
        pageId: orderState.currentPageId,
        category: orderState.currentItem.category,
        size:
            selectedSize?.dataset.sizeLabel ||
            orderState.currentItem.options?.sizes?.[0]?.label ||
            "Standard",
        flavour:
            selectedFlavour?.dataset.flavour ||
            orderState.currentItem.options?.flavours?.[0] ||
            "Classic",
        colour:
            selectedColour?.dataset.colour ||
            orderState.currentItem.options?.colors?.[0] ||
            "Classic Rose",
        message,
        quantity: qty,
        price: Number(
            selectedSize?.dataset.sizePrice ||
                orderState.currentItem.options?.sizes?.[0]?.price ||
                0,
        ),
    };

    const cart = getCart();
    const key = `${parsedItem.id}|${parsedItem.size}|${parsedItem.flavour}|${parsedItem.colour}|${parsedItem.message}`;
    const existing = cart.items.find(
        (entry) =>
            `${entry.id}|${entry.size}|${entry.flavour}|${entry.colour}|${entry.message}` ===
            key,
    );

    if (existing) {
        existing.quantity += parsedItem.quantity;
    } else {
        cart.items.push(parsedItem);
    }

    saveCart(cart);
}

function openCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!drawer) return;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    renderCart();
}

function closeCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!drawer) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
}

function redirectCartToWhatsApp() {
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!drawer) return;

    const cart = getCart();
    if (!cart.items.length) {
        alert("Your cart is empty. Add a product before checking out.");
        return;
    }

    const name = drawer.querySelector("[data-checkout-name]")?.value.trim();
    const fulfilment =
        drawer.querySelector("[data-checkout-fulfilment]")?.value || "Pickup";
    const address = drawer
        .querySelector("[data-checkout-address]")
        ?.value.trim();
    const neededBy = drawer.querySelector("[data-checkout-date]")?.value;
    const notes = drawer.querySelector("[data-checkout-notes]")?.value.trim();

    if (!name) {
        alert("Please add your name before checking out.");
        return;
    }
    if (fulfilment === "Delivery" && !address) {
        alert("Please add your delivery address.");
        return;
    }
    if (!neededBy) {
        alert("Please choose the date you need the order by.");
        return;
    }

    const total = cart.items.reduce(
        (sum, item) =>
            sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
    );

    const lines = cart.items
        .map(
            (item) =>
                `- ${item.name} (${item.size}, ${item.flavour}, ${item.colour || "Classic Rose"}, qty ${item.quantity})${item.message ? ` | ${item.message}` : ""} | ${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}`,
        )
        .join("\n");

    const message = `${state.site?.order?.messageIntro || "Hi! I would like to place an order for the following items:"}\n\n${lines}\n\nTotal: ${formatCurrency(total)}\nNeeded by: ${neededBy}\nFulfilment: ${fulfilment}\n${fulfilment === "Delivery" ? `Address: ${address}\n` : ""}Name: ${name}\n${notes ? `Notes: ${notes}\n` : ""}`;

    const waUrl = `https://wa.me/${state.site?.shop?.whatsapp || "919876543210"}?text=${encodeURIComponent(message)}`;
    if (waUrl.length > 2000) {
        alert(
            "Your order is too large to send in one WhatsApp message. Please split it into two orders.",
        );
        return;
    }

    saveCart({ items: [] });
    window.location.href = waUrl;
}

function renderCart() {
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!drawer) return;

    const cart = getCart();
    const body = drawer.querySelector("[data-cart-body]");
    const cartCount = drawer.querySelector("[data-cart-count]");
    if (cartCount)
        cartCount.textContent = String(
            cart.items.reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0,
            ),
        );

    if (!cart.items.length) {
        body.innerHTML =
            '<div class="empty-state visible">Your cart is empty. Add a cake or treat to get started.</div>';
        drawer
            .querySelector("[data-cart-submit]")
            ?.setAttribute("disabled", "disabled");
        return;
    }

    const itemsHtml = cart.items
        .map((item) => {
            const lineTotal =
                Number(item.price || 0) * Number(item.quantity || 0);
            return `
      <div class="cart-item">
        <div class="topline">
          <strong>${item.name}</strong>
          <button type="button" class="ghost-btn" data-remove-item="${item.id}|${item.size}|${item.flavour}|${item.colour}|${item.message}">Remove</button>
        </div>
        <div class="muted">${item.size} • ${item.flavour} • ${item.colour}${item.message ? ` • ${item.message}` : ""}</div>
        <div class="product-actions">
          <div class="qty-control">
            <button type="button" data-qty-change="decrease" data-key="${item.id}|${item.size}|${item.flavour}|${item.colour}|${item.message}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-qty-change="increase" data-key="${item.id}|${item.size}|${item.flavour}|${item.colour}|${item.message}">+</button>
          </div>
          <strong>${formatCurrency(lineTotal)}</strong>
        </div>
      </div>
    `;
        })
        .join("");

    body.innerHTML = `
    ${itemsHtml}
    <div class="field-group">
      <label>Name</label>
      <input type="text" data-checkout-name placeholder="Your name" />
    </div>
    <div class="field-group">
      <label>Fulfilment</label>
      <select data-checkout-fulfilment>
        ${(state.site?.order?.fulfilment || ["Pickup", "Delivery"]).map((option) => `<option value="${option}">${option}</option>`).join("")}
      </select>
    </div>
    <div class="field-group">
      <label>Address</label>
      <textarea rows="3" data-checkout-address placeholder="Delivery address, if applicable"></textarea>
    </div>
    <div class="field-group">
      <label>Needed by</label>
      <input type="date" data-checkout-date />
    </div>
    <div class="field-group">
      <label>Notes</label>
      <textarea rows="2" data-checkout-notes placeholder="Optional instructions"></textarea>
    </div>
  `;

    const total = cart.items.reduce(
        (sum, item) =>
            sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
    );
    const totalElement = drawer.querySelector("[data-cart-total]");
    if (totalElement) totalElement.textContent = formatCurrency(total);

    drawer.querySelector("[data-cart-submit]")?.removeAttribute("disabled");

    drawer.querySelectorAll("[data-remove-item]").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.removeItem;
            const cart = getCart();
            cart.items = cart.items.filter(
                (item) =>
                    `${item.id}|${item.size}|${item.flavour}|${item.colour}|${item.message}` !==
                    key,
            );
            saveCart(cart);
            renderCart();
        });
    });

    drawer.querySelectorAll("[data-qty-change]").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.key;
            const direction = button.dataset.qtyChange;
            const cart = getCart();
            const index = cart.items.findIndex(
                (item) =>
                    `${item.id}|${item.size}|${item.flavour}|${item.colour}|${item.message}` ===
                    key,
            );
            if (index === -1) return;
            if (direction === "increase") cart.items[index].quantity += 1;
            if (direction === "decrease")
                cart.items[index].quantity = Math.max(
                    1,
                    cart.items[index].quantity - 1,
                );
            saveCart(cart);
            renderCart();
        });
    });

    drawer
        .querySelector("[data-cart-submit]")
        ?.addEventListener("click", () => {
            redirectCartToWhatsApp();
        });
}

function initCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!drawer) return;

    const closeButton = drawer.querySelector("[data-close-cart]");
    closeButton?.addEventListener("click", closeCartDrawer);

    drawer.addEventListener("click", (event) => {
        if (event.target === drawer) closeCartDrawer();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && drawer.classList.contains("open")) {
            closeCartDrawer();
        }
    });

    document.addEventListener("open-cart", openCartDrawer);
    document.addEventListener("open-order-modal", (event) => {
        openOrderModal(event.detail.item, event.detail.pageId);
    });

    const cartButton = document.querySelector("[data-cart-button]");
    cartButton?.addEventListener("click", openCartDrawer);

    renderCart();
}

document.addEventListener("DOMContentLoaded", () => {
    initCartDrawer();
    const cartButton = document.querySelector("[data-cart-button]");
    cartButton?.addEventListener("click", (event) => {
        event.preventDefault();
        openCartDrawer();
    });
});

window.addEventListener("load", () => renderCart());
window.openOrderModal = openOrderModal;
window.openCartDrawer = openCartDrawer;
window.closeCartDrawer = closeCartDrawer;
window.orderState = orderState;
