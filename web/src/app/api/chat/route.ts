import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "@/lib/db";

const SYSTEM_PROMPT = `You are RangerGPT, an expert backcountry ranger and wilderness safety advisor for the US National Park System.

Your primary responsibility is visitor safety. You provide conservative, safety-first advice based on:
- Current weather conditions from weather_history table
- Active park alerts from the alerts table
- Hike readiness scores from fct_hike_readiness table
- General wilderness safety principles

IMPORTANT GUIDELINES:
1. Always err on the side of caution - if conditions are questionable, recommend postponing
2. When discussing specific trails or locations, acknowledge you only have park-wide data
3. If you don't have current data for a specific park, clearly state this
4. Never make assumptions about trail conditions
5. Recommend checking with ranger stations for the most up-to-date conditions
6. Be conversational but professional - you're a knowledgeable ranger
7. Keep responses concise and actionable (under 200 words when possible)

Use the provided CONTEXT to answer the user's question.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function detectParkCode(userMessage: string): Promise<string | null> {
  const msgLower = userMessage.toLowerCase();

  try {
    // Get all park codes from readiness table
    const parks = await query<{ park_code: string }>(`
      SELECT DISTINCT park_code FROM fct_hike_readiness
    `);

    // Check for park code matches (e.g. "ZION", "zion", "ACAD")
    for (const p of parks) {
      if (msgLower.includes(p.park_code.toLowerCase())) {
        return p.park_code;
      }
    }

    // Common park name -> code mappings for natural language queries
    const parkNames: Record<string, string> = {
      "yellowstone": "YELL", "yosemite": "YOSE", "zion": "ZION",
      "grand canyon": "GRCA", "glacier": "GLAC", "rocky mountain": "ROMO",
      "acadia": "ACAD", "arches": "ARCH", "bryce": "BRCA",
      "canyonlands": "CANY", "capitol reef": "CARE", "crater lake": "CRLA",
      "death valley": "DEVA", "denali": "DENA", "everglades": "EVER",
      "grand teton": "GRTE", "great smoky": "GRSM", "joshua tree": "JOTR",
      "mount rainier": "MORA", "olympic": "OLYM", "sequoia": "SEKI",
      "shenandoah": "SHEN", "big bend": "BIBE", "badlands": "BADL",
      "black canyon": "BLCA", "carlsbad": "CAVE", "channel islands": "CHIS",
      "congaree": "CONG", "dry tortugas": "DRTO", "great basin": "GRBA",
      "great sand dunes": "GRSA", "guadalupe": "GUMO", "haleakala": "HALE",
      "hawaii volcanoes": "HAVO", "hot springs": "HOSP", "isle royale": "ISRO",
      "kenai fjords": "KEFJ", "kings canyon": "KICA", "lassen": "LAVO",
      "mammoth cave": "MACA", "mesa verde": "MEVE", "north cascades": "NOCA",
      "petrified forest": "PEFO", "pinnacles": "PINN", "redwood": "REDW",
      "saguaro": "SAGU", "theodore roosevelt": "THRO", "virgin islands": "VIIS",
      "voyageurs": "VOYA", "white sands": "WHSA", "wind cave": "WICA",
      "wrangell": "WRST",
    };

    for (const [name, code] of Object.entries(parkNames)) {
      if (msgLower.includes(name)) {
        return code;
      }
    }
  } catch {
    // Ignore detection errors
  }

  return null;
}

async function buildContext(userMessage: string): Promise<string> {
  const parts: string[] = [];

  try {
    const parkCode = await detectParkCode(userMessage);

    if (parkCode) {
      // ── Park-specific context ──────────────────────────────────────

      // Readiness
      const readiness = await query<{
        park_code: string; temperature: number;
        readiness_status: string; alert_count: number;
        short_forecast: string;
      }>(`
        SELECT park_code, temperature, readiness_status, alert_count, short_forecast
        FROM fct_hike_readiness
        WHERE park_code = $1
      `, [parkCode]);

      if (readiness.length > 0) {
        const r = readiness[0];
        parts.push(`HIKE READINESS for ${r.park_code}:`);
        parts.push(`  Status: ${r.readiness_status}`);
        parts.push(`  Temperature: ${r.temperature}°F`);
        parts.push(`  Forecast: ${r.short_forecast}`);
        parts.push(`  Active Alerts: ${r.alert_count}`);
      }

      // Weather history
      const weather = await query<{
        temperature: number; short_forecast: string;
        wind_speed: string; extracted_at: string;
      }>(`
        SELECT temperature, short_forecast, wind_speed, extracted_at
        FROM weather_history
        WHERE park_code = $1
        ORDER BY extracted_at DESC
        LIMIT 5
      `, [parkCode]);

      if (weather.length > 0) {
        parts.push(`\nWEATHER HISTORY for ${parkCode}:`);
        for (const w of weather) {
          parts.push(`  ${w.temperature}°F, ${w.short_forecast}, Wind: ${w.wind_speed} (${new Date(w.extracted_at).toLocaleDateString()})`);
        }
      }

      // Park alerts
      const alerts = await query<{
        title: string; category: string; description: string;
      }>(`
        SELECT title, category, description
        FROM alerts
        WHERE park_code = $1
        ORDER BY updated_at DESC
        LIMIT 10
      `, [parkCode]);

      if (alerts.length > 0) {
        parts.push(`\nACTIVE ALERTS for ${parkCode}:`);
        for (const a of alerts) {
          parts.push(`  [${a.category}] ${a.title}`);
          parts.push(`    ${a.description.slice(0, 300)}`);
        }
      }

      if (parts.length === 0) {
        parts.push(`Park ${parkCode} was detected but no data found in database.`);
      }

    } else {
      // ── General overview (no specific park detected) ───────────────

      const readiness = await query<{
        park_code: string; temperature: number;
        readiness_status: string; alert_count: number;
      }>(`
        SELECT park_code, temperature, readiness_status, alert_count
        FROM fct_hike_readiness
        ORDER BY readiness_status DESC, alert_count DESC
        LIMIT 30
      `);

      if (readiness.length > 0) {
        parts.push("PARK READINESS OVERVIEW:");
        for (const r of readiness) {
          parts.push(`  ${r.park_code}: ${r.readiness_status} (${r.temperature}°F, ${r.alert_count} alerts)`);
        }
      }

      // Keyword search for relevant alerts
      const keywords = userMessage
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5);

      if (keywords.length > 0) {
        const alertConditions = keywords
          .map((_, i) => `LOWER(title) LIKE $${i + 1} OR LOWER(description) LIKE $${i + 1}`)
          .join(" OR ");
        const alertParams = keywords.map((k) => `%${k}%`);

        const alerts = await query<{
          park_code: string; title: string; category: string; description: string;
        }>(
          `SELECT park_code, title, category, description
           FROM alerts
           WHERE ${alertConditions}
           ORDER BY updated_at DESC
           LIMIT 8`,
          alertParams
        );

        if (alerts.length > 0) {
          parts.push("\nRELEVANT ALERTS:");
          for (const a of alerts) {
            parts.push(`  [${a.park_code}] ${a.category}: ${a.title}\n    ${a.description.slice(0, 200)}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error building context:", error);
    parts.push("(Database context unavailable — providing general advice)");
  }

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = (await request.json()) as {
      message: string;
      history: ChatMessage[];
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build database context
    const context = await buildContext(message);

    // Build conversation for Gemini
    const contents = [];

    // System instruction via first user message
    contents.push({
      role: "user" as const,
      parts: [{ text: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}` }],
    });
    contents.push({
      role: "model" as const,
      parts: [
        {
          text: "Understood. I'm RangerGPT, ready to provide safety-focused advice based on the current park data. How can I help?",
        },
      ],
    });

    // Add conversation history
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.content }],
      });
    }

    // Add current message
    contents.push({
      role: "user" as const,
      parts: [{ text: message }],
    });

    const result = await model.generateContent({ contents });
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
