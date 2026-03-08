
import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function run() {
  // 1. Connect to the MCP Server
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["ts-node", "src/mcp_server.ts"], 
  });
  const mcpClient = new Client({ name: "GeminiClient", version: "1.0.0" }, { capabilities: {} });
  await mcpClient.connect(transport);

  // 2. Fetch tools from MCP Server and convert to Gemini format
  const { tools: mcpTools } = await mcpClient.listTools();
  const geminiTools = mcpTools.map((tool) => ({
    function_declarations: [{
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }],
  }));

  // 3. Initialize Gemini with @google/genai
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = ai.models;

  // 4. Chat with tool-calling logic
  const prompt = "Calculate the DTI for a monthly debt of 2000 and a monthly income of 5000.";
  
  let result = await model.generateContent({
    model: "models/gemini-2.0-flash",
    contents: [{role: "user", parts: [{text: prompt}]}],
    tools: geminiTools,
  });

  const call = result.response.candidates[0].content.parts[0].functionCall;

  if (call) {
    // Execute the tool via MCP
    const toolResult = await mcpClient.callTool({
      name: call.name,
      arguments: call.args,
    });

    // Send the result back to Gemini
    result = await model.generateContent({
      model: "models/gemini-2.0-flash",
      contents: [
        {role: "user", parts: [{text: prompt}]},
        {role: "model", parts: [{functionCall: call}]},
        {role: "user", parts: [{functionResponse: {
          name: call.name,
          response: toolResult,
        }}]}
      ],
      tools: geminiTools,
    });
  }

  console.log("Gemini Response:", result.response.candidates[0].content.parts[0].text);
  process.exit(0);
}

run().catch(console.error);
