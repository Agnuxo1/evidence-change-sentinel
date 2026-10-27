# Zetaris Demo Challenge: reproducible read-only evidence

This isolated adaptation adds `scripts/zetaris-challenge-demo.mjs` to the submitted
Evidence Change Sentinel project. It uses the existing Zetaris adapter, makes one
authenticated read-only query of the configured view, checks the rows against the
synthetic example, and compares before/after passage text by source and passage ID.
It reports one changed and two unchanged passage pairs if the fixture matches.
This is a passage comparison, not a fresh model inference or a legal assessment.

Configure `ZETARIS_API_KEY`, `ZETARIS_ORG_ID`, `ZETARIS_REST_URL`, and
`ZETARIS_VIEW` privately in the calling environment; do not add secrets to the
repository or place them in a command transcript. Then run:

```sh
node scripts/zetaris-challenge-demo.mjs
```

The command fails if the live rows differ from the repository fixture, have
duplicates or incomplete versions, or the configured service is unavailable.
Source passages and applicant facts in the example are fictional. The earlier
connected application run is separately documented in `evidence/` and should not
be represented as a new run. The demo is for human review, not an eligibility
determination. No new runtime, dataset, model training or outside API is required.
