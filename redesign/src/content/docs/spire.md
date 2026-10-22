---
title: Run workload identity with SPIRE.
description: The open-source reference implementation of SPIFFE.
editUrl: false
template: splash
hero:
  title: Run workload identity with SPIRE.
  tagline: The open-source reference implementation of SPIFFE.
---

<div class="not-content splash-panel">
<p class="page-intro">SPIRE is the open-source reference implementation of SPIFFE. It attests nodes and workloads, issues their SVIDs, and keeps those credentials current.</p>
<div class="actions"><a class="button primary" href="/docs/spire/try/getting-started-linux-macos-x/">Try SPIRE locally →</a><a class="button secondary" href="/downloads/">Download SPIRE →</a></div>
</div>

## A server, an agent, and your workload.

The server manages the issuing authority and registration entries. An agent runs near your workloads and exposes the Workload API. Attestation and registration policy determine which workloads receive which identities.

[Understand the architecture →](/docs/spire/about/concepts/)

## Start small. Keep the same model.

| Your environment | Start here |
| --- | --- |
| Linux or macOS | [Run a local server and agent](/docs/spire/try/getting-started-linux-macos-x/) |
| Kubernetes | [Deploy a server, agents, and a workload](/docs/spire/try/getting-started-k8s/) |
| Docker | [Walk through SPIRE 101](/docs/spire/try/spire101/) |
| Production Kubernetes | [Read the hardened Helm charts guide](/docs/spire/helm/) |

## Operate it yourself.

SPIRE has no single commercial backer. It is developed in the open by contributors across organizations. The project is governed through SPIFFE's community processes. You can download it, inspect the code, and run it without an account or a commercial agreement.

- [Plan a deployment](/docs/spire/planning/).
- [Configure the server and agents](/docs/spire/deploying/).
- [Operate and upgrade SPIRE](/docs/spire/maintenance/).
- [Read the project governance](https://github.com/spiffe/spiffe/blob/main/GOVERNANCE.md).

SPIFFE also has other implementations. [Compare their supported interfaces](/ecosystem/matrix/).
