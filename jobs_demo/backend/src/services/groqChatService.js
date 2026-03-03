const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq(messages = [], options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const resp = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: Number.isFinite(options.temperature) ? options.temperature : 0.2,
        messages,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Groq API failed (${resp.status}): ${errText || "Unknown error"}`);
    }

    const data = await resp.json();
    return data?.choices?.[0]?.message?.content?.trim() || "";
  } finally {
    clearTimeout(timeout);
  }
}

export default callGroq;
