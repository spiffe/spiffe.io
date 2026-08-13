---
title: "The SPIFFE Standard Roadmap"
description: "The SPIFFE specification is evolving. Here is what is currently worked on and what's ahead."
date: 2026-08-10
author: "Arndt Schwenkschuster"
tags: ["SPIFFE", "Community"]
draft: true
---

## Intro

This blog post gives an overview of what is actively being discussed in the SPIFFE standard and an outlook on what is ahead.

We encourage members of the community and industry to engage with the SPIFFE maintainers and provide input. This allows us to prioritize and focus on the features the community actually wants to see.

## In active discussion

### SPIFFE Filesystem Delivery

The SPIFFE Filesystem Delivery specification standardizes a file and folder layout that workloads can rely on to collect their SVIDs and trust bundles. It stands in contrast to the SPIFFE Workload API, which serves credentials over a gRPC endpoint on a Unix Domain Socket.

This work comes from the Kubernetes ecosystem, where Pod Certificate Requests are maturing. They allow Kubernetes workloads to receive X.509 certificates signed by a third party, with a private key that never leaves the node.

Today, every deployment that provisions credentials as files invents its own layout, and every workload needs the bundle, the certificate and the private key. Filesystem Delivery replaces that with a single *credential folder*, standardizes the file names and introduces a single environment variable, `SPIFFE_CREDENTIAL_FOLDER`, pointing at it.

The use case is beyond Kubernetes, for example at the SPIFFE Helper. The proposal currently targets X509 SVIDs only. JWT support is deferred depending on interest in the community.

Check out the PR at https://github.com/spiffe/spiffe/pull/376.

## Upcoming

These topics are a list of items that the SPIFFE maintainers see as a priority for future work. Nothing here has been written down yet, so now is the best moment to argue about it.

### Transaction Tokens

Transaction Tokens are a token format being standardized in the OAuth working group at the IETF. They answer questions that SPIFFE does not: what is the purpose of the request, who made it originally, on whose-behalf is the workload acting and more. In a call chain across a dozen services, an X509-SVID tells the fifth service that the fourth one called it and nothing about whether what user request started the chain, or whether the transferred amount or target account was modified in flight (example).

A Transaction Token is a short-lived, signed JWT (`typ: txntoken+jwt`) carrying that missing context: the subject, a transaction identifier, a narrow purpose, and the request and transaction contexts (`rctx`, `tctx`).

We believe they are a good fit for SPIFFE:

* The SPIFFE Trust Domain concepts aligns well with the one in transaction tokens. As a matter of fact, transaction tokens looked at SPIFFE for it.
* Workloads requesting transaction tokens need to authenticated. SPIFFE does that out-of-the-box.
* The keys signing transaction tokens have to be published, rotated and revoked across the whole trust domain.

We think that deploying transaction tokens at scale comes down to issuance at the edge and key distribution — both areas where SPIFFE already excels. Stay tuned for an upcoming PR proposing an *experimental* profile to the SPIFFE Workload API that lets workloads request on-demand transaction tokens.

### A remote Workload API

The SPIFFE Workload Endpoint is local by design: a Unix Domain Socket, or TCP restricted to networks with strong network-level assertions. That restriction is not random — SPIFFE is the bootstrap mechanism, and a workload calling it has no credential yet to authenticate with.

This only works when you control the host running the workload making it an active adoption blocker for:

* Kubernetes clusters with managed nodes (EKS Auto Mode, GKE Autopilot, and similar), where there is nowhere to put a node agent and hostPath mounts are not available.
* Environments such as AWS Lambda, GCP Cloud Run or Azure Functions.
* Continuous integration tooling such as GitHub Actions.
* Managed AI-Agent platforms.

All of these platforms already have their own bootstrap mechanism, so what is needed there is not bootstrapping but interoperability — for instance through the SPIFFE ID and SVIDs. We plan to specify how to receive SVIDs based on existing platform attestations, such as artefacts issued by cloud Instance Metadata Endpoints.

### SPIFFE in open environments

A SPIFFE trust domain name is, as specified today, entirely a deployment choice. Names are self-registered; there is no delegating authority, no registry and no technical guarantee of global uniqueness. To let outside collaborators validate your SVIDs you publish your bundle via SPIFFE Federation, using either the `https_web` profile (authenticated by Web PKI) or `https_spiffe`.

The trade-off is discovery. A peer must learn out of band that the bundle for trust domain `example.org` is in fact served at `https://my-organization.com/bundle`, and must be configured with the URL, the profile type and the trust domain name as three separate parameters that all have to be correct. This manual out-of-band trust establishment prevents SPIFFE from being used in open environments where prior establishment is undesirable or impossible.

We would like to explore what it would take using what the `https_web` profile started and bring it into the trust domain identifier. This would allow to derive all necessary data to validate an SVID for `spiffe://prod.my-organization/service-a` without any additional configuration. For instance, by leverage `.well-known` endpoints which are commonly used in OAuth and OpenID Connect.

### Post-quantum readiness

The JWT-SVID and WIT-SVID specifications constrain the `alg` header to an explicit allowlist with items from the RSA, ECDSA and RSASSA-PSS families. None of those are post-quantum safe.

As the entire ecosystem is enforcing this allowlist we want to start the progress of supporting post-quantum algorithms in the ecosystem.

### Windows support

The `SPIFFE_ENDPOINT_SOCKET` URI accepts only the `unix` and `tcp` schemes. Implementations such as SPIRE have supported Windows for years, using named pipes. We want to pull that support back into the standard and make it interoparable across SPIFFE implementations.

## Collaboration

SIG-Spec meets weekly to discuss standard updates and proposals. The meeting is open and the community is welcome to join and contribute. See [SPIFFE community page](https://github.com/spiffe/spiffe#community) for details.