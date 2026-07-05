import { ExampleLayout } from "../../components/ExampleLayout";
import { Toolbar } from "../../components/Toolbar";

const code = `import { GridNexa, type GridNexaAiRequest } from "@gridnexa/react";

// Frontend: provider-neutral and safe.
// The browser only knows your backend endpoint, never provider keys.
<GridNexa
  columns={columns}
  rows={rows}
  ai={{
    enabled: true,
    endpoint: "/api/gridnexa-ai",
    placeholder: "Ask AI to filter, sort, pivot, pin, hide, or export"
  }}
/>

// Shared response shape every provider must return:
type GridNexaAiServerResponse = {
  plan: {
    title: string;
    explanation?: string;
    confidence?: number;
    actions: Array<
      | { type: "quickFilter"; value: string }
      | { type: "setColumnFilter"; columnId: string; filter: object | null }
      | { type: "setAdvancedFilter"; model: object | null }
      | { type: "sort"; columnId: string; direction: "asc" | "desc" | null }
      | { type: "group"; columnId: string | null }
      | {
          type: "pivot";
          groupBy?: string | null;
          pivotBy?: string | null;
          valueColumns?: string[];
          aggregation?: "sum" | "avg" | "count" | "min" | "max";
        }
      | { type: "pinColumn"; columnId: string; pinned: "left" | "right" | null }
      | { type: "hideColumn"; columnId: string; hidden: boolean }
      | { type: "export"; format: "csv" | "excel" }
    >;
  };
};

const systemPrompt = \`
You convert GridNexa user requests into safe JSON action plans.
Return only JSON in this shape: { "plan": { "title": string, "actions": [] } }.
Use only column ids or fields from the supplied grid state.
Never return JavaScript code. Never invent unsupported action types.
\`;

// Option A: OpenAI Responses API
export async function openaiAdapter(body: GridNexaAiRequest) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(body) }
      ]
    })
  });

  const data = await response.json();
  return JSON.parse(data.output_text);
}

// Option B: Azure OpenAI
export async function azureOpenAiAdapter(body: GridNexaAiRequest) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

  const response = await fetch(
    \`\${endpoint}/openai/deployments/\${deployment}/chat/completions?api-version=\${apiVersion}\`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_API_KEY ?? ""
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(body) }
        ],
        response_format: { type: "json_object" }
      })
    }
  );

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// Option C: Anthropic Claude
export async function anthropicAdapter(body: GridNexaAiRequest) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 1600,
      system: systemPrompt,
      messages: [{ role: "user", content: JSON.stringify(body) }]
    })
  });

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

// Option D: Google Gemini
export async function geminiAdapter(body: GridNexaAiRequest) {
  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const response = await fetch(
    \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${process.env.GEMINI_API_KEY}\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: \`\${systemPrompt}\\n\\n\${JSON.stringify(body)}\` }]
          }
        ],
        generationConfig: { responseMimeType: "application/json" }
      })
    }
  );

  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

// Option E: Ollama or local OpenAI-compatible gateway
export async function localModelAdapter(body: GridNexaAiRequest) {
  const response = await fetch(
    process.env.LOCAL_AI_ENDPOINT ?? "http://localhost:11434/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${process.env.LOCAL_AI_API_KEY ?? "ollama"}\`
      },
      body: JSON.stringify({
        model: process.env.LOCAL_AI_MODEL ?? "llama3.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(body) }
        ],
        response_format: { type: "json_object" }
      })
    }
  );

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// Single backend route. Choose provider through env, tenant config,
// user settings, or your own billing/permission layer.
export async function POST(request: Request) {
  const body = (await request.json()) as GridNexaAiRequest;
  const provider = process.env.GRIDNEXA_AI_PROVIDER ?? "openai";

  const plan =
    provider === "azure-openai"
      ? await azureOpenAiAdapter(body)
      : provider === "anthropic"
        ? await anthropicAdapter(body)
        : provider === "gemini"
          ? await geminiAdapter(body)
          : provider === "local"
            ? await localModelAdapter(body)
            : await openaiAdapter(body);

  return Response.json(plan satisfies GridNexaAiServerResponse);
}`;

export function AIProviders() {
  return (
    <ExampleLayout
      title="AI Providers"
      subtitle="Secure provider configuration"
      overview="Connect GridNexa AI to any model provider by keeping credentials on your server and returning the same typed GridNexa action plan."
      details={[
        "Use ai.endpoint for production so keys stay server-side.",
        "Use ai.provider for local demos, tests, or an in-app adapter that does not need secrets.",
        "The provider can be OpenAI, Azure OpenAI, Anthropic, Gemini, Ollama, Bedrock, Groq, Mistral, or your internal AI gateway.",
        "Every provider must return the same GridNexa action-plan JSON, so the grid remains provider-neutral.",
      ]}
      code={code}
    >
      <Toolbar
        title="Provider rules"
        items={[
          "server-side keys",
          "provider-neutral plan",
          "safe action allow-list",
          "OpenAI, Anthropic, Gemini, Azure, local",
        ]}
      />
      <section className="ai-provider-grid" aria-label="Supported AI providers">
        {[
          ["OpenAI", "Responses API or compatible SDK"],
          ["Azure OpenAI", "Enterprise deployment endpoint"],
          ["Anthropic", "Claude Messages API"],
          ["Gemini", "Google Generative Language API"],
          ["Local", "Ollama or OpenAI-compatible gateways"],
          ["Custom", "Any service that returns a GridNexa plan"],
        ].map(([name, description]) => (
          <article className="ai-provider-card" key={name}>
            <strong>{name}</strong>
            <span>{description}</span>
          </article>
        ))}
      </section>
    </ExampleLayout>
  );
}
