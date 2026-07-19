---
title: "The Bottom Turtle That Heals Itself - Design"
description: "Building a Self-Contained, Dual-Server SPIRE HA Trust Domain from the ground up."
date: 2026-07-19
author: "Claude"
tags: ["SPIFFE", "SPIRE", "Community", "HA", "Bottom Turtle"]
images: ["cover.png"]
---

## Turtles all the way down

There's an old anecdote, retold in the SPIFFE community's book *Solving the Bottom Turtle*, about a philosopher describing the cosmos, only to be interrupted by an audience member insisting the world rests on the back of a giant turtle. "But what does the turtle stand on?" the philosopher asks. "It's turtles all the way down."

Security architectures have the same problem, except we don't get infinite turtles. Every secret in your infrastructure is protected by another secret. The database password is in Vault. Vault is unlocked with a token. The token is delivered by your CI system. The CI system authenticates with... a password. Somewhere at the bottom of that stack there is a *first* credential — "secret zero" — that isn't protected by anything except hope, an ops runbook, and maybe a sticky note.

The question that actually matters in infrastructure security is not "how do we protect secrets?" It's: **what is your bottom turtle, and why do you trust it?**

This article makes the case that the bottom turtle should be **SPIRE** — specifically, a SPIRE deployment where *you, the organization*, control a transient, continuously rolling set of CAs and a declarative set of registration records, and every other security decision in your infrastructure flows from that control. Then it walks through an architecture that answers the three objections people rightly raise when you propose making one system the root of all trust:

1. **"Doesn't the bottom turtle just stand on something else?"** No — the design rule is *self-containment*. Nothing beneath SPIRE requires a certificate, a CA, or a secret that SPIRE didn't issue. That rule has sharp consequences, including ruling out conventional database-clustered SPIRE HA.
2. **"How does trust get established at all, then?"** Attestation, anchored in TPMs on both sides of the relationship — servers proving themselves to agents and nodes proving themselves to servers. The TPMs are important, but they're the *foundation the turtle stands on*, not the turtle itself. More on that distinction later.
3. **"What happens when the root of trust goes down?"** Nothing, because the trust domain is made of two of them. Two fully independent SPIRE servers, each on its own hardware, united into a single **SPIRE HA trust domain** by `spire-ha-agent` — such that either side can fail, be completely rebuilt from scratch with brand-new keys, and rejoin automatically, with no trust ceremony and no workload disruption.

Let's build up to it.

---

## Part 1: Why SPIRE, not secrets, should be the bottom turtle

### The secret zero doom loop

Traditional secrets management doesn't eliminate secrets; it *concentrates* them. That's often a good trade — one well-guarded vault beats a thousand config files — but it doesn't answer the bootstrap question. To fetch a secret, a workload must authenticate. To authenticate, it needs a credential. Where did that credential come from? If the answer is "we put it there," you have a secret zero, and everything above it is decoration.

Worse, secret zero credentials tend to share three ugly properties: they're **long-lived** (rotating them is scary, so nobody does), they're **bearer tokens** (anything that reads the file *is* the workload, as far as your systems are concerned), and they're **distributed by humans or provisioning scripts** (i.e., the weakest link in the security chain).

### Flipping the model: identity is derived, not delivered

SPIFFE (Secure Production Identity Framework For Everyone) and its reference implementation SPIRE — both graduated CNCF projects — invert this. Instead of *delivering* a credential to a workload, SPIRE *observes* the workload and *derives* its identity:

- **Node attestation:** a SPIRE agent proves to a SPIRE server which machine it's running on, using verifiable evidence rather than a pre-placed secret.
- **Workload attestation:** the agent then inspects processes that connect to its local Workload API — their Systemd Unit, Kubernetes service account, container image, Unix UID, and so on — using kernel-level introspection rather than presented credentials.

Workloads that pass attestation receive an **SVID** (SPIFFE Verifiable Identity Document): a short-lived X.509 certificate or JWT carrying a SPIFFE ID like `spiffe://prod.example.com/payments/api`. SVIDs are rotated automatically, minted on demand, and never provisioned by a human.

### What "SPIRE as the bottom turtle" actually means

Here is the heart of the pitch, so let's say it precisely. Making SPIRE the bottom turtle means your organization's entire security posture reduces to two things that *you* own and control:

