# Final acceptance checks and HackOS delivery

**Delivered:** Evidence Change Sentinel, Track 02 — The Agent That Can Explain Why.

| Item | Verified result |
|---|---|
| HackOS submission ID | `01a16795-98e3-765a-a05d-a699ba45c5f8` |
| Official server creation time | **2026-10-23T07:06:59.604954Z** |
| Server status after full reload | **submitted**; one entry, 1/1 submitted |
| Deadline | 2026-10-27T23:45:00Z; delivery was before the deadline |
| Team | Existing solo Evidence Change Sentinel team, Francisco Angulo Lafuente; formed, invitations paused |
| Repository at delivery | [03781fb7ccbb680abce166d24e196b9306c6b6e8](https://github.com/Agnuxo1/evidence-change-sentinel/tree/03781fb7ccbb680abce166d24e196b9306c6b6e8) |
| CI for delivered package | [39891856719 — success](https://github.com/Agnuxo1/evidence-change-sentinel/actions/runs/39891856719) |
| Video | [Hosted demonstration](https://iframe.mediadelivery.net/embed/778121/7c48f06c-bcec-4207-af2e-5871d8c11b96); plays in browser, approximately 221 seconds, 1280×720, no player error |
| Deck | [Hosted eight-slide PPTX](https://hackathon-server.genai.works/api/v1/cdn/proxy/hackathon/3b6b9534541e469ca7c008335d6f6a5d.pptx); HTTP 200, byte-for-byte SHA256 match to final local PPTX |

[Machine-readable receipt](../evidence/submission-receipt-20261023.json) preserves the identifiers, source commit, links, hashes and checks. [Submission Hub](https://hackathon.genai.works/submissions?hackathon_id=019fd164-82b9-7382-a536-d9093c576ed2) requires the participant account. Submission does not establish organizer eligibility approval or a judging result; no such decision has been evidenced. The observed server record has `is_disqualified:false` and no feedback, which is not an eligibility certificate.

## Verified implementation and tests

- Actual authenticated Zetaris SQL reads six versioned passages from two registered CSV sources through `sentinel_review.sentinel_passages`. The official local stack verification completed 9/9.
- Actual Meterless Nightshift local Llama 3.2 1B proposals, independently validated evidence and operational H-MEM pass the controlled live acceptance gate: one changed assessment, two preserved, four fresh responses, four H-MEM records, zero abstentions. Four Ed25519 receipt signatures verify against the local daemon's returned public key.
- Application tests 29/29, H-MEM conformance 13/13, controlled synthetic cases 55/55. Final CI passed. Earlier clean-install, Docker HTTP workflow and dependency auditing checks are preserved in the audit.
- NVIDIA CUDA inference on the local RTX 3090 is evidenced. Nemotron use or a special-prize entitlement is not claimed.
- Codex authored and executed project code. Cursor is optional under the [official 22 October Build update](RULE_UPDATE_20261022.md); no Cursor authorship is claimed.

## Delivered artifacts and scope

The final files are `deliverables/evidence-change-sentinel-live-demo.mp4` and `deliverables/evidence-change-sentinel-live-v3.pptx`. Their hashes are in the receipt. The 3:41 demonstration is narrated over actual captured connected-workflow screens and slides, not an uninterrupted screen recording. Historical offline video and prototype slides remain clearly labelled and were not used as the final deliverables.

Three explicit English rule grammars are supported. Unsupported cases require human review. Synthetic checks do not establish real-world or legal accuracy. A person remains responsible for official eligibility decisions. The live run's local provider receipts prove egress none and zero actual cost for those calls; a global policy forbidding all future cloud providers is not claimed.

The initial team concept predates the build window. Application code was developed during the event; the attributed Apache-2.0 Meterless H-MEM reference predates the application. No unrelated pre-existing project is represented as newly written hackathon code.

## Reproduce and preserve

Use `npm ci`, `npm test`, `npm run conformance` and `npm run evaluate` for the deterministic sample path. For the actual integration, follow the [live setup instructions](../README.md#live-setup), [Zetaris provisioning SQL](zetaris-provision.sql) and environment template; use existing authorized local credentials privately, then `npm run preflight` and `npm run live:accept`. The acceptance gate must create its result from actual requests; do not edit its status manually. No credentials are included in the public artifacts.

Do not overwrite this valid submitted entry or create duplicates without a substantive correction. Preserve the delivered source commit and original artifacts. The [historical preparation checkpoint](history/PRE_SUBMISSION_CHECKPOINT_20261023.md) retains earlier blockers and their chronology; its pending states are superseded by this receipt.

## External and optional follow-up

Organizer eligibility/judging is external and remains unconfirmed. A low-urgency written architecture review was requested once through Mentor Hub after submission; it is optional and no appointment or completed mentorship is claimed. Personal live pitch practice also requires the participant; the timed narrated demonstration and judges' Q&A material are prepared. These optional activities do not change the completed delivery state.
