---
name: Rivet repository maintenance
on:
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
checkout:
  ref: ${{ github.sha }}
  fetch-depth: 1
engine: codex
model: gpt-5.6-luna
inlined-imports: true
imports:
  - .github/rivet/agents/repository-auditor.md
safe-outputs:
  missing-tool: false
  missing-data: false
  report-failure-as-issue: false
  report-failed-jobs: false
  noop:
    report-as-issue: false
  report-incomplete:
    create-issue: false
  jobs:
    validate-audit:
      description: Validate one bounded report-only repository audit
      runs-on: ubuntu-latest
      permissions:
        contents: read
        issues: read
        pull-requests: read
      inputs:
        audit:
          description: One completed repository audit encoded as JSON
          required: true
          type: string
      steps:
        - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
          with:
            ref: ${{ github.sha }}
            persist-credentials: false
        - uses: ./.github/rivet/actions/validate-audit
          env:
            GITHUB_EVENT_PATH: ${{ github.event_path }}
            GITHUB_REF: ${{ github.ref }}
            GITHUB_SHA: ${{ github.sha }}
            RIVET_AUDIT_ARTIFACT: ${{ runner.temp }}/rivet-audit
        - uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a
          with:
            name: rivet-audit-${{ github.run_id }}
            path: ${{ runner.temp }}/rivet-audit
            if-no-files-found: error
            retention-days: 7
jobs:
  agent:
    if: >-
      github.ref == format('refs/heads/{0}', github.event.repository.default_branch) &&
      (github.event_name != 'workflow_dispatch' || github.event.inputs.aw_context == '')
---

# Rivet repository maintenance

Audit only the trusted default branch checked out by this workflow. Read
repository contents, open issues, and pull requests as evidence. Do not inspect
or execute a pull-request branch, and do not request or perform repairs,
mutations, comments, labels, issues, pull requests, commits, pushes, or merges.

Use the imported repository-auditor instructions and report only concrete,
current findings supported by the available evidence. A completed audit must
call `validate_audit` exactly once with `audit` set to a JSON string containing
`headSha`, `sourceRef`, `summary`, and `findings`. Each finding must contain
exactly `id`, `path`, `problemKey`, `title`, `category`, `priority`,
`evidence`, and `recommendation`; do not add fields or omit any required field.
Recommendations may tell
an owner what to change, but the workflow cannot perform the change. Do not include
credentials, tokens, private keys, secret values, or security-sensitive details.

If the audit cannot establish a complete comparison, call `report_incomplete`
with the exact missing boundary. For security-sensitive evidence, report only that
private handling is required. It creates no issue and must not be combined with
`validate_audit`.
