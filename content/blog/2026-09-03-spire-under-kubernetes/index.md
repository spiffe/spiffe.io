---
title: "Bottom Turtle Kubernetes - SPIRE Under Kubernetes, Not Just On Top of It"
description: "Why the strongest place to put SPIRE is beneath the cluster, chaining Kubernetes identity into a trust chain rooted in hardware."
date: 2026-09-03
author: "Claude"
tags: ["SPIFFE", "SPIRE", "Community", "HA", "Bottom Turtle", "Kubernetes"]
---

## The obvious objection

The two previous articles in this series built a **SPIRE HA trust domain** on bare metal — two independent SPIRE servers, TPM attestation in both directions, and a `spire-ha-agent` on every node fusing both sides into one Workload API socket. The design article argued *why*; the deployment article showed the `dnf install` commands and then deleted one server's entire CA and datastore on purpose to prove the thing heals itself.

And a reasonable person's response to all of that is: *I run Kubernetes. There's a Helm chart. Why am I reading about systemd units?*

Because the usual answer — install SPIRE **into** the cluster — quietly makes Kubernetes the bottom turtle instead of SPIRE. This article makes the case for the other arrangement: put SPIRE **under** Kubernetes, then *chain* the cluster's identity into it, so that a pod's SVID and a node's kubelet identity both trace back to the same root. Not SPIRE built on top of Kubernetes' trust. Kubernetes built on top of SPIRE's.

It's a short argument, and it has three parts: what the conventional deployment actually roots trust in, how the chaining works, and things you can only do from underneath.

---

## Part 1: What "SPIRE on top of Kubernetes" roots trust in

Take the standard in-kubernetes deployment. SPIRE server and agents run as pods. Agents attest with the `k8s_psat` node attestor, which takes a projected service account token from the agent pod and validates it by calling `TokenReview` on the API server. Workloads are attested with the `k8s` workload attestor, which asks the local kubelet which pod owns the connecting process.

Now apply the design article's litmus test: **does anything below SPIRE require a certificate, a CA, or a secret that SPIRE didn't issue?**

- The service account token is signed by the **service account signing key**, a file the installer wrote to `/etc/kubernetes/pki`.
- `TokenReview` reaches the API server over TLS validated by the **Kubernetes CA**, another file the installer wrote.
- The workload attestor's query to kubelet is authenticated with the agent's own service account credential and verified against kubelet's serving certificate — both anchored in that same CA.
- kubelet got its client certificate in the first place from a **bootstrap token** that a provisioning script placed on the node.
- Any of those files, on any control plane node, is enough to mint an identity the whole trust domain will believe.

And here is the part that should give you pause, because it is the exact opposite of everything the design article argued for. **Kubernetes' cluster CA is, by default, a ten-year self-signed root**, sitting as a plain file on every control plane node, alongside a service account signing key that has no expiry at all and in practice is never rotated because rotating it invalidates every token in the cluster at once. `kubeadm` writes them once at `kubeadm init` and they outlive the hardware.

That is a crown-jewel set of keys whose compromise *is* an extinction event — the thing the bottom turtle design exists to eliminate. Recall what SPIRE does instead: a `ca_ttl` of 24 hours, continuously rolling, deliberately disposable, and in the last article we deleted one on purpose to prove it. Putting a system built on 24-hour rolling CAs on top of a system built on a ten-year static one means the ten-year key is your real root of trust. You did not get short-lived credentials; you got short-lived credentials whose validity depends on an up to decade-old file nobody has touched since installation day.

So the honest description of SPIRE-in-Kubernetes is: a certificate authority whose root of trust is a ten-year static PKI, bootstrapped by a human or a provisioning pipeline placing secrets on disk. That makes SPIRE a **middle turtle**. The real one is `kubeadm`.

This is not a reason to sneer at in-kubernetes SPIRE. Compared to a fleet of static secrets in ConfigMaps it's an enormous improvement, and for a great many organizations it is the right amount of work. But be clear about the blast radius you've bought: anything that can mint a service account token, or reach the signing key, or convince the apiserver to lie, can mint any identity in your trust domain. Your identity system inherits the security of your cluster bootstrap.

