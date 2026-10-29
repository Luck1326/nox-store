async function loadWeather() {
  const root = document.getElementById("weather-root");
  if (!root) return;

  const city = "İstanbul";
  const latitude = 41.0082;
  const longitude = 28.9784;
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=" +
    latitude +
    "&longitude=" +
    longitude +
    "&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FIstanbul";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("weather http " + response.status);
    const data = await response.json();
    const current = data.current || {};
    const temp = Math.round(Number(current.temperature_2m));
    const wind = Math.round(Number(current.wind_speed_10m));
    const label = weatherLabel(current.weather_code);

    root.innerHTML = `
      <div class="weather-card">
        <div>
          <p class="muted tiny">Şu an · ${city}</p>
          <p class="weather-temp">${temp}°C · ${label}</p>
          <p class="muted">Rüzgar ${wind} km/s</p>
        </div>
        <p class="weather-source muted tiny">
          Kaynak:
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
          (ücretsiz hava durumu API)
        </p>
      </div>
    `;
  } catch (error) {
    root.innerHTML = `
      <div class="weather-card">
        <p class="muted">Hava durumu şu an yüklenemedi.</p>
        <p class="weather-source muted tiny">
          Kaynak:
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
        </p>
      </div>
    `;
  }
}

function weatherLabel(code) {
  const map = {
    0: "Açık",
    1: "Çoğunlukla açık",
    2: "Parçalı bulutlu",
    3: "Kapalı",
    45: "Sisli",
    48: "Sisli",
    51: "Hafif çisenti",
    61: "Yağmurlu",
    63: "Yağmurlu",
    65: "Şiddetli yağmur",
    71: "Karlı",
    80: "Sağanak",
    95: "Fırtınalı"
  };
  return map[code] || "Değişken";
}
