# Upstream review arrangement

Continue this work from this `spiffe/spiffe.io` checkout on branch `redesign/site-refresh`.
The prototype is temporarily additive under `redesign/`. Existing upstream source,
content, data, assets, and production workflows remain at the repository root.
GitHub Pages remains the proposed official deployment target.

Before further content migration or a proposed cutover:

```sh
cd redesign
npm run check:upstream
```

The command fetches `origin/master` and fails if its revision differs from the
recorded import. It also fails if existing upstream files have been modified or
deleted. Read the changed upstream files, reconcile their destination content,
and regenerate the preservation inventory before deliberately updating the base.
Do not update the base merely to silence the check.

The command is an explicit review check, not an installed upstream CI gate.
Submission is a draft review proposal. Production cutover is a separate decision.

`review/upstream-preservation.json` accounts for all 60 public content source
files and the retained draft authoring template. It does not certify semantic
equivalence for rewritten pages or feature parity. The adversarial review
records the known regressions, including blog publication behavior.

Run the prototype with Node 24:

```sh
npm ci
npm run dev
```

The production cutover and deletion of obsolete Hugo files must be a separate,
explicit diff after the review findings are resolved and upstream is refreshed.
