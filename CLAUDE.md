@AGENTS.md

# CLAUDE.md — Lumio (Next.js 16)

File này là entry point Claude Code đọc đầu tiên. Quy ước cứng đặt ở các file khác để tránh duplicate:

## Tài liệu

- **Stack & code rule:** [AGENTS.md](AGENTS.md) (đã `@`-import ở trên) + [docs/AGENT.md](docs/AGENT.md) (chi tiết 330 dòng).
- **Cấu hình Claude Code (model, thinking, git rule):** [docs/CLAUDE.md](docs/CLAUDE.md).
- **Prompt bootstrap theo từng task type:** [docs/PROMPTS.md](docs/PROMPTS.md).
- **Quy ước branch / commit / PR:** [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md).
- **Use case nghiệp vụ (UC1–UC20):** [docs/USE_CASES.md](docs/USE_CASES.md).
- **Schema DB + RLS:** [docs/DATABASE.md](docs/DATABASE.md).
- **Kiến trúc tổng thể:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Design pattern:** [docs/DESIGN_PATTERNS.md](docs/DESIGN_PATTERNS.md).
- **Version package:** [docs/TECH_STACK.md](docs/TECH_STACK.md).
- **Nguồn dữ liệu:** [docs/CONTENT_SOURCES.md](docs/CONTENT_SOURCES.md).

## Slash commands & subagents

- Commands: [.claude/commands/](.claude/commands/) — `/feature`, `/migration`, `/prompt`, `/review`.
- Subagents: [.claude/agents/](.claude/agents/) — `db-migrator`, `ui-builder`, `test-writer`.
- Skill: [.claude/skills/lumio-design/](.claude/skills/lumio-design/) — design system bundle.

## TL;DR (3 điểm bắt buộc)

1. Mặc định **Opus 4.7 medium thinking**. Hạ Sonnet/Haiku cho task cơ học.
2. **Grep > Read > Edit > Write > Bash.** Hỏi trước khi đụng > 3 file mới.
3. **1 commit = 1 ý.** Conventional Commits tiếng Việt. **Không push thẳng `main`.**

> `docs/` được gitignore (chỉ local-only). Skill bundle ở `.claude/skills/lumio-design/` đã chứa bản copy đầy đủ cho trường hợp clone máy mới chưa có `docs/`.
