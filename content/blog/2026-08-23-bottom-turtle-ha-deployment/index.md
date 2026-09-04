---
title: "The Bottom Turtle That Heals Itself - Deployment from Scratch"
description: "Building a two-server SPIRE HA trust domain from scratch on Red Hat, with ordinary packages and systemd units."
date: 2026-08-23
author: "Claude"
tags: ["SPIFFE", "SPIRE", "Community", "HA", "Bottom Turtle"]
images: ["cover.png"]
---

## From design to disk

The previous article in this series, *The Bottom Turtle That Heals Itself - Design*, made an argument and then refused to show you a single line of configuration. That was deliberate. It laid out what a **SPIRE HA trust domain** is — two complete, fully independent SPIRE servers jointly serving one SPIFFE trust domain, their trust bundles united so that an SVID from either side validates everywhere — and it defended the two design rules that shape it:

- **Rule one:** the bottom turtle can't stand on another CA. No clustered database, no upstream corporate CA, no cloud attestation API. Each server is a sealed unit with a local datastore.
- **Rule two:** trust is established by attestation, anchored in hardware — in *both* directions. Nodes prove themselves to servers, and servers prove themselves to agents, so that a server can be rebuilt from nothing without an engineer copying a bundle file at 3 a.m.

If you want to start with a prebaked/integrated solution rather than build up from scratch, please see [Reference Demo](https://github.com/spiffe/bootc).

This article implements those rules on hardware you can actually buy, with software you install the standard Linux distro way: `dnf install`, a handful of `systemd` units, and some text files in `/etc`.

Concretely, you will end up with two Linux servers — call them side A and side B — each running its own SPIRE server with its own rolling CA and its own SQLite datastore, plus any number of workload nodes where a `spire-ha-agent` fuses both sides into a single Workload API socket. Then you will break one of the servers on purpose — wipe its CA and its entire datastore — and watch it rebuild itself and rejoin, with no human trust ceremony at any point.

A note on what is *absent*, because the absences are the architecture. There is no clustered database. No `keepalived`, no HAProxy, no virtual IP, no load balancer, no DNS failover, no Kubernetes. Nothing is shared between the two sides at all. Failover in this design is **client-side**: the `spire-ha-agent` on each node holds connections to both servers simultaneously and uses whichever answers. There is nothing to fail *over*, because both paths are always live. If you go looking for the HA machinery and can't find it, that's the point — it's about four hundred lines of Go sitting next to your workloads.

Everything below is real, currently-shipping configuration. Where a file is long, I quote only the stanzas that carry weight and link the complete version at the end.

---

## Part 1: What you need before you start

**Two machines with TPM 2.0's**, which in practice means essentially any server made in the last decade, plus a TPM header module if you're building from small-board hardware. These are your two sides. Push their independence as far as you practically can — different racks, different rooms, different power. The whole promise of this design is that losing one of them is a non-event, and that promise is only as good as their physical separation.

**Any number of workload nodes**, which also want TPMs, because they attest to both servers.

**A stock Red Hat 10 (or compat) system** on each. This article was written against RHEL 10 and AlmaLinux 10; the packages are built for `el10` on both `x86_64` and `aarch64`. Nothing here needs image mode, containers, or a custom OS build. Only very minor changes are needed for Debian or Ubuntu systems. Use the deb repo and apt to install.

**A correct clock, before anything else.** This is not boilerplate. The configuration below sets `ca_ttl = "24h"` and `default_x509_svid_ttl = "1h"`, and every `systemd` unit involved carries `After=time-sync.target`. Short-lived credentials are unforgiving about clock skew: a server whose clock is a day off will mint certificates that every one of its peers rejects, and the error messages will not say "your clock is wrong." So install `chrony`, confirm `date` looks sane, and on hardware with a real-time clock, persist it:

```bash
hwclock -w
```

**A trust domain name.** The packages default to `example.org`, and the examples below keep that so you can copy them literally, but pick your real one now — it is baked into every SPIFFE ID and is not something you want to change later.

**Two per-side DNS names**, `spire-server-a.example.org` and `spire-server-b.example.org`, resolving to the two machines. Entries in `/etc/hosts` are entirely sufficient. Note what you are *not* creating: a single shared name pointing at both. Resist the instinct. The agents connect to the two sides by distinct names, deliberately and permanently, and a shared name that round-robins between two servers with two different CAs will cause exactly the confusion you'd expect.

---

## Part 2: Installing the packages

SPIRE upstream ships release tarballs rather than RPMs, so the SPIFFE community maintains a package repository that wraps them along with the plugins and `systemd` units this architecture needs. Add it on every machine:

```bash
curl -L -o /etc/yum.repos.d/spire-examples.repo \
  https://raw.githubusercontent.com/spiffe/spire-examples/refs/heads/main/examples/rpms/spire-examples.repo
```

Which gives you:

```ini
[spire-examples]
name=spire-examples rpms
baseurl=https://spiffe.github.io/spire-examples/RPMS/$basearch/el$releasever
enabled=1
gpgcheck=0
```

This is community packaging, not Red Hat's, and as shipped it sets `gpgcheck=0`. For anything you care about, mirror these packages into your own repository, sign them with your own key, and pin versions. Treat this repo the way you'd treat any third-party COPR: fine for building your understanding, not something to point production at unexamined. If you want to help make these packages better, please contact the team on Slack or via GitHub issues.

On **both server machines**:

```bash
dnf install -y \
  spire-server spire-agent spire-controller-manager \
  spire-server-nodeattestor-tpmdirect spire-agent-nodeattestor-tpmdirect \
  spire-server-attestor-tpm-sign spire-server-attestor-tpm-signer-unix \
  spire-server-attestor-tpm-verifier \
  spire-ha-agent spire-trust-sync \
  nginx tpm2-tools
```

On **every workload node**:

```bash
dnf install -y \
  spire-agent spire-agent-nodeattestor-tpmdirect \
  spire-server-attestor-tpm-verifier spire-ha-agent tpm2-tools
```

The versions you get at the time of writing: SPIRE 1.15.3, `spire-controller-manager` 0.7.0, `spire-ha-agent` 0.4.0, the TPM node attestor 1.11.3, `spire-server-attestor-tpm` 0.0.4, and `spiffe-helper` 0.11.0.

Notice that the *server* machines also install the agent, the HA agent, and `spire-trust-sync`. Each server is also an ordinary node in the trust domain, running two agents like everybody else — which is what later lets a service on server A hold an identity issued by server B. Build the servers on top of the node configuration, not beside it.

### The one mechanic you have to understand: instance templates

Every unit here is a `systemd` template, instantiated with a name after the `@`. You will run `spire-agent@a` and `spire-agent@b` on the same machine, `spire-ha-agent@main`, `spire-server@main`, and `spire-trust-sync@b`. If the templating clicks, the rest of this article is mechanical; if it doesn't, everything will look like redundant duplication.

Three things make it work. First, the unit exports the instance name into the environment:

```ini
Environment=INSTANCE=%i
Environment=SYSTEMD_INSTANCE=%i
Environment="SPIRE_AGENT_ADMIN_ADDRESS=/var/run/spire/agent/sockets/%i/private/admin.sock"
```

Second, SPIRE is run with `-expandEnv`, so its config file can reference those variables. Together, these mean **one** agent config file produces two differently-pointed agents — `spire-agent@a` talks to `spire-server-a`, `spire-agent@b` talks to `spire-server-b`, from identical text. You will see exactly how in Part 5.

Third, environment files are layered from general to specific, and all are optional:

```ini
EnvironmentFile=-/etc/spiffe/default-trust-domain.env
EnvironmentFile=-/etc/spire/agent/default.env
EnvironmentFile=-/etc/spire/agent/%i.env
EnvironmentFile=-/etc/spire/agent/%i/env
```

So set the trust domain once, globally, and never again:

```bash
echo 'SPIFFE_TRUST_DOMAIN=example.org' > /etc/spiffe/default-trust-domain.env
```

Config files follow the same general-to-specific pattern. The server's launcher prefers `/etc/spire/server/<instance>/config`, then `/etc/spire/server/<instance>.conf`, and finally falls back to `/etc/spire/server/default.conf`. The agent's launcher prefers `/etc/spire/agent/<instance>.conf` over `/etc/spire/agent/default.conf`. Because we want both agents to share one file, we will edit `default.conf` — and because the packages mark these `%config(noreplace)`, your edits survive upgrades.

Finally, the units are organized under targets, which is how you start and stop a whole side at once:

```
multi-user.target
└── spire.target
    ├── spire-server.target  → spire-server@main, spire-controller-manager@main
    └── spire-agent.target   → spire-agent@a, spire-agent@b, spire-ha-agent@main
```

One caveat worth internalizing now: the packages ship *evaluation-grade* defaults. The stock `/etc/spire/server/default.conf` uses the `join_token` node attestor and a 168-hour CA; the stock agent config sets `insecure_bootstrap = true`. Those are fine for kicking the tires on a laptop and are precisely what rule two forbids. Most of what follows is replacing them.

---

## Part 3: The TPM, in both directions

The design article insisted that attestation has two halves and that almost everybody implements one of them. Here they both are.

### Half one: nodes proving themselves to servers

This is the familiar direction, handled by the `tpmdirect` node attestor. It works by TPM 2.0 credential activation: the server encrypts a challenge such that only the physical TPM holding the matching endorsement key can decrypt it. What makes it a good fit for a bottom turtle is what it *doesn't* need — no enrollment service, no certificates issued to nodes ahead of time, no CA anywhere below SPIRE.

On each machine in the fleet, ask its TPM to identify itself:

```bash
get-tpm-pubhash
```

That prints a hash of the TPM's public endorsement key. Authorization is then about as simple as authorization gets — an empty file named after the hash, in the server's allowlist directory:

```bash
touch /etc/spire/server/main/tpm-direct/hashes/<the-hash-you-just-printed>
```

That directory is created for you when the server first starts. Two things to hold onto:

- **Every TPM must be allowlisted on both servers.** The sides share nothing, including this. A node allowlisted only on A will attest to A and be rejected by B, which is a genuinely confusing way to be half-broken.
- The resulting selector is `tpm:pub_hash:<hash>`, and that is what your node registration entries will match on.

Collecting hashes is the one-time provisioning step the design article flagged as an honest cost. In a real fleet this belongs in whatever already racks and images your machines: read the hash during provisioning, commit it next to the entry YAML.

### Half two: servers proving themselves to agents

This is the half everyone forgets, and the reason this architecture can rebuild a server from nothing. Instead of copying a trust bundle to each node and hoping, each server *signs* its trust bundle with a key held in its own TPM, publishes it over plain HTTP, and every node verifies that signature against a pinned public key.

First, create the signing key inside the TPM. The convention is a primary key at persistent handle `0x81000001` and the signing key at `0x81008006`:

```bash
tpm2_createprimary -C o -g sha256 -G rsa2048 -c primary.ctx
tpm2_evictcontrol -C o -c primary.ctx 0x81000001
tpm2_create -G rsa2048:rsassa:null -g sha256 -u key.pub -r key.priv -C 0x81000001
tpm2_load -C 0x81000001 -u key.pub -r key.priv -c key.ctx
tpm2_evictcontrol -C o -c key.ctx 0x81008006
```

Then export the *public* half, naming the file after the side you're on (`a.pem` on side A, `b.pem` on side B):

```bash
tpm2_readpublic -c 0x81008006 -f pem -o /etc/spire/server-attestor-tpm/keys/a.pem
```

The private key was generated inside the TPM and cannot be extracted. That is the entire foundation.

Next, teach the server to sign its bundle with it. Two pieces cooperate: a small local daemon that owns the TPM handle, and a SPIRE `BundlePublisher` plugin that hands it the current bundle whenever it changes. The daemon is configured in `/etc/spire/server-attestor-tpm/signer-unix.conf`:

```yaml
socket: /var/run/spire/server-attestor-tpm/signer-unix.sock
tpm-address: 0x81008006
duration: 10m
dir: /usr/share/nginx/html
```

Note `dir` — the signed token is written straight into a web root as `spiffetrustbundle.token`, refreshed every `duration`. Serving it is an ordinary `nginx` vhost on port 81, dropped in at
`/etc/nginx/conf.d/spire.conf`:

```nginx
server {
    listen       *:81 default_server;
    listen       [::]:81 default_server;
    server_name  $http_host;
    root         /usr/share/nginx/html;
}
```

Enable both:

```bash
systemctl enable --now spire-server-attestor-tpm-signer-unix nginx
```

**Yes, that is plaintext HTTP, and yes, that is fine.** Nothing confidential crosses it: a trust bundle is public information. What matters is integrity, and integrity comes from the TPM signature over the token, checked against a public key the node already holds. TLS here would only raise the question of which CA issued the certificate — which is precisely the regress rule one exists to prevent. Cheerfully serving your root of trust over `http://` is a sign the design is working.

On the node side, the verifier daemon fetches both sides' tokens, checks their signatures, and re-serves the verified bundle over a local Unix socket. Configure `/etc/spire/server-attestor-tpm/verifier.conf`:

```yaml
keydir: keys
socket: /var/run/spire/server-attestor-tpm/verifier.sock
keyset:
  a:
    url: http://spire-server-a.${SPIFFE_TRUST_DOMAIN}:81/spiffetrustbundle.token
    #backup: c.pem
    chain:
    - a.pem
  b:
    url: http://spire-server-b.${SPIFFE_TRUST_DOMAIN}:81/spiffetrustbundle.token
    #backup: c.pem
    chain:
    - b.pem
```

`keydir` is relative, so those keys live in `/etc/spire/server-attestor-tpm/keys/`. Then:

```bash
systemctl enable --now spire-server-attestor-tpm-verifier
```

### The one out-of-band step

Copy `a.pem` and `b.pem` to `/etc/spire/server-attestor-tpm/keys/` on every machine, including both servers.

That's it. That is the whole pre-shared trust in this system: **two public keys.** No join tokens, no pre-copied CA bundle, no enrollment secret, nothing with a rotation policy or an escrow requirement. If they leak, nothing happens — they're public keys. Put them in your provisioning pipeline, your configuration management, your golden image; the delivery channel needs integrity, not secrecy.

### Pre-provisioning a spare

Look again at the config. Each keyset entry also accepts a `backup` key. A side can legitimately trust more than one signing key at once, which turns out to be a very useful property.

If you want, build a third machine now, while everything is healthy. Create its TPM signing key exactly as above, add its public key as a `backup`, `touch` its `tpm:pub_hash` into the allowlist on both servers. Distribute that once, with everything calm.

Now the fleet already trusts a machine that isn't in service yet. When you eventually need it, replacement is a swap: rack it, boot it, done — no key distribution, no allowlist edit, no config push while you're already having a bad day. We'll come back to this in Part 7, because it changes what "replace a server" costs from a procedure to an errand.

If you want to minimize costs and are utilizing detachable TPMs, you can provision the extra TPM and then remove it and lock it away for use in the future as the backup.

### If you don't have TPMs for all nodes

You can substitute `http_challenge` for worker node attestation. It's not as strong an attestation but better than join tokens.

---

## Part 4: The two SPIRE servers

Both servers get the same configuration. Write `/etc/spire/server/default.conf`, replacing the evaluation-grade file the package ships:

```hcl
server {
    bind_address = "${SPIRE_BIND_ADDRESS}"
    bind_port = "${SPIRE_BIND_PORT}"
    trust_domain = "${SPIFFE_TRUST_DOMAIN}"
    log_level = "${SPIRE_LOG_LEVEL}"
    ca_ttl = "24h"
    default_x509_svid_ttl = "1h"
}

plugins {
    DataStore "sql" {
        plugin_data {
            database_type = "sqlite3"
            connection_string = "./datastore.sqlite3"
        }
    }

    KeyManager "disk" {
        plugin_data { keys_path = "./keys.json" }
    }

    BundlePublisher "tpm" {
        plugin_cmd = "/usr/bin/spire-server-attestor-tpm-sign"
        plugin_data {}
    }

    NodeAttestor "tpm" {
        plugin_cmd = "/usr/libexec/spire/plugins/server-nodeattestor-tpmdirect"
        plugin_data {
          ca_path   = "/etc/spire/server/${SYSTEMD_INSTANCE}/tpm-direct/certs"
          hash_path = "/etc/spire/server/${SYSTEMD_INSTANCE}/tpm-direct/hashes"
        }
    }
}
```

Read that for what isn't there. **There is no `UpstreamAuthority` stanza.** Each server is its own self-signed root — that is rule one, in four missing lines. Consequently there is also no CA below SPIRE to protect, and no crown-jewel key to escrow. It's also exactly why the two roots have to be cross-published to each other later; two self-signed roots don't know about each other by magic, and Part 6 is where we fix that.

`DataStore` is SQLite at a relative path, resolved against the `-dataDir` the launcher passes (`/var/lib/spire/server/main`). Local disk, no cluster, no replication link, no network-exposed database wanting certificates from somewhere. `KeyManager "disk"` keeps the signing keys in `keys.json` beside it.

`ca_ttl = "24h"` with a one-hour SVID TTL is aggressive on purpose. The design article's claim that the CAs are transient and disposable only means something if they actually roll, and rolling them daily in normal operation is what makes "rebuild the whole side" an unremarkable event rather than a crisis. It's also, again, why Part 1 was so tiresome about the clock.

### Registration records

Each server runs its own `spire-controller-manager` in standalone mode, reconciling registration entries from YAML files on local disk rather than watching a Kubernetes cluster. The shipped config already does the right thing:

```yaml
trustDomain: "${SPIFFE_TRUST_DOMAIN}"
entryIDPrefix: "scm-${INSTANCE}"
watchClassless: true
spireServerSocketPath: "/var/run/spire/server/sockets/${SYSTEMD_INSTANCE}/private/api.sock"
staticManifestPath: "/etc/spire/server/${SYSTEMD_INSTANCE}/manifests"
expandEnvStaticManifests: true
```

`staticManifestPath` is the standalone-mode switch, and `expandEnvStaticManifests` lets your manifests use `${SPIFFE_TRUST_DOMAIN}` and friends.

**Set the hostname, because it is load-bearing.** The controller-manager's launcher derives a variable called `SUBINSTANCE` by matching `hostname -s` against the literal strings `spire-server-a` and `spire-server-b`. Get this wrong and manifests will silently resolve to the wrong side:

```bash
hostnamectl --static set-hostname spire-server-a.example.org
```

### One set of YAML, two independent servers

Here is the part that surprises people: **the same manifest files go to both servers.** Each controller-manager reconciles them into its own SQLite database. There is no coordination protocol, no dual-registration bookkeeping, no shared state — one set of files in git, two consumers, and recovery of a destroyed side's entries is `git checkout` plus a file copy. Do this for both the static manifests and the TPM hashes folder.

The node entry for server A, parented to the server itself and selected by its TPM:

```yaml
apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterStaticEntry
metadata:
  name: server-a-node
spec:
  parentID: spiffe://${SPIFFE_TRUST_DOMAIN}/spire/server
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/node/spire-server-a.${SPIFFE_TRUST_DOMAIN}
  selectors:
  - tpm:pub_hash:xxx
```

Replace `xxx` with the hash from `get-tpm-pubhash`. Every machine in the fleet needs one of these — servers and workload nodes alike.

The HA agent's own entry, which will become the hinge of the whole design:

```yaml
apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterStaticEntry
metadata:
  name: server-a-spire-ha-agent
spec:
  parentID: spiffe://${SPIFFE_TRUST_DOMAIN}/node/spire-server-a.${SPIFFE_TRUST_DOMAIN}
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/spire-ha-agent
  selectors:
  - systemd:id:spire-ha-agent@main.service
  #federatesWith:
  #- spire-ha
```

Leave `federatesWith` commented out for now. It refers to a trust bundle that doesn't exist yet, and Part 6 explains the ordering.

Two details worth pausing on. The selector is `systemd:id:<unit>.service` — on bare metal your workloads *are* systemd units, and that is what the agent's systemd workload attestor matches. And when a manifest needs to differ per side, use `${SUBINSTANCE}`:

```yaml
  selectors:
  - systemd:id:my-service@${SUBINSTANCE}.service
```

One file, correct on both machines: on server A that resolves to `my-service@a.service`, on server B to `@b`. It's a small trick that preserves the "one set of YAML" property even for entries that are inherently side-specific.

Finally, drop your manifests into `/etc/spire/server/main/manifests/` on both machines and start the pair:

```bash
systemctl enable --now spire-server@main spire-controller-manager@main
```

### Adding a workload node

Every non-server node needs the same two entries, and they go in the same directory on
both servers. For a machine named `foo`:

```yaml
apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterStaticEntry
metadata:
  name: foo-node
spec:
  parentID: spiffe://${SPIFFE_TRUST_DOMAIN}/spire/server
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/node/foo.${SPIFFE_TRUST_DOMAIN}
  selectors:
  - tpm:pub_hash:xxx
---
apiVersion: spire.spiffe.io/v1alpha1
kind: ClusterStaticEntry
metadata:
  name: foo-spire-ha-agent
spec:
  parentID: spiffe://${SPIFFE_TRUST_DOMAIN}/node/foo.${SPIFFE_TRUST_DOMAIN}
  spiffeID: spiffe://${SPIFFE_TRUST_DOMAIN}/spire-ha-agent
  selectors:
  - systemd:id:spire-ha-agent@main.service
  federatesWith:
  - spire-ha
```

Two things look like mistakes and aren't:

- **The `spiffeID` of the HA agent is the same on every node** — `.../spire-ha-agent`, with no hostname in it. Only `parentID` changes. That is deliberate: it is the identity named by `authorized_delegates` in the agent configuration you'll write in Part 5, and one shared value keeps that configuration identical everywhere too.
- **`federatesWith` is uncommented here**, unlike the server entry a few paragraphs up. The difference is timing, not policy. By the time you're adding workload nodes, `spire-trust-sync` has already created the `spire-ha` bundle, so the ordering problem the next section describes has already been solved. New nodes get the finished version.

Workloads on that node then get entries of their own, parented to `.../node/foo.${SPIFFE_TRUST_DOMAIN}` and selected by their unit with `systemd:id:` — the same shape as every entry above.

---

## Part 5: The nodes — two agents and the stitch

Every machine in the fleet, servers included, runs two ordinary SPIRE agents and one `spire-ha-agent`. Write `/etc/spire/agent/default.conf` — one file, both agents:

```hcl
agent {
    log_level = "${SPIRE_LOG_LEVEL}"
    trust_domain = "${SPIFFE_TRUST_DOMAIN}"
    server_address = "spire-server-${INSTANCE}.${SPIFFE_TRUST_DOMAIN}"
    server_port = 8081

    trust_bundle_url = "http://localhost/trustbundle?instance=${INSTANCE}"
    trust_bundle_unix_socket = "/var/run/spire/server-attestor-tpm/verifier.sock"

    rebootstrap_mode = "always"
    rebootstrap_delay = "2m"

    admin_socket_path = "${SPIRE_AGENT_ADMIN_ADDRESS}"
    authorized_delegates = ["spiffe://${SPIFFE_TRUST_DOMAIN}/spire-ha-agent"]
}

plugins {
    KeyManager "disk" {
        plugin_data { directory = "./" }
    }

    NodeAttestor "tpm" {
        plugin_cmd = "/usr/libexec/spire/plugins/agent-nodeattestor-tpmdirect"
        plugin_data {}
    }

    WorkloadAttestor "systemd" {
        plugin_data {}
    }
}
```

This is where the templating pays off. `${INSTANCE}` comes from the unit, so `spire-agent@a` reads `server_address = "spire-server-a.example.org"` and `spire-agent@b` reads `...-b`, from identical text. Four stanzas deserve comment:

- **`trust_bundle_url` plus `trust_bundle_unix_socket`.** Together these replace the file-copy bootstrap that rule two rejects. Despite appearances, no network request is made: the URL is sent *over the local Unix socket* to the verifier from Part 3, and `localhost` is only a Host header. The agent asks a local daemon for a bundle whose TPM signature has already been verified.
- **`rebootstrap_mode = "always"`.** If a server comes back with a brand-new CA, the agent notices its trust is stale and re-bootstraps through that same verified path rather than wedging permanently. This single line is what makes Part 7's demonstration possible.
- **`authorized_delegates`.** This grants `spiffe://example.org/spire-ha-agent` access to the Delegated Identity API on the agent's private admin socket. It must exactly match the `spiffeID` in the HA agent's registration entry from Part 4. This is the trust hinge of the entire design: it is how one process is permitted to ask an agent for other workloads' identities.
- **`WorkloadAttestor "systemd"`.** The reason every selector in this article is `systemd:id:`.

Start all three units:

```bash
systemctl enable --now spire-agent@a spire-agent@b spire-ha-agent@main
```

The result is this arrangement of sockets, which is really the whole article in one picture:

```
                          ┌───────────────────────────┐
                          │   Workload (systemd unit) │
                          └─────────────┬─────────────┘
                                        │
              /var/run/spire/agent/sockets/main/public/api.sock
                                        │   ← the ordinary, boring path
                          ┌─────────────▼─────────────┐
                          │      spire-ha-agent@main  │
                          │   united bundle  A ∪ B    │
                          └──────┬─────────────┬──────┘
                    admin.sock   │             │   admin.sock
                          ┌──────▼──────┐ ┌────▼────────┐
                          │spire-agent@a│ │spire-agent@b│
                          └──────┬──────┘ └────┬────────┘
                                 │ :8081       │ :8081
              ┌──────────────────▼──┐       ┌──▼──────────────────┐
              │   spire-server-a    │       │   spire-server-b    │
              │  own rolling CA     │       │  own rolling CA     │
              │  own SQLite         │       │  own SQLite         │
              │  own TPM            │       │  own TPM            │
              └─────────────────────┘       └─────────────────────┘

              ─── one trust domain: spiffe://example.org ───
```

Look at the socket the workload connects to: `/var/run/spire/agent/sockets/main/public/api.sock`. That is the *conventional* path a single, unremarkable SPIRE agent would serve. Nothing above that socket knows any of this is happening — same API, same libraries, same SVIDs, no HA-aware client code, no retry logic, no awareness that there are two of anything. Redundancy lives entirely below the socket, which is exactly where redundancy belongs.

### Sidebar: broker mode

The `spire-ha-agent` binary has a second mode, selected with `-mode=broker`, which talks to each agent's experimental SPIFFE Broker API instead of the Delegated Identity API. It authenticates with mTLS using an SVID it fetches from each side's Workload API, receives trust bundles inline, and — unlike delegated mode — supports federated trust domains beyond the internal `spire-ha` one, unioned across both sides. It expects the upstream endpoint's identity to be `spiffe://<trust-domain>/spire-ha-agent`.

That is where this is heading, and it's worth knowing the flag exists. This runbook stays on delegated mode, which is the default in the shipped release and the better-trodden path today.

---

## Part 6: Closing the loop with `spire-trust-sync`

Everything so far leaves one gap, and the design article named it as a caveat: in the basic arrangement, the `spire-ha-agent` needs *both* servers reachable when it starts. Steady-state outages are fine — that's the entire point — but a node rebooting during an outage would come up unable to assemble a complete picture of the trust domain. Which is an unfortunate property for the thing you reach for during an outage.

The fix is to make each server aware of the other's trust bundle, so either one alone can hand out a complete answer. That is `spire-trust-sync`, and it is the recommended arrangement.

The mechanism is pleasingly circular. On server A you run `spire-trust-sync@b`, which:

1. Obtains an SVID from **agent b's** Workload API — that is, an identity issued by server *B*.
2. Uses it to read server B's trust bundle.
3. Publishes that bundle into the **local** server, server A, as a federated trust domain literally named `spire-ha`:

```bash
spire-server bundle set -id spiffe://spire-ha -format spiffe
```

It re-runs on every SVID renewal, so when a CA rolls — or a whole side is rebuilt — the new material propagates on its own.

Mind the crossed naming, which is the most common trip hazard here: **on server A you enable `spire-trust-sync@b`, and on server B you enable `spire-trust-sync@a`.** The instance names the side whose bundle you are importing, not the machine you're standing on.

```bash
# on server a
systemctl enable --now spire-trust-sync@b
# on server b
systemctl enable --now spire-trust-sync@a
```

Each side now carries the other's roots under `spire-ha`, and the `spire-ha-agent` folds that into the local trust domain's bundle before handing it to workloads. Workloads see one trust domain with two roots. They never learn the word `spire-ha`.

### The chicken and the egg

Now you can see why `federatesWith` shipped commented out. A registration entry cannot federate with a trust bundle that does not exist yet, and the bundle only exists once trust-sync has run. So the bring-up order matters:

1. Clock, hostname, and `/etc/spiffe/default-trust-domain.env` on every machine.
2. TPM signing keys on both servers; TPM hashes allowlisted on both servers.
3. Distribute `a.pem` and `b.pem` everywhere.
4. Start `spire-server@main` and `spire-controller-manager@main` on both; manifests synced to both.
5. Start `spire-agent@a`, `spire-agent@b`, and `spire-ha-agent@main` on the server machines.
6. Start `spire-trust-sync@<other>` on each server.
7. **Gate — verify before continuing.** On each server:

    ```bash
    spire-server bundle list -socketPath /var/run/spire/server/sockets/main/private/api.sock
    ```

    Non-empty output means the `spire-ha` bundle landed. If it's empty, stop and fix that; nothing downstream will work.

8. Uncomment `federatesWith: [spire-ha]` in the `spire-ha-agent` manifest and resync to both servers.
9. Bring up the workload nodes — syncing each one's node and `spire-ha-agent` entries and touched hash file to both servers first, as in Part 4.

Skip step 8 and the HA agent will tell you, in its own log:

```
spire-ha trust bundle not found. Please reconfigure the spire-ha-agent entry.
```

And if you federate an entry with more trust domains than delegated mode can represent, you'll get its sibling complaint about too many federated bundles. Both mean the same thing: go look at `federatesWith`.

---

## Part 7: Verifying it, then breaking it on purpose

First, confirm the ordinary case. The `spire-ha-agent` reports what it can see of both sides, so the quickest honest check is simply to read its log on any node:

```bash
journalctl -fu spire-ha-agent@main
```

Every five seconds you should see three lines like these:

```
clientA: 1756312800 0 true
clientB: 1756312800 0 true
Clients: true true
```

Read them left to right. `clientA` and `clientB` are the two sides. The first number is a Unix timestamp of the last time *that side's* agent successfully synced with *its* server. The second is a counter of consecutive polls in which that timestamp failed to advance. The third is whether that side is currently working from the HA agent's point of view — whether its socket is answering and the agent behind it is keeping up — and it flips to `false` on the third stalled poll. The `Clients:` line is just the two flags together, and `Clients: true true` is what a healthy trust domain looks like.

### Drill one: stop a side

Leave that `journalctl` running, and on side B:

```bash
systemctl stop spire-server@main
```

Note what you did *not* stop: `spire-agent@b` is still alive on every node. It just has nothing to talk to. So its `GetInfo` keeps answering while its last-sync timestamp freezes, and you watch the counter climb until the flag gives up — about fifteen seconds:

```
clientB: 1756312800 1 true
clientB: 1756312800 2 true
clientB: 1756312800 3 false
Clients: true false
```

That signature — timestamp frozen, counter rising — means "the server behind this side went away." Kill `spire-agent@b` on the node instead and you get a different one, `Failed getinfo: …`, because now the local agent itself is gone. Learning to tell those two apart is most of the value of this log during a real incident.

Meanwhile, nothing else changes. Issuance continues from side A, certificates keep rotating, and workloads are unaffected. Start side B's server again and the timestamp resumes advancing, the counter resets, and you are back to `Clients: true true`.

That is the easy drill. Here's the one that matters.

### Drill two: destroy a side's state, keeping its TPM

Stop side B and delete everything that made it itself — the CA private keys and the entire datastore:

```bash
systemctl stop spire-server@main spire-controller-manager@main
rm -f /var/lib/spire/server/main/keys.json \
      /var/lib/spire/server/main/datastore.sqlite3
systemctl start spire-server@main spire-controller-manager@main
```

Side B now has a brand-new CA with brand-new keys and no memory of any registration entry. In most PKI deployments you have just caused an incident. Here, watch what happens — and more importantly, watch what you *don't have to do*:

- **Nothing needs re-authorizing.** The TPM was not replaced, so the machine's `tpm:pub_hash` allowlist file, its node registration entry, and the pinned `b.pem` that every node uses to verify its bundle are all still exactly correct. No hash to `touch`, no key to distribute, no bundle to copy, no config to push.
- **Entries come back on their own.** The controller-manager reconciles every registration entry from the manifest YAML still sitting in `/etc/spire/server/main/manifests/`. Your policy was on disk and in git the whole time; the database was only ever a cache of it.
- **The new root propagates on its own.** `spire-trust-sync@b` over on side A picks up B's new bundle and republishes it under `spire-ha`. Nodes pull B's newly-signed token from port 81, verify it against the same unchanged public key, and `rebootstrap_mode = "always"` re-attests them within `rebootstrap_delay`.
- **Nodes re-attest with hardware they already had.** Node identities never lived in side B's database, so there is nothing to re-enroll.

Watch it in the same log. Side B's timestamp starts advancing again once its agents re-attest, the counter resets, and the summary returns to `Clients: true true` — without you having distributed a key, approved a bundle, or touched an allowlist in between. That returning `true` is the whole thesis in one word.

Meanwhile, workloads noticed nothing. Not a failed fetch, not a rotation hiccup — side A was serving the entire time, and its roots were always in the united bundle.

Net result: **a root of trust rebuilt from nothing, with zero human trust actions.** Nobody restored a secret from backup, approved a bundle by eye, or made a leap of faith. That is the design article's T+0-through-T+3 walkthrough, reproducible on your own two machines in about the time it takes to read this paragraph.

If the *TPM* is gone too and not just its disk, set the server up again as described above for a new server and redistribute its key. You can use the other side to access all the nodes. And if you took Part 3's advice and pre-provisioned a spare, even that disappears: its hash and its bundle-signing public key were distributed while everything was healthy, so the replacement is a swap. Rack it, boot it, done. It's cheap insurance, and the right afternoon to set it up is a quiet one.

### What to actually alert on

The failure mode of this architecture is not an outage. It is **quietly running on one side for six months** because nobody noticed the other one left. Workload-level success metrics will look perfect the entire time, because they *are* perfect — that's the design working, and it's exactly what makes the degradation invisible.

So alert on side-level health directly: is each `spire-server@main` up, is each `spire-trust-sync@<other>` renewing, does each side's bundle endpoint still serve a fresh token. The HA agent's own log gives you the cheapest version of this for free — alert on `Clients:` reporting anything other than two `true`s, or on a per-side timestamp that stops advancing. Redundancy you aren't measuring is just a story you tell yourself.

---

## Part 8: Honest caveats for this deployment

The design article named the architecture's conceptual edges. These are the deployment's.

- **The package repo is community-built and unsigned as shipped.** `gpgcheck=0` is not a production posture. Mirror, sign, and pin.
- **`plugin_checksum` is empty in every external plugin stanza above.** Set it. It exists precisely so a swapped plugin binary is a startup failure rather than a compromise.
- **The shipped configs run at `DEBUG`.** Fine while you're learning what the logs mean, noisy and needlessly revealing afterwards.
- **`KeyManager "disk"` means the CA private key is on disk, not in the TPM.** Worth saying out loud, since this article is otherwise full of TPMs. It's consistent with the design — the CAs are transient, rolling, and expendable, and Part 7 deleted one on purpose — but if your threat model includes disk theft from a running server, that is the file to think about.
- **There is no `After=` ordering between `spire-ha-agent@main` and the two agents.** Convergence relies on `Restart=always` with a five-second backoff, so a cold boot may log a few failures before settling. Harmless, and startling the first time.
- **Two independent sides means config drift is your responsibility.** Which is also the feature — one-side-at-a-time changes are the safety net. Drive both sides from the same versioned files and drift becomes a diff rather than a mystery.
- **`spire-ha-agent` is young.** Its README says so plainly. It is the newest and least battle-tested component in this stack, and it sits in the request path of every workload on every node.

---

## Part 9: Go stand it up

Everything above is the long way round, on purpose — you can see which parts matter and adapt them to machines you already own.

If you'd rather just have it running, there is a reference implementation that automates all of it as a set of bootable OS images: two `bootc switch` commands, a hardware bill of materials for a pair of Raspberry Pi 5s with TPM modules, and the same registration manifests quoted here. It's the fastest path from reading to a working HA trust domain on your desk, and it's where these packages and units are exercised day to day.

What this article deliberately stops short of is the interesting part: what you *build* on a bottom turtle setup once you have one. With a basic, production-ready HA SPIRE trust domain established, future articles will work through solutions to common identity problems on top of this architecture, keeping you in control.

Stand it up, break a side on purpose, and tell the project what went wrong. `spire-ha-agent` is exactly the kind of foundational component that gets good by being run by people who weren't there when it was written.

---

## References & further reading

1. *The Bottom Turtle That Heals Itself - Design* — the previous article in this series, establishing the architecture this one deploys: https://spiffe.io/blog/2026-07-19-bottom-turtle-ha-architecture/
2. Reference implementation of a bottom turtle SPIRE HA setup, including the hardware bill of materials and the full provisioning runbook: https://github.com/spiffe/bootc/tree/main/demo
3. Registration manifests used by the reference implementation: https://github.com/spiffe/bootc/tree/main/demo/manifests
4. `spire-examples` — the RPM spec files, `systemd` units, and complete default configurations quoted in part above: https://github.com/spiffe/spire-examples/tree/main/examples
5. `spire-ha-agent` — the HA agent, `spire-trust-sync`, its `systemd` units, and both trust diagrams: https://github.com/spiffe/spire-ha-agent
6. `spire-tpm-plugin` — TPM 2.0 credential-activation node attestation: https://github.com/spiffe/spire-tpm-plugin
7. `spire-server-attestor-tpm` — TPM-signed trust bundle publishing and verification, including the full signer and verifier configuration reference: https://github.com/spiffe/spire-server-attestor-tpm
8. `spire-controller-manager` configuration, including standalone mode via `staticManifestPath`: https://github.com/spiffe/spire-controller-manager/blob/main/docs/spire-controller-manager-config.md
9. SPIRE Agent configuration reference — trust bundle bootstrap, server attestation, and rebootstrapping: https://spiffe.io/docs/latest/deploying/spire_agent/
10. SPIRE Server configuration reference — datastore, key manager, and bundle publisher plugins: https://spiffe.io/docs/latest/deploying/spire_server/
11. Building the Kubernetes layer on top of a bottom turtle HA trust domain: https://github.com/spiffe/helm-charts-hardened/tree/main/examples/bottom-turtle-ha