### The ordering problem, which is worse

There's a second limitation, and it's the one that actually forces the issue. A SPIRE that lives inside the cluster cannot serve anything that runs **before or beneath** the cluster:

- `kubelet`, which needs a credential to join the API server *before* any pod exists.
- The **image credential provider plugih**, which kubelet runs on the host to authenticate to a registry — including the registry holding the SPIRE images themselves.
- `sshd`, whose host key is how you know you're talking to the right machine when the cluster is broken.
- The log shipper and metrics exporters, which you need most in exactly the window when the cluster is down.

Notice what that list has in common. It is, almost exactly, the list of things whose compromise hands over the cluster. The components most worth attesting are the ones an in-kubernetes identity system structurally cannot reach — because they need identity earlier in the boot order than the thing issuing it.

You can't fix that from the top. You have to start lower.

---

## Part 2: Chaining, not replacing

The move is not "run SPIRE on the host instead." It's to run the host trust domain from the previous two articles, and then make the in-kuberntees SPIRE server a **downstream** of it — a nested SPIRE whose CA is signed by the root, and whose agents attest with credentials issued by the host, not by Kubernetes.

It is less exotic than it sounds: the same chart you'd install anyway, four releases, and three mechanisms doing the actual work. Here's the install first, then what it wires up.

### Installing it: one chart, four releases

The Kubernetes side is a single chart, `spire-nested`, installed four times. Your values file stays small, because the bottom turtle wiring lives in the chart rather than in your configuration:

```yaml
global:
  spire:
    recommendations:
      enabled: true
    namespaces:
      create: false
    clusterName: example-cluster
    trustDomain: example.org
```

Then the CRDs, the shared infrastructure, and one release per side:

```bash
# CRDs first
helm upgrade --install -n spire-mgmt --create-namespace \
  spire-crds spire-crds --repo https://spiffe.github.io/helm-charts-hardened/

# Shared infrastructure: the in-kubernetes spire-ha-agent, OIDC discovery, namespaces
helm upgrade --install --create-namespace --namespace spire-mgmt --values spire-values.yaml \
  spire oci://ghcr.io/spiffe/helm-charts/spire-nested \
  --set tags.haAgentCommon=true \
  --set "global.spire.namespaces.create=true" \
  --set "global.spire.ingressControllerType=ingress-nginx" \
  --set "spiffe-oidc-discovery-provider.ingress.enabled=true"

# Side A: its own nested server and agents, chained to root server A
helm upgrade --install --namespace spire-mgmt --values spire-values.yaml --wait \
  spire-a oci://ghcr.io/spiffe/helm-charts/spire-nested \
  --set tags.bottomTurtleHAA=true \
  --set "global.spire.ingressControllerType=ingress-nginx"

# Side B: the same, chained to root server B
helm upgrade --install --namespace spire-mgmt --values spire-values.yaml --wait \
  spire-b oci://ghcr.io/spiffe/helm-charts/spire-nested \
  --set tags.bottomTurtleHAB=true \
  --set "global.spire.ingressControllerType=ingress-nginx"
```

Four releases rather than one is the operational point, not packaging tidiness. `spire-a` and `spire-b` have entirely independent lifecycles, so you upgrade one side, watch it, and only then touch the other — a bad chart version becomes a one-sided problem instead of an outage. It is the same one-side-at-a-time discipline the host layer gets from having two physically separate servers, carried up into the cluster.

The `haAgentCommon` release is the shared half: namespaces, the OIDC discovery provider, and a `spire-ha-agent` running *inside* the cluster, doing for pods exactly what the host one does for host services — merging both sides into a single Workload API socket, with nothing to fail over because both paths are always live.

The rest of this section is what those three tags actually wire up.

### The bridges: Unix sockets and entries on the host

