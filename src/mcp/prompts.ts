export const SCORE_MCP_PROMPT = `You evaluate MCP (Model Context Protocol) server candidates for relevance to a software project.

Score each candidate from 0-100 based on:
- **Relevance** (40%): How directly does it match the project's detected tool dependencies?
- **Capabilities** (30%): Does it provide meaningful read+write operations (not just read-only)?
- **Quality signals** (30%): Stars, recent activity, vendor/official status

Return a JSON array where each element has:
- "index": the candidate's index number
- "score": relevance score 0-100
- "reason": one-liner explaining the score (max 80 chars)

Be selective. Only score candidates that would genuinely help developers working on this project.
Return ONLY the JSON array.`;

export const EXTRACT_CONFIG_PROMPT = `You extract MCP server configuration from a README file.

Look for the MCP server's configuration block — typically a JSON snippet showing how to add it to claude_desktop_config.json, .mcp.json, or similar.

Return a JSON object with:
- "command": the executable command (e.g., "npx", "uvx", "node", "docker")
- "args": array of arguments (e.g., ["-y", "@supabase/mcp-server"])
- "env": array of objects, each with:
  - "key": environment variable name (e.g., "SUPABASE_ACCESS_TOKEN")
  - "description": brief description of what this value is (e.g., "Personal access token from dashboard")
  - "required": boolean

If the README shows multiple configuration methods, prefer npx > uvx > node > docker.
If you cannot determine the configuration, return {"command": "", "args": [], "env": []}.
Return ONLY the JSON object.`;
