
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1. Initialize the MCP Server
const server = new McpServer({
  name: "MortgageCalculatorServer",
  version: "1.0.0",
});

// 2. Register tools
server.tool(
  "dt_calculator",
  "Calculates the Debt-to-Income (DTI) ratio for mortgage applications.",
  {
    monthly_debt: z.number().describe("Total monthly debt payments."),
    monthly_income: z.number().describe("Total monthly income."),
  },
  async ({ monthly_debt, monthly_income }) => {
    if (monthly_income === 0) {
      return { content: [{ type: "text", text: "0" }] };
    }
    const dti = (monthly_debt / monthly_income) * 100;
    return {
      content: [{ type: "text", text: String(dti) }],
    };
  }
);

server.tool(
  "ltv_calculator",
  "Calculates the Loan-to-Value (LTV) ratio for mortgage applications.",
  {
    loan_amount: z.number().describe("The amount of the loan."),
    property_value: z.number().describe("The appraised value of the property."),
  },
  async ({ loan_amount, property_value }) => {
    if (property_value === 0) {
        return { content: [{ type: "text", text: "0" }] };
    }
    const ltv = (loan_amount / property_value) * 100;
    return {
      content: [{ type: "text", text: String(ltv) }],
    };
  }
);

// 3. Start the server using Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mortgage Calculator MCP Server running on stdio");
}

main().catch(console.error);
