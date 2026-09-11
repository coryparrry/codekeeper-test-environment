# Rivet test environment

Durable private adopter repository for end-to-end Rivet acceptance.

This repository exercises generated setup, pinned GitHub workflows, App-owned
review publication, and owner-authorized repair against a small deterministic
fixture. Automatic merge remains disabled.

## Discount fixture

`discountBreakdown(price, percent)` validates the inputs, calculates the final
total through `discountedTotal`, and returns the original price, percentage,
savings, and total for display.
