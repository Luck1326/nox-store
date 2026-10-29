async function loadFx() {
  const root = document.getElementById("fx-root");
  if (!root) return;

  const url = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("fx http " + response.status);
    const data = await response.json();
    const rate = Number(data.rates && data.rates.USD);
    if (!Number.isFinite(rate)) throw new Error("fx missing rate");
    const date = data.date || "";

    root.innerHTML = `
      <div class="weather-card">
        <div>
          <p class="muted tiny">Döviz · EUR / USD</p>
          <p class="weather-temp">1 € = ${rate.toFixed(4)} $</p>
          <p class="muted">${date ? "Tarih " + date : "Güncel kur"}</p>
        </div>
        <p class="weather-source muted tiny">
          Kaynak:
          <a href="https://www.frankfurter.app/" target="_blank" rel="noopener noreferrer">Frankfurter</a>
          (ücretsiz döviz API)
        </p>
      </div>
    `;
  } catch (error) {
    root.innerHTML = `
      <div class="weather-card">
        <p class="muted">Döviz kuru şu an yüklenemedi.</p>
        <p class="weather-source muted tiny">
          Kaynak:
          <a href="https://www.frankfurter.app/" target="_blank" rel="noopener noreferrer">Frankfurter</a>
        </p>
      </div>
    `;
  }
}
