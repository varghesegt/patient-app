// utils/sms.js
export async function sendSmsFallback(phone, message, options = {}) {
  const { maxRetries = 3, simulateLatency = true } = options;

  // --- Validation ---
  if (!phone || !/^\+?\d{10,15}$/.test(phone)) {
    return { ok: false, error: "Invalid phone number format" };
  }
  if (!message || message.trim().length === 0) {
    return { ok: false, error: "Message cannot be empty" };
  }
  if (message.length > 500) {
    return { ok: false, error: "Message too long (max 500 chars)" };
  }

  let attempt = 0;
  let success = false;
  let error = null;

  // --- Retry Logic ---
  while (attempt < maxRetries && !success) {
    attempt++;
    try {
      // Simulated network delay
      if (simulateLatency) {
        await new Promise((res) =>
          setTimeout(res, Math.random() * 1000 + 300)
        );
      }

      // Simulated random failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Temporary SMS service error");
      }

      console.log(
        `[SMS-Fallback] ✅ Message sent | To: ${phone} | Attempt: ${attempt} | Time: ${new Date().toISOString()}`
      );
      success = true;
      return {
        ok: true,
        phone,
        message,
        attempt,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      error = err.message;
      console.warn(
        `[SMS-Fallback] ⚠️ Failed attempt ${attempt} for ${phone}: ${error}`
      );
      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, 500 * attempt)); // backoff
      }
    }
  }

  // --- Queue for later delivery (simulated) ---
  console.error(
    `[SMS-Fallback] ❌ All retries failed for ${phone}. Queuing message.`
  );
  // In real-world: store in IndexedDB, localStorage, or server DB
  const queued = { phone, message, queuedAt: new Date().toISOString() };

  return {
    ok: false,
    phone,
    message,
    error,
    retries: attempt,
    queued,
  };
}
