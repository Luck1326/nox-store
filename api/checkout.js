module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  const apiKey = process.env.LUQAPAY_API_KEY;
  if (!apiKey) {
    res.statusCode = 503;
    return res.end(
      JSON.stringify({
        error: "LUQAPAY_API_KEY Vercel ortam değişkenine eklenmeli."
      })
    );
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (error) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Geçersiz JSON" }));
    }
  }

  const nameParts = String(body.customerName || "")
    .trim()
    .split(/\s+/);
  const firstName = nameParts[0] || "Guest";
  const lastName = nameParts.slice(1).join(" ") || "Customer";
  const amount = Number(body.total);
  if (!amount || amount <= 0) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Geçersiz tutar" }));
  }

  const payload = {
    apiKey: apiKey,
    amount: amount,
    country: "TR",
    currency: "USD",
    city: body.city,
    dateOfBirth: body.dateOfBirth || "1990-01-01",
    defaultPaymentMethod: "CREDIT_CARD",
    websiteUrl: body.websiteUrl,
    email: body.email,
    failRedirectUrl: body.failRedirectUrl,
    firstName: firstName,
    lastName: lastName,
    language: "TR",
    address: body.address,
    postCode: body.postCode || "34000",
    referenceNo: "nox-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    successRedirectUrl: body.successRedirectUrl,
    is3d: true,
    only3d: true
  };

  const endpoint =
    process.env.LUQAPAY_ENV === "production"
      ? "https://wallet.luqapay.com/v2/checkout/initialize"
      : "https://sandbox-wallet.luqapay.com/v2/checkout/initialize";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.redirectUrl) {
      res.statusCode = 502;
      return res.end(
        JSON.stringify({
          error: result.message || result.error || "Luqapay reddetti",
          details: result
        })
      );
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        redirectUrl: result.redirectUrl,
        transactionId: result.transactionId,
        referenceNo: payload.referenceNo
      })
    );
  } catch (error) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: "Luqapay bağlantı hatası" }));
  }
};
