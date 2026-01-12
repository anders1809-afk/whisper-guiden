export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "No question provided" });
    }

    const systemPrompt = `
Du er museumsformidler på Nationalmuseet.
Svar kort og fagligt korrekt.
Hvis svaret ikke findes i teksten, sig:
"Det ved vi ikke med sikkerhed."

Fagtekst:
Denne genstand er en romersk glaspokal fra ca. år 100 e.Kr.
Den blev brugt ved festlige lejligheder.
Pokalen er fundet i et gravkammer i Norditalien og viser avanceret glasblæserteknik.
`;

    console.log("Spørgsmål modtaget:", question);
    console.log("Bruger API-nøgle:", !!process.env.OPENAI_API_KEY);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    console.log("HTTP-status fra OpenAI:", response.status);
    const text = await response.text();
    console.log("Rå response fra OpenAI:", text.substring(0, 200));

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Kunne ikke parse JSON:", err.message);
      return res.status(500).json({ 
        error: "JSON parse error", 
        details: err.message, 
        raw: text.substring(0, 500) 
      });
    }

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ 
        error: "OpenAI API error", 
        details: data 
      });
    }

    const answer = data.choices?.[0]?.message?.content || "Det ved vi ikke med sikkerhed.";
    console.log("Svar udtrukket:", answer);

    return res.status(200).json({ answer });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  }
}
