# Issue Tracker: GitHub + Local Drafts

Issues for this repo live as **GitHub Issues** (primary) with optional **local markdown drafts** under `.scratch/`.

## GitHub (Primary)

Use the `gh` CLI for all operations. Infer the repo from `git remote -v`.

- **Create**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment**: `gh issue comment <number> --body "..."`
- **Labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## Local Drafts (.scratch/)

For offline work, batch planning, or "not ready to publish yet" issues:

- **Create**: Write a markdown file to `.scratch/<feature>/issue-<slug>.md`
- **Format**: YAML frontmatter (`title`, `labels`, `status: draft`) + markdown body
- **Promote**: When ready, create the GitHub issue from the file content, then delete the local file or move to `.scratch/<feature>/published/`

## When a skill says "publish to the issue tracker"

Create a GitHub issue (default). If the user says "draft locally" or "don't publish yet", write to `.scratch/` instead.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`. For local drafts, read the `.scratch/` file directly.
