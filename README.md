# Codekeeper test environment

Durable private adopter repository for end-to-end Codekeeper acceptance.

This repository exercises the packaged installer TUI, generated setup, pinned
GitHub workflows, App-owned publication, and bounded repair against a small
deterministic fixture. Keep `CODEKEEPER_ENABLED=false` except during an active
acceptance run. Automatic merge must remain disabled.
