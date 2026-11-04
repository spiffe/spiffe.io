---
title: "How long can SPIRE Server be unavailable before X.509 identity fails?"
description: "Deriving the outage budget from the issued certificate lifetime, and why availability_target does not take effect on most deployments."
date: 2026-08-09
author: "Santhosh Kumar Somarapu"
tags: ["SPIFFE", "SPIRE"]
draft: false
---

Every dependency has an outage budget, whether or not anyone has written it down. For a SPIRE
deployment the question is specific and answerable: if the server becomes unreachable right now, how
long do workloads keep working before identity starts failing?

**Scope.** This assumes every SPIRE Server instance is unreachable, the SPIRE Agent stays healthy and
running, and the workload already holds a cached X.509-SVID. It is about X.509-SVIDs only. JWT-SVIDs
rotate on the half-life strategy and have no availability target, so nothing below applies to them.
Code references are verified against
[SPIRE v1.15.2](https://github.com/spiffe/spire/tree/v1.15.2).

The answer matters because of how the failure presents. Once a cached X.509-SVID expires, new mTLS
handshakes using that credential fail; certificates are exchanged and authenticated during the
handshake, so already-established connections may stay up until they reconnect or perform
post-handshake authentication. The first failures are workloads whose cached X.509-SVIDs expire, plus
identities that were not already cached by the Agent and therefore need fresh issuance. Workloads do
not fail all at once.

The answer lies in the rotation code, but a configuration knob designed to extend this budget may do
nothing in a default deployment.

## The default budget is half the issued certificate lifetime

SPIRE's default X509 SVID TTL is one hour:

```go
// https://github.com/spiffe/spire/blob/v1.15.2/pkg/server/credtemplate/builder.go

// DefaultX509SVIDTTL is the TTL given to X509 SVIDs if not overridden by
// the server config.
DefaultX509SVIDTTL = time.Hour
```

One thing to get right before doing any arithmetic: the rotation code does not use your configured
TTL. It uses the lifetime of the certificate that was actually issued, `NotAfter − NotBefore`, which
the agent computes directly from the chain:

```go
// https://github.com/spiffe/spire/blob/v1.15.2/pkg/agent/manager/sync.go
svidLifetime := chain[0].NotAfter.Sub(chain[0].NotBefore)
```

Those can differ. Inspect a real issued SVID before trusting a number you derived from config.

Agents do not wait for expiry to rotate. From
[`pkg/common/rotationutil`](https://github.com/spiffe/spire/blob/v1.15.2/pkg/common/rotationutil/rotationutil.go),
the default strategy rotates once remaining validity drops below a jittered half of that lifetime:

```go
func shouldRotateByHalf(ttl, lifetime time.Duration) bool {
	// calculate a jitter delta to spread out rotations
	jitteredHalfLife := calculateJitteredHalfLife(lifetime)
	return ttl <= jitteredHalfLife
}
```

So with a one-hour issued lifetime, renewal comes due around the 30-minute mark and the workload
holds a credential valid for roughly another 30 minutes after that. That remaining runway is the
budget, and it is a range rather than a cutoff: **failures can begin after roughly 27 to 33 minutes
for SVIDs already near their rotation boundary, while an SVID issued moments before the outage may
stay valid for almost the full hour.**

That is a shorter budget than many operators assume, and better known before an incident than during
one.

## The jitter is already handled

One thing is worth calling out because it is the failure I went looking for and did not find. If every
agent rotated at exactly the half-life, agents that started together would renew together, and the
server would see synchronised load spikes, the classic thundering herd, arriving precisely when the
control plane is least able to absorb it.

SPIRE spreads them:

```go
// calculateJitteredHalfLife calculates jitter of the half-life of the SVID.
// The jitter is calculated as ± 10% of the half-life of the SVID.
func calculateJitteredHalfLife(lifetime time.Duration) time.Duration {
	halfLife := halfLife(lifetime)
	delta := jitterHalfLifeDelta(halfLife)
	minHalfLife := halfLife - delta
	return time.Duration(rand.Int63n(int64(delta)*2) + int64(minHalfLife))
}
```

The comment on the delta function says it outright: "to spread out the renewal of SVID rotations to
avoid spiky renewal requests." For a one-hour SVID, the half-life threshold is randomized between 27
and 33 minutes of remaining validity. Worth noting that this threshold is recalculated on each
rotation check rather than assigned once as a fixed renewal timestamp. It is a small amount of code
doing an important job, and it is the sort of thing that is invisible when it works.

## The availability target, and when SPIRE falls back to half-life rotation

SPIRE also offers a second strategy. Instead of rotating at the half-life, `availability_target`
lets you say how much valid-credential runway a workload should always have, rotating early enough
that every SVID retains at least this much life.

That is exactly the knob you want for outage tolerance. It carries two constraints, and they
interact.

**First, the configuration floor.** The agent refuses to start with anything under 24 hours:

```go
// https://github.com/spiffe/spire/blob/v1.15.2/cmd/spire-agent/cli/run/run.go
minimumAvailabilityTarget = 24 * time.Hour
...
if t < minimumAvailabilityTarget {
	return nil, fmt.Errorf("availability_target must be at least %s", minimumAvailabilityTarget.String())
}
```

**Second, the grace-period rule.** Even a valid target is ignored unless the certificate is long
enough to accommodate it:

```go
func shouldRotateByAvailabilityTarget(ttl, lifetime, availabilityTarget time.Duration) bool {
	if availabilityTarget == 0 {
		return false
	}

	if shouldFallbackX509Default(lifetime, availabilityTarget) {
		return false
	}

	jitteredAvailabilityTarget := calculateJitteredAvailabilityTarget(availabilityTarget)
	return ttl <= jitteredAvailabilityTarget
}

func shouldFallbackX509Default(lifetime, availabilityTarget time.Duration) bool {
	// if the grace period less than the threshold, it should be felt back to the default rotation strategy
	gracePeriod := lifetime - availabilityTarget
	return gracePeriod <= gracePeriodThreshold
}
```

with

```go
gracePeriodThreshold = 12 * time.Hour
```

Put the two together and the requirements are: `availability_target ≥ 24h`, **and** `issued lifetime
− availability_target > 12h`. The smallest usable issued lifetime is therefore strictly greater than
36 hours.

Worked examples:

| Issued lifetime | Target | Grace | Result |
|---|---|---|---|
| 1h (default) | any | negative | Falls back. No target can apply. |
| 36h | 24h | exactly 12h | Falls back. The comparison is `<=`. |
| 48h | 24h | 24h | Target applies. |

**On a deployment using the default one-hour SVID TTL, no availability target can ever take effect.**

This is not silent. When the lifetime cannot satisfy the target, the agent logs it:

```text
X509 SVID lifetime isn't long enough to guarantee the availability_target,
falling back to the default rotation strategy
```

It is easy to miss unless agent logs are being monitored, but the signal is there.

One more detail if the target does apply: it is not an exact rotation timestamp. SPIRE adds between
zero and ten minutes on top, so rotation comes due when remaining validity reaches approximately
`availability_target` through `availability_target + 10m`.

The fallback is explicitly implemented, and the configuration surface does not make the interaction
obvious. "I set the knob and the behaviour did not change" is a difficult thing to notice from the
outside.

## The Agent's own SVID is a second limit

Workload SVIDs are not the only clock running. The Agent holds its own X.509-SVID, and if that
expires while the Server is unreachable, restoring Server connectivity may not be enough on its own:
the Agent may need to re-attest before it can resume issuing.

So the practical recovery budget is the smaller of two runways, the Agent-SVID runway and the
workload-SVID runway. Deriving one and ignoring the other gives an answer that is too optimistic.

## Working out your own number

There are three things worth doing, none of which require new features.

**Derive the budget rather than guessing it.** Read `NotAfter − NotBefore` off a real issued SVID
rather than reading your config. With default rotation the budget is approximately half that, minus
up to 10% of the half for jitter, expressed as a range. Do the same for the Agent's SVID and take the
smaller. Write the number down next to your other dependency budgets. If your on-call runbook assumes
a longer window, one of the two is wrong.

**Check whether your availability target is real.** It needs to be at least 24 hours, and the issued
lifetime has to exceed it by more than 12 hours. If not, you are on half-life rotation, and the agent
log will say so. That check is cheap and the answer is binary.

**Decide the trade deliberately.** Longer lifetimes buy outage tolerance and cost you a wider
compromise exposure window, since a leaked credential stays valid until it naturally expires. Shorter
lifetimes are the opposite. There is no universally right answer, but there is a wrong one, which is
picking a lifetime for security reasons and inheriting an availability budget nobody examined.

The broader point generalises past SPIRE: the tolerance of a system to its control plane being
unavailable is usually an emergent property of settings chosen for other reasons, rather than
something anyone decided. Convert it into a number you can defend.