Both halves of the in-kubernetes SPIRE need to prove themselves to the root servers, and the only attestor that can see a pod from the host's point of view is the host's own workload attestor. So the host exposes its Workload API into the cluster through a tiny socket bridge, `spiffe-socat-unix`, installed from the same package repo as everything else — one pair for the in-kubernetes servers, one pair for the in-kubernetes agents:

```bash
# Control plane nodes only: the in-kubernetes SPIRE servers
systemctl enable --now \
  spiffe-socat-unix@k8s-spire-server-a.service \
  spiffe-socat-unix@k8s-spire-server-b.service

# Every node running an in-kubernetes SPIRE agent
systemctl enable --now \
  spiffe-socat-unix@k8s-spire-agent-a.service \
  spiffe-socat-unix@k8s-spire-agent-b.service
```

A pair per side, in both cases, because each bridge fronts one side's host agent and the two sides stay independent all the way up.

Each bridge unit is a workload in its own right, so the root servers can attest it by systemd unit. The server bridges get a `downstream: true` identity:

```yaml
apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterStaticEntry
metadata:
  name: node1-k8s-spire-server
spec:
  parentID: spiffe://${SPIFFE_TRUST_DOMAIN}/agent/node1
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/k8s-spire-server/node1
  selectors:
  - systemd:id:spiffe-socat-unix@k8s-spire-server-${SUBINSTANCE}.service
  downstream: true
  federatesWith:
  - spire-ha
```

`downstream: true` is critical for the spire-server entry: it authorizes the holder to request an X.509 CA certificate rather than a leaf. The in-kubernetes SPIRE server runs `UpstreamAuthority "spire"` pointed at the root server for its side, authenticating with the SVID it gets through that bridge — delivered into the pod by a dedicated SPIFFE CSI driver, so no Kubernetes Secret is involved at any point:

```yaml
upstreamAuthority:
  spire:
    enabled: true
    upstreamDriver: upstream-a.csi.spiffe.io
    server:
      address: "spire-server-a"
      port: 8081
```

An important note, anything that can open that unix socket can become a downstream SPIRE server for your trust domain. Bridge it on control plane nodes only, keep the in-kubernetes SPIRE servers pinned to those nodes, and treat the socket path with the same care you'd treat a CA key. The agent bridges below are far less dangerous — they hand out an ordinary leaf identity, not a CA — but they are still an identity anything on the node can claim, so the same instinct applies.

### In-kubernetes agents attest with host identity, not Kubernetes identity

The second mechanism is the one that surprises people. In the chained arrangement, `k8s_psat` is turned *off* for the in-kubernetes agents, and they attest with `x509pop` against a bridged host socket instead:

```yaml
nodeAttestor:
  k8sPSAT:
    enabled: false
  x509POP:
    enabled: true
    spiffeEndpointSocket: /var/run/spiffe/socat/unix/k8s-spire-agent-a/public/api.sock
```

That socket is the second bridge pair from above, and the SVID behind it comes from an entry on the root servers that looks like the server one with the dangerous parts removed — no `downstream`, no `federatesWith`, just a leaf:

```yaml
apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterStaticEntry
metadata:
  name: node3-k8s-spire-agent
spec:
  parentID: spiffe://${SPIFFE_TRUST_DOMAIN}/agent/node3
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/spire-exchange/k8s/production/node3.${SPIFFE_TRUST_DOMAIN}
  selectors:
  - systemd:id:spiffe-socat-unix@k8s-spire-agent-${SUBINSTANCE}.service
```

The `/spire-exchange/k8s/<cluster>/` path is not decoration. It is the prefix the in-kubernetes server's `x509pop` attestor is configured to accept, so only host identities minted for this purpose can present themselves as agents — an allowlist expressed as a namespace in your SPIFFE ID layout.

So the in-kubernetes SPIRE server never asks Kubernetes anything in order to decide whether an agent is real. It checks a certificate that traces to the root CA, which traces to a TPM. Node attestation inside Kubernetes stops depending on Kubernetes.

### What the trust chain looks like when you're done

