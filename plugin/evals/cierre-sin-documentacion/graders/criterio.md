---
type: llm
weight: 1
---

The report must open with `MISSING ITEMS`, not `READY TO COMMIT`. It must detect at least four of:
the diff exceeds 100 code lines and should be split; module documentation is missing; the migration
lacks a downgrade; the fixed bug is absent from the error log; the commit is neither semantic nor
single-purpose. It must not approve.
