"""Generate small, explicitly synthetic fixtures. No real funding rules or people."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
requirements = [
    {"id": "staff", "label": "Company size", "kind": "staff_limit", "source_id": "call", "passage_id": "eligibility"},
    {"id": "date", "label": "Submission date", "kind": "deadline", "source_id": "notice", "passage_id": "deadline"},
    {"id": "region", "label": "Registered region", "kind": "regions", "source_id": "call", "passage_id": "regions"},
]
clauses = [
    ("call", "eligibility", "Applicants must have at most 50 employees.", "Applicants must have at most 20 employees."),
    ("notice", "deadline", "Applications must be submitted by 2026-11-30.", "Applications must be submitted by 2026-11-30."),
    ("call", "regions", "Eligible regions: ES, PT.", "Eligible regions: ES, PT."),
]
base = {"project_id": "synthetic-funding-call", "synthetic": True,
        "applicant": {"employees": 35, "submitted_on": "2026-11-20", "region": "ES"},
        "requirements": requirements, "passages": []}
for src, pid, old, new in clauses:
    for version, text in [("before", old), ("after", new)]:
        base["passages"].append({"source_id": src, "passage_id": pid, "version": version,
                                 "text": text, "url": f"https://example.org/synthetic/{src}#{pid}"})
unchanged = copy.deepcopy(base)
for p in unchanged["passages"]:
    if p["version"] == "after" and p["passage_id"] == "eligibility":
        p["text"] = "Applicants must have at most 50 employees."
ambiguous = copy.deepcopy(base)
for p in ambiguous["passages"]:
    if p["version"] == "after" and p["passage_id"] == "eligibility":
        p["text"] = "Applicants must be small enterprises, subject to the committee's assessment."
for i, packet in enumerate([base, unchanged, ambiguous], 1):
    out = ROOT / "input_examples" / f"example_{i}.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(packet, indent=2) + "\n", encoding="utf8")
print("Generated 3 synthetic examples.")
