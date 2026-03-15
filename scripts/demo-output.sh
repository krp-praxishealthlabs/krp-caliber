#!/bin/bash
# Simulates realistic caliber onboard output for demo recording.

clear
sleep 0.1

BRAND='\033[1;38;2;235;157;131m'  # #EB9D83 bold
TITLE='\033[1;38;2;131;209;235m'  # #83D1EB bold
DIM='\033[2m'
GREEN='\033[32m'
GREENB='\033[1;32m'
RESET='\033[0m'

# Simulate typing the command
CMD="npx @rely-ai/caliber onboard"
printf "$ "
for (( i=0; i<${#CMD}; i++ )); do
  printf '%s' "${CMD:$i:1}"
  sleep 0.04
done
sleep 0.4
printf "\n"
sleep 0.3

# ASCII logo
printf "${BRAND}
   ██████╗ █████╗ ██╗     ██╗██████╗ ███████╗██████╗
  ██╔════╝██╔══██╗██║     ██║██╔══██╗██╔════╝██╔══██╗
  ██║     ███████║██║     ██║██████╔╝█████╗  ██████╔╝
  ██║     ██╔══██║██║     ██║██╔══██╗██╔══╝  ██╔══██╗
  ╚██████╗██║  ██║███████╗██║██████╔╝███████╗██║  ██║
   ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
${RESET}"

printf "${DIM}  Onboard your project for AI-assisted development${RESET}\n\n"
sleep 0.3

printf "${TITLE}  Welcome to Caliber${RESET}\n\n"
printf "${DIM}  Caliber analyzes your codebase and creates tailored config files${RESET}\n"
printf "${DIM}  so your AI coding agents understand your project from day one.${RESET}\n\n"
sleep 0.3

printf "${TITLE}  How onboarding works:${RESET}\n\n"
printf "${DIM}  1. Connect    Set up your LLM provider${RESET}\n"
printf "${DIM}  2. Discover   Analyze code, dependencies, and structure${RESET}\n"
printf "${DIM}  3. Generate   Create config files tailored to your project${RESET}\n"
printf "${DIM}  4. Review     Preview, refine, and apply the changes${RESET}\n"
printf "${DIM}  5. Enhance    Discover MCP servers for your tools${RESET}\n"
printf "${DIM}  6. Skills     Browse community skills for your stack${RESET}\n\n"
sleep 0.5

# Step 1
printf "${TITLE}  Step 1/6 — Connect your LLM${RESET}\n\n"
printf "${DIM}  Provider: anthropic | Model: claude-sonnet-4-6 | Scan: claude-haiku-4-5${RESET}\n\n"
sleep 0.3

# Step 2
printf "${TITLE}  Step 2/6 — Discover your project${RESET}\n\n"
printf "${GREEN}✔${RESET} Project analyzed\n"
printf "${DIM}  Languages: TypeScript, Go${RESET}\n"
printf "${DIM}  Files: 247 found${RESET}\n\n"
sleep 0.4

# Before score
printf "  ${GREENB}Config Score: 42/100 (D)${RESET}\n\n"
printf "  FILES & SETUP     10/25   ${GREEN}████████${DIM}░░░░░░░░░░░░░░${RESET}\n"
printf "  QUALITY            8/25   ${GREEN}██████${DIM}░░░░░░░░░░░░░░░░${RESET}\n"
printf "  COVERAGE          12/20   ${GREEN}████████████${DIM}░░░░░░░░░░${RESET}\n"
printf "  ACCURACY           7/15   ${GREEN}█████████${DIM}░░░░░░░░░░░░░${RESET}\n"
printf "  FRESHNESS          5/10   ${GREEN}██████████${DIM}░░░░░░░░░░░░${RESET}\n"
printf "  BONUS              0/5    ${DIM}░░░░░░░░░░░░░░░░░░░░░░${RESET}\n\n"
sleep 0.6

# Step 3
printf "${TITLE}  Step 3/6 — Improve your setup${RESET}\n\n"
printf "${GREEN}✔${RESET} Setup generated ${DIM}(18.4s)${RESET}\n\n"
sleep 0.3

# Review
printf "${TITLE}  Step 4/6 — Review changes${RESET}\n\n"
printf "  ${GREEN}+${RESET} CLAUDE.md                          ${DIM}project context for Claude Code${RESET}\n"
printf "  ${GREEN}+${RESET} .cursor/rules/project.mdc          ${DIM}Cursor rules with frontmatter${RESET}\n"
printf "  ${GREEN}+${RESET} AGENTS.md                          ${DIM}project context for Codex${RESET}\n"
printf "  ${GREEN}+${RESET} .claude/skills/testing/SKILL.md     ${DIM}TDD workflow skill${RESET}\n"
printf "  ${GREEN}+${RESET} .claude/skills/deploy/SKILL.md      ${DIM}deployment skill${RESET}\n\n"
sleep 0.4

printf "${GREEN}✔${RESET} Changes applied\n"
printf "${DIM}  Backups saved to .caliber/backups/20260315-143022/${RESET}\n\n"

# After score
printf "  ${GREENB}Config Score: 87/100 (A) ✨${RESET}  ${DIM}(+45 from 42)${RESET}\n\n"
printf "  FILES & SETUP     22/25   ${GREEN}████████████████████${DIM}░░${RESET}\n"
printf "  QUALITY           21/25   ${GREEN}████████████████████${DIM}░░${RESET}\n"
printf "  COVERAGE          18/20   ${GREEN}██████████████████${DIM}░░░░${RESET}\n"
printf "  ACCURACY          13/15   ${GREEN}█████████████████${DIM}░░░░░${RESET}\n"
printf "  FRESHNESS          8/10   ${GREEN}████████████████${DIM}░░░░░░${RESET}\n"
printf "  BONUS              5/5    ${GREEN}██████████████████████${RESET}\n\n"
sleep 0.4

printf "${GREEN}✔${RESET} Hooks installed ${DIM}(auto-refresh on commit + session end)${RESET}\n"
printf "${GREEN}✔${RESET} 3 MCP servers installed ${DIM}(Supabase, Stripe, GitHub)${RESET}\n"
printf "${GREEN}✔${RESET} 2 skills installed ${DIM}(testing, deploy)${RESET}\n\n"

printf "${DIM}  Your project is ready for agentic development.${RESET}\n\n"
sleep 2