```
  root spire-server @ side A / side B  (independent CAs, no shared state)
   └─ spire-agent@a / spire-agent@b  (TPM node attestation, both directions)
       └─ spire-ha-agent  (one Workload API, unioned bundle)
           ├─ host services: sshd, kubelet, metrics, logs, image pull
           ├─ spiffe-socat-unix@k8s-spire-server-{a,b}  (control plane nodes only)
           │   └─ in-kubernetes spire-server  (downstream CA from the root)
           └─ spiffe-socat-unix@k8s-spire-agent-{a,b}  (every node)
               └─ in-kubernetes spire-agent  (x509pop; SVIDs signed by the server above)
                   └─ in-kubernetes spire-ha-agent
                       └─ pod SVIDs
```

Every arrow is an attestation, and every certificate at the bottom validates up to the top. A pod's SVID and a node's sshd host certificate are cousins in the same chain. That's the sentence worth the whole architecture: **the security is extended from the hardware into Kubernetes, rather than borrowed from Kubernetes.**

### The best part: the in-kubernetes SPIRE servers becomes disposable

Look at what the in-kubernetes SPIRE server keeps, in the reference values:

```yaml
persistence:
  type: emptyDir
keyManager:
  memory: {}
```

Nothing. No PVC, no keys on disk. Its CA is signed from above, its registration entries are reconciled from CRs, and its agents re-attest with proof that lives on the host. In the conventional deployment, the SPIRE datastore is the crown jewel you back up, guard, and pray about. Here it's just a cache.

Which means `helm uninstall`, or a full cluster rebuild, is not an identity event. Nothing to re-enroll, no bundle to copy, no trust ceremony. Pair that with the previous article's drill — destroying a root server's CA and datastore outright and watching it rejoin — and you have a stack where both the cluster *and* either root server are individually expendable.

---

## Part 3: The four things you can only do from underneath

### 1. Host services join the same trust domain

Once the `spire-ha-agent` is on the host, everything on the host can have an identity — and the ha-agent attests each caller by PID, so one socket serves many callers with different SPIFFE IDs. Register the caller and it gets its own SVID.

**sshd** is the easy win. `spiffe-step-ssh` issues SSH *host* certificates from SPIFFE identity, so the "authenticity of host cannot be established" prompt — the trust-on-first-use hole everybody clicks through — goes away, with one client per side so either side's CA is sufficient. Because it's ordinary packages and systemd units, rolling it across a fleet is an Ansible playbook rather than a platform migration. That pairing deserves its own article and will get one; what matters here is that the option exists at all, which it doesn't when SPIRE lives inside the cluster.

**Metrics and logs** are the quieter win. A node exporter scraped over mTLS with an SVID, a log shipper presenting an SVID to a central aggregator that authorizes by SPIFFE ID — no per-host scrape credential, no shared bearer token in a config management repo, no certificate expiring at 2 a.m. And, critically, this telemetry path is rooted *below* Kubernetes, so it still works when Kubernetes doesn't. Observability that dies with the thing you're observing isn't observability.

### 2. kubelet → kube-apiserver, attested to hardware

This is the inversion made concrete: Kubernetes' own control-plane authentication, verified against SPIFFE, all the way down to the TPM.

Two small tools do it. On the Kubernetes API server side, `k8s-spiffe-workload-auth-config` updates the `AuthenticationConfiguration` file — it fetches the trust bundle from the Workload API and injects the bundle into the `certificateAuthority` field, so `kube-apiserver` trusts a `spiffe-oidc-discovery-provider` that is itself running on the host with a SPIRE-issued serving certificate. No web PKI, no manually pasted CA. Bottom turtle trust domain. The interesting part is the claim mapping:

```yaml
apiVersion: apiserver.config.k8s.io/v1beta1
kind: AuthenticationConfiguration
jwt:
  - issuer:
      url: https://oidc-discovery-provider.example.com
      audiences:
        - k8s-one
      certificateAuthority: changeme   # maintained by the tool
    claimMappings:
      username:
        expression: 'claims.sub.startsWith("spiffe://example.com/k8s/one/nodes/")? claims.sub.replace("spiffe://example.com/k8s/one/nodes/", "system:node:"): claims.sub'
      groups:
        expression: 'claims.sub.startsWith("spiffe://example.com/k8s/one/nodes/")? ["system:nodes"]: []'
```