1. **A transient, rolling set of CAs.** SPIRE's signing authorities are not sacred ten-year root keys locked in a safe. They are deliberately short-lived (days, not years), continuously rotated, and — as we'll see — entirely *disposable and regrowable*. There is no crown-jewel key whose compromise is an extinction event, because no individual key matters for long. What persists is not any key; it's the *system* that mints and rolls them.
2. **A set of declarative registration records.** Which workloads exist, on which nodes, with which SPIFFE IDs — expressed as plain, versioned YAML under your source control. These records *are* your security policy at its root. Everything above — mTLS between services, Vault access, database auth, cross-domain federation — flows from the identities these records define.

Control those two things and you control the trust of everything built on top. Nothing about them is a secret in the traditional sense: the CAs roll on their own, and the registration records are just files in git. There is nothing to leak, nothing to escrow, and nothing to rotate in a panic. **That** is a bottom turtle worth standing on — *if* we can make it self-contained and unkillable. Which brings us to the two design rules that shape everything else.

---

## Part 2: Rule one — the bottom turtle can't stand on another CA

A bottom turtle, by definition, has nothing under it. So here's the litmus test to apply to any proposed SPIRE deployment: **does anything below SPIRE require a certificate that SPIRE didn't issue?** If yes, you haven't built a bottom turtle. You've built a middle turtle and hidden the real one.

Apply that test to the *conventional* SPIRE high-availability recipe and it fails immediately. Traditional SPIRE HA means multiple server replicas sharing a clustered database. But a clustered database replicating your identity system's most sensitive state across the network needs to be secured — which means TLS, which means certificates for the database cluster, which means... another CA. One that exists *before* and *underneath* SPIRE, that someone has to provision, protect, and rotate by hand. The turtle is standing on exactly the kind of manually-managed PKI it was supposed to eliminate. (And that's before asking who issues the certs for the load balancer in front of the replicas.)

The same test disqualifies other tempting foundations: leaning on a cloud provider's attestation API makes someone else's control plane your bottom turtle; an "upstream authority" corporate CA above SPIRE just relocates the crown jewels.

So rule one dictates the shape of each SPIRE server in this architecture: **fully standalone.** Each server keeps its state in a simple local datastore (SQLite on its own disk — a first-class, supported SPIRE configuration) with no cluster, no replication link, no network-exposed database, and therefore *no external certificates required anywhere below SPIRE*. Each server is a sealed unit: it needs nothing from any CA, because it *is* the CA.

"But a standalone server isn't highly available!" Correct — and we'll get HA a much better way in Part 4: not by clustering one system, but by running two of them. First, though: if there are no pre-placed secrets and no external CAs, what establishes trust at all?

---

## Part 3: Rule two — trust is established by attestation, anchored in hardware

If the turtle can't stand on another CA, it has to stand on something that isn't a CA at all: **physical hardware you own.** This is where TPMs enter — and let's frame their role correctly. The TPMs are not the point of this architecture. SPIRE is the bottom turtle; the TPMs are the bedrock it stands on. They matter enormously, but they're plumbing in service of the goal from Part 1: keeping the rolling CAs and registration records — the things *you* control — as the root of all security. What the TPMs buy is that this control can be *established and re-established automatically*, without ever passing a secret around.

The **Trusted Platform Module** is a secure element present in essentially all modern server hardware. Private keys generated inside it can never leave it. Every TPM ships from the factory with an **Endorsement Key (EK)**, typically backed by a certificate chaining to the TPM manufacturer — a birth certificate for the silicon.

For node attestation, this architecture uses the **`spire-tpm-plugin`**, which works via TPM 2.0 *credential activation*: the server encrypts a challenge such that only the physical TPM holding the corresponding EK can decrypt it. Verification is against the manufacturer's CA certs or a simple allow-list of EK public-key hashes you collect at provisioning time. Note what's *absent*: no enrollment service, no certificate-provisioning infrastructure, no CA of yours issuing anything to nodes ahead of time. (This is also why this design avoids DevID-style attestation, despite it being well-regarded: DevID certificates must be provisioned to every node by yet another CA and enrollment system operating below SPIRE — precisely the dependency rule one forbids.) The trust inputs are silicon from the factory and, at most, a list of hashes in a directory. Rule one survives intact.

The property you get is decisive for everything that follows: **node identity is anchored in a key that physically cannot be copied.** An attacker who fully compromises a node's disk and RAM still can't clone that node's identity onto other hardware. And critically for our story, node identities *survive the total destruction of a SPIRE server* — they were never stored in it.

