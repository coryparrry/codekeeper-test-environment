# Codekeeper test environment

Durable private adopter repository for end-to-end Codekeeper acceptance.

This repository exercises the packaged installer TUI, generated setup, pinned
GitHub workflows, App-owned publication, and bounded repair against a small
deterministic fixture. Keep `CODEKEEPER_ENABLED=false` except during an active
acceptance run. Automatic merge must remain disabled.

## Checkout contract

Checkout calculations move through catalog materialization, per-line pricing,
coupon eligibility, and category-aware tax calculation. Percentage discounts
round each unit to currency precision before multiplying by quantity. Fixed
coupons then reduce both the amount due and the weighted taxable subtotal.
Coupons cannot reduce either value below zero. Returned summaries must not
mutate caller-owned line items.
