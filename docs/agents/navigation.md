# Navigation

How to explore and navigate this repo's file structure.

## Mapping the repository

**Never guess file paths.** Before reading or editing a file, verify its exact path.

Do not run an unfiltered `ls` or `tree`. Always use this command:

```bash
tree -I "node_modules|.git|.next|public|coverage|scripts/output/debug|output/debug"
```

This excludes generated directories, dependencies, and debug output that bloat context.
