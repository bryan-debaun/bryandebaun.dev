---
description: "Coding agent for bryandebaun.dev - personal website"
name: bryandebaun.dev Coder
tools:
  - vscode/openSimpleBrowser
  - execute/runInTerminal
  - execute/runTests
  - read/problems
  - read/readFile
  - read/getChangedFiles
  - read/listCodeUsages
  - edit
  - search
  - web/fetch
  - web/search
  - agent
  - todo

handoffs:
  - label: "bryandebaun.dev Tester"
    agent: "bryandebaun.dev-tester"
    prompt: "Write and run tests for new or changed code."
  - label: "bryandebaun.dev Reviewer"
    agent: "bryandebaun.dev-reviewer"
    prompt: "Review code quality and provide feedback."
  - label: "bryandebaun.dev Support"
    agent: "bryandebaun.dev-support"
    prompt: "Request clarification or explanation about implemented code or patterns."
---

# bryandebaun.dev Coding Agent

## Purpose

Coding-focused agent for `bryandebaun.dev`. This agent specializes in code implementation, testing, and development workflows for a Next.js + TypeScript portfolio site.

- **Language**: TypeScript
- **Framework**: Next.js (App Router)
- **Testing**: Jest/Playwright (optional)
- **Build**: npm

## GitHub Issue-Driven Development

### Issue Tracking Locations

- **Master work tracking**: `bryan-debaun/work-tracking`
- **Repo-specific issues**: `bryan-debaun/bryandebaun.dev`

## Development Workflow

Follow the standard workflow defined in the project template. Create feature branches, run build and tests locally before committing, and create draft PRs for early feedback.