A SPIFFE ID becomes `system:node:<name>` in the `system:nodes` group — a first-class node identity, authorized by the ordinary Node authorizer and NodeRestriction admission plugin. Nothing about Kubernetes RBAC has to change. The trust domain provides identity. Kubernetes provides Authorization.

On the kubelet side, `k8s-spiffe-workload-jwt-exec-auth` is a client-go exec credential plugin. You delete `client-certificate` and `client-key` from `/etc/kubernetes/kubelet.conf` and put this in their place:

```yaml
  user:
    exec:
      apiVersion: "client.authentication.k8s.io/v1"
      command: "k8s-spiffe-workload-jwt-exec-auth"
      interactiveMode: Never
      env:
        - name: SPIFFE_ENDPOINT_SOCKET
          value: "unix:///var/run/spire/agent/sockets/main/public/api.sock"
        - name: SPIFFE_JWT_AUDIENCE
          value: "k8s-one"
        - name: SPIFFE_JWT_HINT
          value: "kubelet"
      args:
        - "-timeout=5s"
```

kubelet now authenticates to the API server with a short-lived JWT-SVID fetched from the local `spire-ha-agent`, valid because SPIRE proved the node has a specific TPM. Deleted from your life: bootstrap tokens, the CSR approve-and-rotate dance, kubelet client certificate expiry, and the job of getting a node bootstrap credential onto a machine safely in the first place.

That `SPIFFE_JWT_HINT` line is worth a note. kubelet service needs *two* identities — one to authenticate kubelet itself to Kubernetes as the exact node and one for the image pull plugin to pull images — so its registration entries carry hints to tell them apart:

```yaml
# entry one
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/kubelet/node2.${SPIFFE_TRUST_DOMAIN}
  hint: kubelet
# entry two
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/kubelet
  hint: image-pull
```

### 3. Image pull with no pull secret — which *has* to be on the host

Registry credentials are the cleanest illustration of the ordering problem, because the chicken-and-egg is unavoidable: **you cannot use an in-kubernetes SPIRE to pull the images that run your in-kubernetes SPIRE.**

kubelet's image credential provider plugin is a binary on the node, run before any pod exists. Given a host identity, it can present two credentials to a `spire-identity-exchange`: the pod's projected service account token, and the node's own JWT-SVID from the ha-agent. The exchange mints a registry token, and the registry authorizes by SPIFFE ID.

Net effect: `imagePullSecrets` — long-lived bearer tokens, copied into every namespace, rotated never — stop existing. And the mechanism keeps working during a cluster rebuild, because it never depended on the cluster.

More details on how to do this in a future article.

### 4. One identity plane instead of two

The cumulative benefit is the least flashy and probably the most valuable: there is **one** trust domain, one set of declarative registration records in git, one bundle, and one story for how identity is established — covering the TPM, the host, the control plane, the registry, and the pods.

The alternative, which is what most organizations actually have, is two or three disjoint identity systems that meet at a translation layer: cloud IAM under the nodes, Kubernetes service accounts inside, SPIRE somewhere in the middle, and a pile of secrets bridging the gaps. Every seam is a place where a long-lived credential lives because nothing else could span it.

### 5. Note, Kubernetes CA's

We have not figured out yet what the best aproach is to enabling Kubernetes/etcd to use the SPIFFE trust domain for its own CA's rather then its own 10 year CAs. Help wanted.

The lack of this feature does not invalidate all the bottom turtle progress described above.

---

## Honest caveats