The half everyone forgets is the other direction: **how does an agent know it's talking to the real server?** The standard answer is a bootstrap trust bundle — a file copied to each node "securely" before the agent starts. Read that again: a zero-trust identity plane, bootstrapped by *carefully copying a file*. It bites twice, because SPIRE agents must re-perform this server attestation not just at first boot but whenever trust is lost — an agent offline too long, or a server rebuilt without bundle continuity. That "rare" rebootstrap is exactly the moment an attacker would love to man-in-the-middle, and exactly the moment this architecture *depends on* being safe, since rebuilding servers from scratch is its signature move.

So the design uses TPMs in both directions: the SPIRE servers themselves run on TPM-equipped machines and prove their identity *down* to the agents, so the trust bundle an agent accepts is bound to hardware evidence rather than to whichever file was lying at `trust_bundle_path`. (SPIRE's agent supports pluggable bootstrap — including fetching the bundle from a local socket backed by a site-specific verifier — precisely so this step can be verifiable instead of hopeful.)

With attestation hardware-anchored in both directions, trust can now be *grown from nothing*, on demand, automatically. Time to grow two of them.

---

## Part 4: The SPIRE HA trust domain — two turtles, one shell

### The concept

Here is the central idea, and it deserves its own name: a **SPIRE HA trust domain**. Two complete, fully independent SPIRE servers *together* constitute a single SPIFFE trust domain. Not primary and standby. Not two replicas of one system. Two whole systems — each with its own rolling CAs, its own local datastore, its own copy of the registration records — jointly serving one trust domain, with their **trust bundles united** so that, to every workload and every verifier, they are indistinguishable halves of one identity plane.

An SVID signed by side A and an SVID signed by side B validate identically, everywhere, because everyone trusts the union of both bundles. That's the whole trick, and it's what makes each side individually *expendable*.

Concretely:

- **Two standalone SPIRE servers**, side A and side B, each on **its own dedicated node with its own TPM** — so even outright hardware failure of a server node takes down only half the trust domain, never the whole thing. Push the independence as far as practical: different racks, rooms, or buildings; different upgrade windows; changes rolled to one side at a time.
- **Nothing shared.** No replication link to break, no clustered database to corrupt (rule one already banned it), no common signing key to poison. A catastrophic failure of side A — including the kind where you *torch it and rebuild from nothing* — is, by construction, incapable of touching side B.
- **Both sides independently attest the same fleet** of nodes.

### Registration records: one set of YAML, two standalone servers

Part 1 said the registration records are half of what you control. Here's how that works with two servers and no shared database: each server runs **`spire-controller-manager` in standalone mode**, where — instead of watching a Kubernetes cluster — the controller manager loads entry manifests from plain YAML files on local disk and reconciles the server's registration entries to match.

Your registration records therefore live exactly where a bottom turtle's policy should live: as declarative YAML in your version control, **synced as files to both server machines**. Each side's controller manager independently reconciles its own server against its own copy. No coordination protocol between the sides, no shared state, no "dual registration" toil — just one set of files, two consumers, and standalone operation of both servers even when the other is gone. Recovery of a destroyed side's entries is `git checkout` plus a file sync.

### `spire-ha-agent`: the stitch at the edge

Two servers with two CAs would normally mean two trust domains and a federation headache. The **`spire-ha-agent`** (a project in the SPIFFE GitHub org, also shipped as a Helm chart) is what unites them — at exactly the right layer: the node.

On each workload node, a standard SPIRE agent connects to side A and another to side B. The `spire-ha-agent` sits in front of both and exposes a single, ordinary SPIFFE Workload API socket. Its two jobs:

1. **Unite the trust bundles.** Workloads receive both sides' bundles as one bundle — the mechanism that fuses two servers into one SPIRE HA trust domain.
2. **Route requests to whoever's alive.** X.509 SVID and JWT requests are forwarded to whichever server is currently responding. Both healthy? Fine. Side A on fire? Everything flows to B. The workload sees one socket, one API, zero drama.

From the workload's perspective, nothing about SPIFFE changes — same API, same libraries, same SVIDs. The redundancy is entirely invisible above the socket, which is exactly where redundancy should live.

```
                            ┌───────────────────────┐
                            │       Workload        │
                            └───────────┬───────────┘
                                        │ one Workload API socket
                            ┌───────────▼────────────┐
                            │     spire-ha-agent     │
                            │  united bundle A ∪ B   │
                            │   agent A + agent B    │
                            ├────────────────────────┤
                            │  Workload node │ TPM   │◄─── node attestation
                            └─────┬─────────────┬────┘     to BOTH sides
                                  │             │
                 ┌────────────────▼──┐       ┌──▼────────────────┐
                 │  SPIRE server A   │       │  SPIRE server B   │
                 │  own rolling CA   │       │  own rolling CA   │
                 │  local datastore  │       │  local datastore  │
                 │  controller-mgr   │       │  controller-mgr   │
                 │  (standalone,     │       │  (standalone,     │
                 │   entry YAML)     │       │   entry YAML)     │
                 ├───────────────────┤       ├───────────────────┤
                 │ Server node │ TPM │       │ Server node │ TPM │
                 └───────────────────┘       └───────────────────┘
                    (its own machine)           (its own machine)

                 ─── one SPIRE HA trust domain: spiffe://prod.example.com ───
```

### The payoff: seamless, automatic, *trust-preserving* recovery

Walk through the disaster, because this is where the architecture earns its keep.

**T+0 — Side B dies.** Completely. Node hardware fried, datastore gone, CA keys gone. On every workload node, the ha-agent's requests to B start failing; it routes everything to A. Workloads notice *nothing*. SVIDs continue to be issued, rotated, and signed by A, trusted everywhere because A's roots were always in the united bundle. The only alarm is on your dashboards, where it belongs.

**T+1 — You rebuild side B from scratch.** New hardware, fresh SPIRE install, **new CA, new keys** — no restore-from-backup, no attempt to resurrect old signing material. Remember Part 1: the CAs were always meant to be transient. A rebuild is just an unusually large rotation.

**T+2 — Trust re-establishes itself, both directions, with no human ceremony.** This is the step that's impossible without the earlier design rules:

- *New server → agents:* side B's new host attests via **its TPM**, so agents can verify the newcomer is legitimate infrastructure — not an impostor exploiting the outage — and accept its brand-new bundle into the union. The rebootstrap problem, the classic weak moment of SPIRE recovery, is closed by hardware evidence instead of by an engineer scp-ing bundle files at 3 a.m. to all nodes.
- *Agents → new server:* every node re-attests to side B via **its own TPM**. Node identities never depended on anything side B lost. Attestation is exactly as strong on day N of recovery as on day one, with zero re-enrollment.
- *Registration records:* sync the entry YAML to the new machine; its standalone controller manager reconciles the fresh server to the exact declared state. Your policy was in git all along.

**T+3 — Full redundancy restored.** The ha-agents fold B's new roots into the united bundle; issuance balances across both sides again. Workloads still have noticed *nothing*. At no point did any human copy a secret, eyeball-approve a trust bundle, or take a leap of faith.

Now run the same play deliberately: upgrade side A — SPIRE version bumps, config overhauls, even full CA rollovers — while B carries the fleet, then swap. The scariest operations in PKI become routine, because at any moment one entire half of your trust domain is *allowed to be broken*. And the ultimate case: if side A's keys are ever *suspected* compromised, you don't face the classic PKI apocalypse. Kill A entirely, let B carry the fleet, rebuild A fresh — the same automated path as any other failure. Your worst-case security event uses the same muscle memory as a routine upgrade. That's what it means for a root of trust to be *operable*.

### Why this beats the alternatives

- **Vs. database-clustered SPIRE HA:** the cluster needs its own certs from its own CA — failing rule one — and its replicas share one datastore and one CA, so systemic failures (bad migration, corruption, key compromise) hit every replica at once. Here, the two sides can't share a fate because they share nothing.
- **Vs. SPIRE federation:** federation links *distinct* trust domains and asks verifiers and policy to be federation-aware. A SPIRE HA trust domain is *one* domain; the redundancy is invisible to workloads. Different tool, different job.
- **Vs. nested SPIRE:** nesting shares an upstream root — the top of the tree is still a single trust anchor, and still a CA below your leaves. The only thing "below" this design is factory silicon: offline, not operated by you, and uninvolved in day-to-day issuance.
- **Vs. "just back up the CA keys":** a backup of a key is another secret, with all the same problems plus staleness — and it contradicts the premise that the CAs are transient. This design's recovery requires backing up *nothing sensitive at all*: registration YAML lives in git, and trust regrows from hardware.

---

## Part 5: Honest caveats

Selling a concept honestly means naming its edges.

- **`spire-ha-agent` is not as mature as SPIRE server/agent.** Its own README says it's early in development and not yet production-ready, and explicitly asks for testers and feedback. If this architecture appeals to you, that's an invitation: run it in staging, file issues, contribute. Foundational infrastructure matures exactly this way. There are sites running it in production dispite the warning so its fairly mature.
- **Startup bundle availability.** In the most basic setup, the ha-agent wants both servers reachable at *its* startup (steady-state outages are fine — that's the whole point). The documented mitigation is making the other side's bundle available out-of-band, which the TPM-verified server-attestation path is well suited to provide. This can be solved by establishing trust between the two servers and is now the recommended path.
- **TPM provisioning has a one-time step.** Collecting EK public-key hashes (or relying on manufacturer EK certificates, where present) happens once per machine in your provisioning pipeline. It's front-loaded, minimal — no CA, no enrollment service — and it's the price of a hardware anchor.
- **Config drift is the quiet enemy.** Two independent sides means discipline about rolling changes to both — which is also the feature, since one-side-at-a-time changes are your safety net. Drive both sides from the same versioned config and entry YAML, and drift becomes a diff, not a mystery.
- **Two sides means two things to monitor.** The failure mode of this architecture isn't an outage — it's *quietly running on one side for six months without noticing*. Alert on side-level health, not just workload-level success.
- **TPM attestation proves *which* machine, not *how healthy*.** If you also want issuance gated on measured machine integrity, projects like Keylime's SPIRE attestor extend the same TPM foundation in that direction.

None of these dent the thesis. They're the normal costs of moving your root of trust from "a file we try not to lose" to a system designed to be lost and regrown.

---

## Part 6: The pitch, restated in one paragraph

Every security architecture bottoms out somewhere. Most bottom out in a long-lived secret, delivered by hand, protected by process. This one bottoms out in SPIRE: a transient, continuously rolling set of CAs and a git-versioned set of registration records that *you, the organization, control* — with every other trust decision in your infrastructure flowing from that control. It's built self-contained, because a bottom turtle can't stand on another CA: standalone servers with local datastores, no clustered database demanding certificates from some deeper PKI, no cloud attestation API making a vendor your real root. Trust is established by attestation — TPMs anchoring both directions, nodes to servers and servers to agents, important but in service of the turtle rather than being it. And it's built in two independent halves, each on its own hardware, united into one SPIRE HA trust domain by `spire-ha-agent` and fed identical registration YAML through standalone `spire-controller-manager` instances — so that either half can fail, burn, and be reborn with fresh keys while workloads never miss a single certificate rotation. It's not turtles all the way down. It's one turtle you own, standing on silicon, built in two halves — and either half can carry the world while the other grows back.

That's a bottom turtle worth standing on.

## Note for the future

More articles will come, building up from here.

---

## References & further reading

1. Reference implementation of a bottom turtle SPIRE HA setup - Documentation at: https://github.com/spiffe/bootc/tree/main/demo
2. *Solving the Bottom Turtle* — the SPIFFE community book on SPIFFE/SPIRE as the foundation of trust: https://spiffe.io/book/
3. SPIFFE/SPIRE project documentation: https://spiffe.io/docs/latest/
4. `spire-ha-agent` — an agent for a SPIRE HA trust domain using two independent SPIRE servers: https://github.com/spiffe/spire-ha-agent (Helm chart: https://artifacthub.io/packages/helm/spiffe/spire-ha-agent)
5. `spire-tpm-plugin` — TPM 2.0 credential-activation node attestation for SPIRE: https://github.com/spiffe/spire-tpm-plugin
6. `spire-server-attestor-tpm` — TPM based server attestation plugin: https://github.com/spiffe/spire-server-attestor-tpm
7. SPIRE Agent configuration reference — trust bundle bootstrap, server attestation, and rebootstrapping: https://spiffe.io/docs/latest/deploying/spire_agent/
8. `spire-controller-manager` — including standalone mode via `staticManifestPath`, loading entry manifests from YAML files instead of Kubernetes: https://github.com/spiffe/spire-controller-manager/blob/main/docs/spire-controller-manager-config.md
9. SPIRE extension/plugin model (node and workload attestors): https://spiffe.io/docs/latest/planning/extending/
10. TCG — TPM 2.0 specifications and endorsement key architecture: https://trustedcomputinggroup.org/resource/tpm-library-specification/
11. Red Hat, "What are SPIFFE and SPIRE?" — background on SPIFFE as the identity control plane / "bottom turtle": https://www.redhat.com/en/topics/security/spiffe-and-spire
