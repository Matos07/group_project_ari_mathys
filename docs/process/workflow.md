# Engineering workflow

Source of truth: decisions D-20 to D-25 in `docs/decisions.md`.

## Branches
- `main`: accepted releases only. Protected: PR required, 1 approval, no direct push.
- `sprint-N-staging`: integration branch of sprint N (`sprint-1-staging`, then `sprint-2-staging`, ...).
- `feature/<issue>-<slug>` and `fix/<issue>-<slug>`: one bounded Issue each, created from the current staging branch.

## Commit convention (history must show the sequence)
`docs:` contracts, STS, specs | `test:` failing test written first | `feat:` / `fix:` implementation | `chore:` tooling.
Pair work: add `Co-authored-by: Name <email>` and name both students in the Issue.

## Board columns
Backlog -> Contract ready -> In progress -> In review -> Integrated (staging) -> Done (main)

## Labels
`sprint-1`, `sprint-2`, `sprint-3`, `feature`, `defect`, `docs`, `lab-5`, `lab-6`, `lab-7`, `blocked`

## Definition of Ready (an Issue may start)
- Linked feature ID and requirement IDs (FR/BR/NFR).
- Feature contract committed on staging (SDS, API/UI/data specs, AC with IDs, STS with test IDs, DoD).
- Both students know who authors and who reviews.

## Definition of Done (an Issue may close)
- Behavior implemented; planned tests executed and passing (command, result and commit recorded in the PR).
- TDD evidence for rule work: red commit and green commit IDs in the Issue.
- Teammate review with a specific check, question, finding or reason for approval; the author never approves.
- Documents and README updated; `docs/traceability.md` updated with AC and test IDs and status.
- Incomplete work and failed or skipped tests disclosed.

## Release procedure (staging -> main)
1. All sprint Issues are in "Integrated". Run the full build, test and coverage commands on `sprint-N-staging`.
2. Open a release PR `sprint-N-staging` -> `main`; the teammate reviews it against the AC-to-test results table.
3. Merge (merge commit), then tag: `git tag -a v0.N.0-sprintN -m "Sprint N release"` and push the tag.
4. Record the tag and commit in the evidence index. Later commits never replace the assessed version.
