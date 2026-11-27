# ASSUMPTIONS - UX Sprint 2: Make It Feel Like A Trainer

1. Mastery threshold is ≥80% accuracy on at least 2 full completions (`highAccuracyCompletions >= 2`). Making any move transitions a variation from `New` to `Learning`.
2. Structured Study Notes automatically parses both explicit (`Idea:`, `Plan:`, `Watch Out:`) lines and free-text Markdown variation prose so existing `.md` files require no breaking changes while every variation displays `Idea`, `Plan`, and `Watch Out`.
3. `CompletionModal` renders immediately on `VARIATION_COMPLETE` unless `Auto-Loop` or `Practice All` is active, ensuring automated cycles continue smoothly while manual runs surface the modal within <100ms.
4. Per Sprint 2.4 spec, `Test` mode hides move arrows and disables the `Hint` button (`Test: No help, scored`), while `Practice` mode displays arrows and keeps `Hint` enabled (`Practice: See hints & arrows`).
