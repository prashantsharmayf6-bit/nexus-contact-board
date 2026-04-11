import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase environment variables");

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id is required");

    // Fetch lead data with activities, notes, and calls
    const [leadRes, activitiesRes, notesRes, callsRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", lead_id).single(),
      supabase.from("lead_activities").select("*").eq("lead_id", lead_id).order("created_at", { ascending: false }).limit(20),
      supabase.from("lead_notes").select("*").eq("lead_id", lead_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("call_logs").select("*").eq("lead_id", lead_id).order("called_at", { ascending: false }).limit(10),
    ]);

    if (leadRes.error) throw new Error("Lead not found");

    const lead = leadRes.data;
    const activities = activitiesRes.data || [];
    const notes = notesRes.data || [];
    const calls = callsRes.data || [];

    const prompt = `You are a CRM AI assistant for an India-based sales team. Analyze this lead and provide actionable insights.

LEAD DATA:
- Name: ${lead.name}
- Company: ${lead.company || "N/A"}
- Status: ${lead.status}
- Source: ${lead.source || "N/A"}
- Value: ₹${lead.value || 0}
- Created: ${lead.created_at}
- Last Updated: ${lead.updated_at}
- Email: ${lead.email || "N/A"}
- Phone: ${lead.phone || "N/A"}

RECENT ACTIVITIES (${activities.length}):
${activities.slice(0, 10).map(a => `- [${a.type}] ${a.description} (${a.created_at})`).join("\n")}

NOTES (${notes.length}):
${notes.slice(0, 5).map(n => `- ${n.content} (${n.created_at})`).join("\n")}

CALL LOGS (${calls.length}):
${calls.slice(0, 5).map(c => `- ${c.direction} call, ${c.duration_minutes}min, outcome: ${c.outcome || "N/A"} (${c.called_at})`).join("\n")}

Respond ONLY with a valid JSON object using this exact structure:
{
  "health_score": <number 1-100>,
  "health_label": "<Hot/Warm/Cold/At Risk>",
  "health_reason": "<one sentence why>",
  "touchbase_recommendation": "<specific action to take now, 1-2 sentences>",
  "followup_date": "<suggested next follow-up in YYYY-MM-DD format>",
  "followup_action": "<what to do on follow-up, 1-2 sentences>",
  "risk_factors": ["<risk 1>", "<risk 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "engagement_trend": "<Increasing/Stable/Declining/No Data>"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a CRM analytics AI. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response, handling potential markdown wrapping
    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insights = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lead-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
