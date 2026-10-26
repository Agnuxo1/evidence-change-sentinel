# Diagnostics and service recovery

The HackOS submission was sent on 23 October 2026, ID
`01a16795-98e3-765a-a05d-a699ba45c5f8`. A private-panel readback on 26 October
still showed Submitted 1/1. A connectivity failure does not undo that delivery.
No organizer eligibility or judging acceptance is evidenced.

## Preserve evidence

`npm run preflight` checks SQL, the evidence view and Meterless model discovery.
It does not perform inference or establish that a model is ready to run.
`npm run live:accept` additionally requires a complete, validated sponsor run.
Neither command checks or changes the HackOS submission.

Each command saves its new report under a unique `.state/diagnostics/` folder.
The output prints the report path. These private working reports are ignored by
Git. `SENTINEL_EVIDENCE_DIR` can select another directory; writes use exclusive
creation, so an existing report causes an error instead of being replaced.
Keep dated successful and failed reports. Do not rewrite an older success to
represent a new failed attempt, or infer current availability from an old success.

## Current recovery checkpoint: 26 October 2026

- The PC-to-server SSH tunnels listen, but Zetaris's server backends do not.
  Docker on the server is active; the required Zetaris platform images are absent.
  Access to the existing Zetaris Cloud Gateway account is required to restore
  the registry sign-in through its official download page.
- Official Nightshift 1.2.1 was restored on D:. Its authenticated CLI status works.
  The same Llama 3.2 1B Q4_K_M model was restored, with the publisher's SHA-256
  checked. A CPU-only lane was configured without autostart. Its start attempt
  returned HTTP 409 `low_live_memory`; no model inference ran during recovery.
- The existing GPU preference remains server-first, using the managed queue for
  compatible work. No local GPU inference was started. Do not bypass Nightshift's
  memory admission guard or stop someone else's jobs to force a successful run.
- The pending NACE sector extension is separate from this stable source snapshot.
  Its offline and mocked checks do not establish a live REST-table SQL join.

## Resume after access and resources are available

1. Restore Zetaris's official images on the server using the existing account.
   Use the prepared isolated Compose project, preserve its existing data and
   loopback bindings, then check the actual backends rather than just tunnel ports.
2. Run the vendor's installation verifier and authenticated `SELECT 1`, then
   check the six expected versioned passages in `sentinel_review.sentinel_passages`.
3. Restore a Nightshift lane only when the runtime admits it. For the prepared
   CPU diagnostic lane, retain `--device none`, `--n-gpu-layers 0` and
   `--no-op-offload`. Do not turn a CPU test into a local GPU fallback.
4. Load existing credentials privately into the child environment. Never place
   credentials in Git, diagnostic output, command-line arguments or screenshots.
5. Run preflight and full live acceptance, preserving their new report paths.
   Verify actual model responses, controlled outcomes, quotes, H-MEM provenance
   and receipt signatures. A model-discovery success alone is insufficient.
6. Keep the current HackOS submission and original materials unless a substantive
   fully verified correction warrants updating that same entry. Avoid duplicates.

The original 23 October video, deck, live evidence and receipt are dated historical
artifacts. The application still works in offline sample mode without these services.
