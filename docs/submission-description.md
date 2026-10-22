# Working description, not yet submitted

Evidence Change Sentinel helps funding-call reviewers see which assessments need another look when a source changes. Each criterion links to an exact passage, URL and source hash. A changed clause or applicant fact invalidates its dependent assessment; unaffected assessments remain traceable. Missing evidence, unfamiliar wording and new unmapped clauses go to human review.

The working offline prototype uses the official Meterless H-MEM reference for provenance, memory reuse and audit history. Its synthetic demo shows a company-size limit changing from 50 to 20 while date and region checks are preserved. Local checks: 29 application tests, 13 H-MEM conformance checks and 55 controlled synthetic evaluation cases. These are not real-world accuracy measurements.

Real Zetaris REST retrieval is verified against a local instance and a view unioning two synthetic CSV sources. The Meterless Nightshift proposal/validator adapter is mock-tested; real model execution and Cursor development verification remain pending. No NVIDIA model use is claimed. Existing concept/planning and the licensed H-MEM reference are declared pre-existing components; the new application code was written during the build window. This snapshot is a research prototype, not an official funding eligibility decision.

A real browser automation exercise captured all three synthetic scenarios, and a narrated 3:07 offline-prototype demonstration is published at `deliverables/evidence-change-sentinel-offline-demonstration.mp4`. New local mock contract tests pass, but `npm run live:accept` correctly returns `integration_verified:false` until a genuine Zetaris key and Meterless Runtime are configured.

Update this text only from verified evidence before submitting. Required final artifacts: public repository, 1–4 minute video, slide deck, sponsor explanation and live integration evidence. Do not submit with placeholder links.