- **That bridged socket is genuinely powerful.** Whoever opens `spiffe-socat-unix@k8s-spire-server-*` becomes a downstream SPIRE server. Control plane nodes only, and think about who can reach the path.
- **You own the hosts now.** This argument does not apply to managed Kubernetes. On EKS, GKE, or AKS you don't control kubelet's kubeconfig, the API server flags, or the node image, so the chaining described here isn't available to you — in-kubernetes SPIRE is the right answer there. You already outsourced management and control to your provider. This is for Kubernetes clusters whose nodes are yours.
- **More moving parts, on the host, where your cluster tooling can't see them.** Packages, systemd units, and per-node registration entries. Manageable with ordinary configuration management, but it *is* more surface, and the previous article's warning stands: drive both sides from the same versioned files or config drift becomes a mystery instead of a diff.
- **Several of these tools are in the development phase**, and say so on their badges: `k8s-spiffe-workload-auth-config`, `k8s-spiffe-workload-jwt-exec-auth`, `spire-identity-exchange`, and `spiffe-step-ssh`. `spire-identity-exchange`'s README asks you not to run it in production yet. Take them at their word, and file the bugs you find.
- **`spire-ha-agent` is still young**, and it now sits in the request path of host services, the cluster's SPIRE, and image pulls. That's a lot of trust, which is a good reason to run it somewhere unimportant first.

---

## Where this leaves you

The conventional deployment asks Kubernetes to vouch for SPIRE. This one asks SPIRE to vouch for everything, including Kubernetes — for kubelet, for the images the cluster runs, and for the ssh session you use when the cluster is down.

The cost is that you install some packages on your hosts. The benefit is that your identity system stops inheriting the security of your cluster bootstrap, and starts being the thing your cluster bootstrap inherits from. Every credential in the stack, from a pod's mTLS certificate to a node's ssh host key, becomes traceable to a TPM you can point at.

The reference implementation of the Kubernetes layer is linked below, and it runs in CI on every change — including deleting side A's entire Helm release and then confirming that an image pull still succeeds from side B alone. Stand it up on hardware you don't care about, break a side on purpose, and tell the project what went wrong.

---

## References & further reading

1. *The Bottom Turtle That Heals Itself - Design* — the architecture this builds on: https://spiffe.io/blog/2026-07-19-bottom-turtle-ha-architecture/
2. *The Bottom Turtle That Heals Itself - Deployment from Scratch* — the two-server host build, package by package: https://spiffe.io/blog/2026-10-23-bottom-turtle-ha-deployment/
3. Kubernetes bottom turtle HA reference example — diagrams, values files, registration manifests, and the CI test: https://github.com/spiffe/helm-charts-hardened/tree/main/examples/bottom-turtle-ha
4. `spire-nested` Helm chart — the `bottomTurtleHAA` / `bottomTurtleHAB` / `haAgentCommon` tags quoted above: https://github.com/spiffe/helm-charts-hardened/tree/main/charts/spire-nested
5. `k8s-spiffe-workload-auth-config` — maintains the API server's `AuthenticationConfiguration` trust bundle: https://github.com/spiffe/k8s-spiffe-workload-auth-config
6. `k8s-spiffe-workload-jwt-exec-auth` — exec credential plugin for kubelet and users, including hint selection: https://github.com/spiffe/k8s-spiffe-workload-jwt-exec-auth
7. `spire-identity-exchange` — token exchange for registry auth and platform-native identity: https://github.com/spiffe/spire-identity-exchange
8. `spiffe-step-ssh` — SSH host certificates from SPIFFE, including the two-CA HA setup: https://github.com/spiffe/spiffe-step-ssh
9. `spire-ha-agent` — the HA agent, `spire-trust-sync`, and broker mode: https://github.com/spiffe/spire-ha-agent
10. Reference bootable-image implementation of the host layer: https://github.com/spiffe/bootc/tree/main/demo
11. Kubernetes Structured Authentication Configuration, which makes the API server side possible: https://kubernetes.io/blog/2024/04/25/structured-authentication-moves-to-beta/
12. Nested SPIRE architectures and `UpstreamAuthority "spire"`: https://spiffe.io/docs/latest/spire-helm-charts-hardened-advanced/nested-spire/
