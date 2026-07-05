import type { GridNexaAiRequest, GridNexaCommandPlan } from "@gridnexa/react";
import { GridNexa } from "@gridnexa/react";
import { ExampleLayout } from "../../components/ExampleLayout";
import { Toolbar } from "../../components/Toolbar";
import { employeeColumns, employees } from "../../data/employees";

const demoProvider = async (
  request: GridNexaAiRequest,
): Promise<GridNexaCommandPlan> => {
  const prompt = request.prompt.toLowerCase();

  if (prompt.includes("pivot")) {
    return {
      title: "Create score pivot by region",
      explanation:
        "Group departments, split scores by region, and aggregate with average.",
      actions: [
        {
          type: "pivot",
          groupBy: "department",
          pivotBy: "region",
          valueColumns: ["score"],
          aggregation: "avg",
        },
      ],
      confidence: 0.92,
    };
  }

  if (prompt.includes("engineering") || prompt.includes("filter")) {
    return {
      title: "Focus on engineering performance",
      explanation:
        "Filter visible rows to Engineering and sort the score column descending.",
      actions: [
        {
          type: "setColumnFilter",
          columnId: "department",
          filter: {
            type: "set",
            operator: "in",
            values: ["Engineering"],
          },
        },
        { type: "sort", columnId: "score", direction: "desc" },
      ],
      confidence: 0.9,
    };
  }

  return {
    title: "Prepare executive review",
    explanation:
      "Pin names, highlight active employees in the quick filter, and export the result.",
    actions: [
      { type: "pinColumn", columnId: "name", pinned: "left" },
      { type: "quickFilter", value: "active" },
      { type: "export", format: "csv" },
    ],
    confidence: 0.82,
  };
};

const code = `import { GridNexa, type GridNexaAiRequest } from "@gridnexa/react";

// Browser: never put AI provider keys here.
<GridNexa
  columns={columns}
  rows={rows}
  getRowId={(row) => row.id}
  ai={{
    enabled: true,
    endpoint: "/api/gridnexa-ai",
    placeholder: "Try: pivot score by region grouped by department"
  }}
/>

// Server route example: /api/gridnexa-ai
// This route can call OpenAI, Azure OpenAI, Anthropic, Gemini,
// Ollama, Bedrock, Groq, Mistral, or your own model gateway.
export async function POST(request: Request) {
  const body = (await request.json()) as GridNexaAiRequest;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You translate GridNexa user requests into safe JSON action plans. Return only JSON with a plan object."
        },
        {
          role: "user",
          content: JSON.stringify(body)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "gridnexa_plan",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["plan"],
            properties: {
              plan: {
                type: "object",
                additionalProperties: false,
                required: ["title", "actions"],
                properties: {
                  title: { type: "string" },
                  explanation: { type: "string" },
                  confidence: { type: "number" },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  });

  const data = await response.json();
  const text = data.output_text ?? data.output?.[0]?.content?.[0]?.text;

  return Response.json(JSON.parse(text));
}`;

export function AICommand() {
  return (
    <ExampleLayout
      title="AI Command"
      subtitle="Intelligence layer"
      overview="Let users describe grid operations in plain English, preview the generated action plan, and apply only safe GridNexa actions."
      details={[
        "Use ai.provider for an in-app adapter or ai.endpoint for a backend route.",
        "Keep all provider keys on the server; never expose OpenAI, Anthropic, Gemini, Azure, or local gateway tokens in browser code.",
        "GridNexa accepts a typed action plan, so AI can filter, sort, group, pivot, pin, hide, and export without executing arbitrary code.",
      ]}
      code={code}
    >
      <Toolbar
        title="Feature notes"
        items={["AI command bar", "safe action preview", "provider-neutral endpoint"]}
      />
      <GridNexa
        columns={employeeColumns}
        rows={employees}
        getRowId={(row) => row.id}
        checkboxSelection
        rowNumbers
        ai={{
          enabled: true,
          provider: demoProvider,
          placeholder:
            "Try: filter engineering, pivot score by region, or prepare review",
        }}
      />
    </ExampleLayout>
  );
}
