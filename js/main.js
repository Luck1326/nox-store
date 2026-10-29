function $(selector, root) {
  return (root || document).querySelector(selector);
}

function $$(selector, root) {
  return Array.from((root || document).querySelectorAll(selector));
}

function updateCartBadges() {
  const count = Cart.count();
  $$("[data-cart-count]").forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
  $$("[data-cart-total]").forEach((el) => {
    el.textContent = formatPrice(Cart.total());
  });
  const bar = $("[data-mobile-bar]");
  if (bar) bar.hidden = count === 0;
}

function showToast(message) {
  let toast = $(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

function productCard(product) {
  const badge = product.badge
    ? `<span class="badge">${product.badge}</span>`
    : "";
  return `
    <article class="card">
      <a class="card-media" href="urun.html?id=${product.id}">
        ${badge}
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>
      <div class="card-body">
        <p class="muted tiny">${product.category}</p>
        <h3><a href="urun.html?id=${product.id}">${product.name}</a></h3>
        <p class="muted">${product.short}</p>
        <div class="card-row">
          <strong class="price">${formatPrice(product.price)}</strong>
          <button class="btn btn-small" type="button" data-add="${product.id}">Sepete ekle</button>
        </div>
      </div>
    </article>
  `;
}

function bindAddButtons(root) {
  $$( "[data-add]", root || document).forEach((button) => {
    button.addEventListener("click", () => {
      Cart.add(button.getAttribute("data-add"), 1);
      const original = button.textContent;
      button.textContent = "Eklendi";
      button.disabled = true;
      showToast("Sepete eklendi");
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 900);
    });
  });
}

function renderHome() {
  const featured = $("#featured-grid");
  const hero = $("#hero-photo");
  const lead = getProduct("pulse");
  if (hero && lead) {
    hero.src = lead.image;
    hero.alt = lead.name;
  }
  if (!featured) return;
  featured.innerHTML = PRODUCTS.slice(0, 4).map(productCard).join("");
  bindAddButtons(featured);
}

function renderCatalog() {
  const grid = $("#catalog-grid");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const searchInput = $("#catalog-search");
  const filters = $("#catalog-filters");
  let activeCategory = params.get("kategori") || "Tümü";
  if (searchInput && params.get("q")) searchInput.value = params.get("q");

  filters.innerHTML =
    ["Tümü", ...uniqueCategories()]
      .map(
        (name) =>
          `<button type="button" class="chip${
            name === activeCategory ? " is-active" : ""
          }" data-filter="${name}">${name}</button>`
      )
      .join("");

  function apply() {
    const query = (searchInput.value || "").trim().toLowerCase();
    const list = PRODUCTS.filter((product) => {
      const inCategory =
        activeCategory === "Tümü" || product.category === activeCategory;
      const inQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.short.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      return inCategory && inQuery;
    });

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          <h2>Sonuç yok</h2>
          <p class="muted">Aramayı sadeleştir veya başka bir kategori dene.</p>
        </div>`;
      return;
    }
    grid.innerHTML = list.map(productCard).join("");
    bindAddButtons(grid);
  }

  filters.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-filter]");
    if (!chip) return;
    activeCategory = chip.getAttribute("data-filter");
    $$(".chip", filters).forEach((el) =>
      el.classList.toggle("is-active", el === chip)
    );
    apply();
  });

  searchInput.addEventListener("input", apply);
  apply();
}

function renderDetail() {
  const root = $("#product-detail");
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get("id");
  const product = getProduct(id);
  if (!product) {
    root.innerHTML = `
      <div class="empty">
        <h1>Ürün bulunamadı</h1>
        <p class="muted">Katalogdan başka bir ürün seçebilirsin.</p>
        <a class="btn" href="urunler.html">Ürünlere dön</a>
      </div>`;
    return;
  }

  document.title = product.name + " — Nox";
  root.innerHTML = `
    <div class="detail-media">
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="detail-copy">
      <p class="muted">${product.category}${
        product.badge ? " · " + product.badge : ""
      }</p>
      <h1>${product.name}</h1>
      <p class="lead">${product.description}</p>
      <p class="price xl">${formatPrice(product.price)}</p>
      <div class="detail-actions">
        <label class="qty-label">Adet
          <input id="detail-qty" type="number" min="1" value="1">
        </label>
        <button class="btn" type="button" id="detail-add">Sepete ekle</button>
      </div>
      <ul class="plain-list muted">
        <li>14 gün içinde iade</li>
        <li>$50 üzeri kargo bedava</li>
        <li>2 yıl yerinde destek</li>
      </ul>
    </div>
  `;

  $("#detail-add").addEventListener("click", () => {
    const qty = Number($("#detail-qty").value) || 1;
    Cart.add(product.id, qty);
    showToast("Sepete eklendi");
  });

  const related = PRODUCTS.filter(
    (item) => item.category === product.category && item.id !== product.id
  ).slice(0, 3);
  const relatedRoot = $("#related-grid");
  if (relatedRoot && related.length) {
    relatedRoot.innerHTML = related.map(productCard).join("");
    bindAddButtons(relatedRoot);
  }
}

function renderCartPage() {
  const root = $("#cart-root");
  if (!root) return;

  function paint() {
    const lines = Cart.lines();
    if (!lines.length) {
      root.innerHTML = `
        <div class="empty">
          <h1>Sepet boş</h1>
          <p class="muted">Gece masana yakışan bir şey henüz yok.</p>
          <a class="btn" href="urunler.html">Ürünlere bak</a>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="cart-layout">
        <ul class="cart-lines">
          ${lines
            .map(
              (line) => `
            <li class="cart-line">
              <img src="${line.image}" alt="">
              <div>
                <a href="urun.html?id=${line.id}"><strong>${line.name}</strong></a>
                <p class="muted tiny">${line.category}</p>
                <button type="button" class="text-btn" data-remove="${line.id}">Kaldır</button>
              </div>
              <label class="sr-only" for="qty-${line.id}">Adet</label>
              <input id="qty-${line.id}" class="qty" type="number" min="1" value="${line.qty}" data-qty="${line.id}">
              <strong>${formatPrice(line.lineTotal)}</strong>
            </li>`
            )
            .join("")}
        </ul>
        <aside class="summary">
          <h2>Özet</h2>
          <p class="summary-row"><span>Ara toplam</span><span>${formatPrice(
            Cart.total()
          )}</span></p>
          <p class="summary-row"><span>Kargo</span><span>${
            shippingFor(Cart.total()) === 0
              ? "Ücretsiz"
              : formatPrice(SHIPPING_USD)
          }</span></p>
          <p class="summary-row total"><span>Toplam</span><span>${formatPrice(
            Cart.total() + shippingFor(Cart.total())
          )}</span></p>
          <a class="btn btn-block" href="odeme.html">Ödemeye geç</a>
        </aside>
      </div>`;

    $$("[data-remove]", root).forEach((btn) => {
      btn.addEventListener("click", () => Cart.remove(btn.getAttribute("data-remove")));
    });
    $$("[data-qty]", root).forEach((input) => {
      input.addEventListener("change", () => {
        Cart.update(input.getAttribute("data-qty"), input.value);
      });
    });
  }

  document.addEventListener("cart:change", paint);
  paint();
}

function renderCheckout() {
  const form = $("#checkout-form");
  if (!form) return;
  const summary = $("#checkout-summary");
  const lines = Cart.lines();

  if (!lines.length) {
    form.hidden = true;
    summary.innerHTML = `
      <div class="empty">
        <h1>Sepette ürün yok</h1>
        <a class="btn" href="urunler.html">Alışverişe dön</a>
      </div>`;
    return;
  }

  const shipping = shippingFor(Cart.total());
  summary.innerHTML = `
    <h2>Sipariş</h2>
    <ul class="plain-list">
      ${lines
        .map(
          (line) =>
            `<li class="summary-row"><span>${line.name} × ${line.qty}</span><span>${formatPrice(
              line.lineTotal
            )}</span></li>`
        )
        .join("")}
    </ul>
    <p class="summary-row total"><span>Toplam</span><span>${formatPrice(
      Cart.total() + shipping
    )}</span></p>
    <p class="muted tiny">Ödeme Luqapay ile USD üzerinden alınır. Sipariş Supabase’e yazılır.</p>
  `;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const missing = ["ad", "eposta", "adres", "sehir", "posta"].filter(
      (key) => !String(data[key] || "").trim()
    );
    const errorEl = $("#form-error");
    if (missing.length) {
      errorEl.hidden = false;
      errorEl.textContent = "Lütfen yıldızlı alanları doldur.";
      return;
    }
    const button = form.querySelector("[type=submit]");
    button.disabled = true;
    const orderPayload = {
      customerName: data.ad.trim(),
      email: data.eposta.trim(),
      address: data.adres.trim(),
      city: data.sehir.trim(),
      postCode: data.posta.trim(),
      dateOfBirth: (data.dogum || "1990-01-01").trim(),
      subtotal: Cart.total(),
      shipping: shipping,
      total: Cart.total() + shipping,
      items: lines
    };
    const saveError = await saveOrder(orderPayload);
    if (saveError) {
      errorEl.hidden = false;
      errorEl.textContent = "Sipariş kaydedilemedi. Bağlantıyı kontrol edip tekrar dene.";
      button.disabled = false;
      return;
    }
    sessionStorage.setItem(
      "nox-order",
      JSON.stringify({
        name: orderPayload.customerName,
        total: orderPayload.total,
        items: lines
      })
    );

    try {
      const origin = window.location.origin;
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderPayload,
          websiteUrl: origin,
          successRedirectUrl: origin + "/tesekkur.html",
          failRedirectUrl: origin + "/odeme.html?odeme=basarisiz"
        })
      });
      const result = await response.json();
      if (!response.ok || !result.redirectUrl) {
        throw new Error(result.error || "Luqapay başlatılamadı");
      }
      Cart.clear();
      window.location.href = result.redirectUrl;
      return;
    } catch (error) {
      errorEl.hidden = false;
      errorEl.textContent =
        "Luqapay şu an bağlanamadı. Sipariş kaydedildi; canlıda API anahtarı eklenince ödeme açılır.";
      button.disabled = false;
      Cart.clear();
      window.location.href = "tesekkur.html";
    }
  });
}

function renderThanks() {
  const root = $("#thanks-root");
  if (!root) return;
  let order = null;
  try {
    order = JSON.parse(sessionStorage.getItem("nox-order") || "null");
  } catch (error) {
    order = null;
  }
  if (!order) {
    root.innerHTML = `<div class="empty"><h1>Sipariş bulunamadı</h1><a class="btn" href="index.html">Ana sayfa</a></div>`;
    return;
  }
  $("#thanks-name").textContent = order.name;
  $("#thanks-total").textContent = formatPrice(order.total);
}

function bindHeaderSearch() {
  const form = $("#header-search");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = $("#header-search-input").value.trim();
    const url = "urunler.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    window.location.href = url;
  });
}

function bindNavToggle() {
  const toggle = $("[data-nav-toggle]");
  const nav = $("#site-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

document.addEventListener("cart:change", updateCartBadges);
document.addEventListener("DOMContentLoaded", async () => {
  bindHeaderSearch();
  bindNavToggle();
  const page = document.body.getAttribute("data-page");
  if (page === "home" && typeof loadWeather === "function") {
    loadWeather();
  }
  try {
    await loadProducts();
  } catch (error) {
    const main = document.getElementById("icerik");
    if (main) {
      const note = document.createElement("p");
      note.className = "wrap muted";
      note.textContent = "Ürünler veritabanından yüklenemedi.";
      main.prepend(note);
    }
  }
  updateCartBadges();
  if (page === "home") renderHome();
  if (page === "catalog") renderCatalog();
  if (page === "detail") renderDetail();
  if (page === "cart") renderCartPage();
  if (page === "checkout") renderCheckout();
  if (page === "thanks") renderThanks();
});
