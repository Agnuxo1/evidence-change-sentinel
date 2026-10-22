# Interim 3:07 narrated prototype — recorded, not sponsor-connected

**Recorded artifact:** [Offline prototype MP4](../deliverables/evidence-change-sentinel-offline-demonstration.mp4) — verified duration 3:07, 1280×720 H.264 + AAC narration. Recorded from screenshots of three actual Selenium browser executions of the application on Windows, combined with pre-existing deck images. **This is not footage of live Zetaris or Meterless sponsor endpoints.**

## Actual recorded story

- **Opening and problem** — funding-call amendments can affect previous eligibility reviews. One fictional applicant and synthetic grant clauses only.
- **Workflow and components** — source references, dependency analysis, quote validation, H-MEM provenance and review queue.
- **Example 1** — 35 employees previously qualify under a 50-person limit but not under an amended 20-person limit; exactly one decision changes, two unchanged criteria are preserved.
- **Example 2** — no relevant change; three assessments are preserved.
- **Example 3** — ambiguous changed wording generates one human-review item, not a guessed legal decision.
- **Evidence** — 26/26 local application tests, 13/13 official H-MEM reference conformance checks and 55/55 narrow controlled synthetic cases.
- **Limitations** — explicitly state live Zetaris SQL and Nightshift model calls are **not yet verified**, and there is no Nemotron, independent legal validation or official submitted entry.

## Replacement required before final HackOS submission

Record a new *authenticated* 1–4 minute application demo once the two sponsor services operate and `npm run live:accept` returns a genuine validated result. On-screen proof should show:

1. An actual `SELECT source_id, version, passage_id, passage_text, source_url FROM sentinel_passages` executed by Zetaris.
2. The real Nightshift provider / model selection and a successful model-proposal response (**mask all keys**).
3. Changed/preserved assessments in the application and the evidence quotes and human review queue.
4. H-MEM memory records and the execution trace, plus the separation of sponsor integration and synthetic evaluation metrics.
5. Appropriate final video link, deck, README and sponsor explanation in the real HackOS submission form.

**Do not submit the interim MP4 as proof of sponsor integration.**
