# Open Agent Hackathon 2026 — Final acceptance gate & submission handoff

**Team:** Evidence Change Sentinel (solo). **Candidate:** Francisco Angulo de Lafuente. **Track:** The Agent That Can Explain Why.  
**Official build window:** 22–27 October 2026. **Submission deadline:** 27 October 2026, 23:45 UTC (28 October, 00:45 Europe/Madrid).  
**Status as of this document:** OFFLINE PROTOTYPE; **NOT SUBMITTED**. No verified real Nightshift or Zetaris service run yet.

> Source of truth: the [live event's Rules](https://hackathon.genai.works/event/open-agent-hackathon-2026), the [participant guide](https://docs.google.com/document/d/1_d3osxbXZRpp4Ln80w6Obc5xx06SmkIMrgp6BOj0Ofc/edit), the repo's code and explicit evidence JSON. Some older Academy and HackOS resources describe obsolete dates/prizes; use the event's updated deadline. Confirm current judge requirements in HackOS.

## 1. One product, one track, explicit evidence

**Who:** Grant-application advisers and public-funding reviewers who track changes between official calls and amendment notices.  
**Problem:** A changed passage can silently invalidate an old assessment; rechecking unrelated criteria wastes staff time.  
**Solution:** A traceable review workflow that references exact passages, invalidates affected conclusions, preserves unaffected ones and abstains on unsupported or missing evidence.

The working offline example uses **fictional** sources and a fictional applicant; 35 employees meet a 50-employee limit before a change, then fail a 20-employee limit afterwards, while unchanged region/date results are preserved. It is not a legal eligibility determination, not a claimed real-world grant-case accuracy test.

**Technical architecture:** Zetaris versioned evidence view → EvidenceReader → dependency-aware Planner → Meterless Runtime proposed rule → independently validated quote and typed rule → affected/preserved decision + human-review queue → Meterless H-MEM provenance and mutation ledger. Each proposal can be rejected and retried once; unsupported rules abstain. The offline sample uses a narrow deterministic grammar, not a model.

**No other previously written project is represented as part of this submission.** The initial team idea existed prior to the build window; the software was developed during the event. Vendored H-MEM is attributed to its actual upstream commit, not passed off as original. Concurrent participation in a completely separate scientific contest is not represented as a second HackOS submission. Rules for multiple projects under the same HackOS participant remain **unverified**; do not create duplicate accounts or entries on that assumption.

## 2. Mandatory Data / Build / Power checks

| Gate | Required proof | Current state |
|---|---|---|
| Identity/team/track | Team appears in the authenticated HackOS workspace and track selected | Historical authenticated checkpoint confirms the solo team; reconfirm before submission |
| Data: Zetaris | Running instance and successful authenticated SQL, including a versioned `sentinel_passages` view with real provider rows | **Blocked**: account email received, but no configured API key/view |
| Build: Meterless Engine | H-MEM used in a real product feature with memory reuse/ledger conformance | **Working offline:** 13/13 upstream checks and application tests. Verify inside sponsor-connected run |
| Power: Meterless Nightshift | Nightshift Runtime reachable, real token, model discovery and at least one *real* proposal | **Blocked:** no installed and authenticated runtime confirmed |
| NVIDIA special prize | Verifiable Nemotron model receipt for an actual product request | **Not claimed / optional special prize** |
| Tests | Application, conformance, controlled evaluation + live run | 26 application tests including new HTTP **mock** integration, 13 upstream conformance and 55/55 synthetic cases; real-provider check pending |
| Demo | Working **1–4 minute** screen recording proving user workflow and integrations, hosted via acceptable link | **Not recorded with live services** |
| Deck | Problem, user, result, architecture, Zetaris, H-MEM, Nightshift, evidence and limits | Existing `deliverables/evidence-change-sentinel-prototype.pptx` (interim deck; review/revise once live data exist) |
| Submission | Project description 150–2000 characters, track, video link, repository, deck and sponsor explanation | **Not submitted**, no confirmation number |

**Do not mark the project eligible or submitted merely because its code includes adapters.**

## 3. Exact Windows setup to finish the real feature

Original workspace: `D:\PROJECTS\Open-Agent-Hackathon-2026\evidence-change-sentinel`. Keep downloads and Zetaris data on D:/E: where possible; Windows C: has less spare space.

1. **Docker Desktop**: start it, verify `docker info` and WSL 2. If Docker Desktop uses C: for its WSL image, review **Settings → Resources → Advanced → Disk image location** before large downloads and move it to a suitable D: folder using Docker's own UI.
2. **Zetaris**: an account has already been created at [Zetaris Cloud](https://cloud.enterprise.zetaris.com/login). The human account owner must complete the emailed one-time-passcode login and accept any account terms. In **Run locally**, obtain the official `zetaris-platform.zip` and private registry login command; do not put either credentials nor bundle secrets into Git. With Docker Desktop running, launch from a WSL 2 shell following the [official getting-started guide](https://zetaris.github.io/getting-started/). Verify `./preflight.sh`, `docker compose ps --all`, `./verify.sh`, and `SELECT 1 AS one`. Create an API key in the Zetaris UI. Provision a **versioned view** called `sentinel_passages` that yields exactly five string columns: `source_id, version, passage_id, passage_text, source_url`, with unique (source_id, version, passage_id) identities. Populate with synthetic or permission-cleared call-and-notice rows; include the before/after rows in `input_examples/example_1.json`. Test the SQL view in Zetaris first.
3. **Meterless**: download the current Nightshift **Windows** edition from the [official Windows page](https://meterless.ai/windows.html), complete its email/verification gate, install and start the actual local Runtime/API hotspot. Obtain the *actual* Runtime token and base URL from Nightshift Console; do not confuse the browser edition or a mock server with a local runtime. Configure a usable model/routing lane and verify it really serves a request. A Nemotron-backed lane should be separately demonstrated only if the NVIDIA special award is pursued.
4. **Private configuration**: copy `.env.example` to `.env` locally, set `SAMPLE_MODE=false`, actual `ZETARIS_REST_URL` / `ZETARIS_ORG_ID` / `ZETARIS_API_KEY`, and `METERLESS_BASE_URL` / `METERLESS_RUNTIME_TOKEN` / `METERLESS_MODEL`. Never paste secrets into chat, GitHub, logs, video or the submission.
5. **Real verification in PowerShell** from this repository:

```powershell
npm ci
npm test
npm run conformance
npm run evaluate
node --env-file=.env --import tsx scripts/preflight.mjs
node --env-file=.env --import tsx scripts/live-acceptance.mjs
node --env-file=.env --import tsx run.mjs serve
```

`live-acceptance.mjs` **must** produce `evidence/live-acceptance.json` with `integration_verified: true` only after a real Zetaris SQL query, actual versioned rows, Nightshift model discovery, model proposals, validated evidence and H-MEM writes. **Never** generate this status by editing the JSON.

6. Inspect model output and source quotes in a real interactive run; save a **redacted** execution trace plus model and Zetaris request receipts. Independently establish whether a Nemotron model actually handled a request if claiming that prize.

## 4. Judged deliverables and claim discipline

- [ ] Public [repository](https://github.com/Agnuxo1/evidence-change-sentinel), with quickstart, copyright and pre-existing work attribution
- [ ] Real screenshot/screen-recording of the user-facing decision loop; **1–4 minute video**
- [ ] Updated, accurate slide deck and reproducibility evidence
- [ ] Submission in HackOS under the correct solo team and track; record successful receipt before deadline
- [ ] Mandatory Zetaris + Meterless evidence, not just mocked HTTP and code stubs
- [ ] Descriptive limitations: synthetic fixtures, no legal ruling, no real-grant validation, fixed parser grammar
- [ ] No confidential access details in outputs; no pretext of independent sponsor verification without receipts

**Current honest position:** a reviewed offline research prototype and implementation scaffolding are ready; mandatory external setup remains an explicit gate. Submit only once the form and required artifacts can be completed truthfully.

## 5. Judge-facing concise description (adapt after live validation)

> Evidence Change Sentinel helps funding-call reviewers understand precisely which assessments are invalidated when an official notice changes. The workflow attaches each decision to an exact quotation, URL and source fingerprint, preserves unrelated assessments, and routes unsupported wording to human review. Our hackathon prototype uses the Meterless H-MEM reference for provenance and auditable memory, with Zetaris evidence retrieval and Meterless Nightshift rule-proposal integration being completed and independently tested. The reproducible offline examples demonstrate one changed decision and two safely preserved conclusions, plus explicit abstention. Controlled synthetic tests and a documented evaluation measure narrow functional correctness, not real-world grant eligibility or legal accuracy.

Only change the tense of the sponsor-integration sentence after the acceptance check passes.

## 6. Platform continuity (previously documented)

Authenticated HackOS checks previously found the solo team already present, 14 onboarding board tasks, an unsaved 0/3 submission hub, and a project update posted in #Progress Update. Do not accidentally create a new team, use an alternate account or replace the original evidence with a separate entry. The final HackOS state must be re-read and checked after any future action.
