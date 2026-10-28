const PRODUCTS = [];
const PRODUCT_ORDER = [
  "pulse",
  "arc",
  "beam",
  "carry",
  "air",
  "key",
  "charge",
  "sight",
  "drift",
  "clip"
];

async function loadProducts() {
  const { data, error } = await db.from("products").select("*");
  if (error) throw error;
  const rows = (data || []).slice().sort((a, b) => {
    const ai = PRODUCT_ORDER.indexOf(a.id);
    const bi = PRODUCT_ORDER.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  PRODUCTS.length = 0;
  rows.forEach((row) => {
    if (!String(row.image || "").endsWith(".jpg")) {
      row.image = "img/" + row.id + ".jpg";
    }
    PRODUCTS.push(row);
  });
}

async function saveOrder(order) {
  const id = crypto.randomUUID();
  const { error } = await db.from("orders").insert({
    id: id,
    customer_name: order.customerName,
    email: order.email,
    address: order.address,
    city: order.city,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total
  });
  if (error) return error;

  const rows = order.items.map((line) => ({
    order_id: id,
    product_id: line.id,
    qty: line.qty,
    unit_price: line.price
  }));
  const { error: itemError } = await db.from("order_items").insert(rows);
  return itemError;
}

function getProduct(id) {
  return PRODUCTS.find((item) => item.id === id);
}

const FREE_SHIPPING_AT = 50;
const SHIPPING_USD = 6;

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_USD;
}

function uniqueCategories() {
  return [...new Set(PRODUCTS.map((item) => item.category))];
}
