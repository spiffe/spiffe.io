---
title: "The SPIFFE Standard Roadmap"
description: "The SPIFFE specification is evolving. Here is what is currently being worked on and what's ahead."
date: 2026-08-18
author: "Arndt Schwenkschuster"
tags: ["SPIFFE", "Community"]
---

# Intro

This blog post covers what SIG-Spec, the group that defines the SPIFFE standard, is working on right now and what we expect to focus on over the next 12 months.

We encourage members of the community and industry to engage with the SPIFFE maintainers and provide input. This allows us to prioritize and focus on the features the community actually wants to see.

# Roadmap

Our roadmap is to work on the following areas over the course of the next 12 months.

## SPIFFE Filesystem Delivery

Some environments deliver credentials as files, inside and outside the SPIFFE ecosystem. The [SPIFFE Helper](https://github.com/spiffe/spiffe-helper) has been writing SVIDs to disk for years. The Kubernetes ecosystem has added [Pod Certificate Requests](https://github.com/kubernetes/enhancements/tree/master/keps/sig-auth/4317-pod-certificates), which are going into GA at the next release. It allows workloads to receive X.509 certificates signed by a third party. The filesystem becomes the credential provisioning interface between infrastructure and workload and currently each deployment needs to invent its own.

The SPIFFE Filesystem Delivery defines such interface. It standardizes the file names for the bundle, the certificate and the private key, and introduces one environment variable, SPIFFE_CREDENTIAL_FOLDER, pointing at the folder.

The proposal currently targets X509-SVIDs only; JWT support is deferred depending on interest in the community. Check out the PR at https://github.com/spiffe/spiffe/pull/376.

## Transaction Tokens

SPIFFE secures workload to workload communication hop by hop, and call chains keep getting longer. Across a dozen services, an X509-SVID tells the fifth service that the fourth one called it and not which user request started the chain. This includes information such as on whose behalf the caller is acting, or whether the transferred amount or the target account was modified in flight. With non-deterministic workloads like AI agents entering these chains and the industry acknowledging the problem, we want SPIFFE to secure it end-to-end.

[Transaction Tokens](https://datatracker.ietf.org/doc/draft-ietf-oauth-transaction-tokens/11/) are short-lived, signed JWTs carrying exactly that context: what the purpose of the request is, who made it originally, on whose behalf the workload is acting and more. We believe that issuing them at scale comes down to authenticating the requester and distributing signing keys across the trust domain, both things SPIFFE already does well.

Stay tuned for an upcoming PR proposing an *experimental* profile to the SPIFFE Workload API that lets workloads request on-demand transaction tokens.

## A remote Workload API

SPIFFE has grown from offering a bootstrap credential, the bottom turtle, into an identity abstraction layer across diverse infrastructure. You want cross-cloud but have common identifiers? Here's a SPIFFE-ID. You want to authenticate clients no matter where they run? Check their SVID.

For SPIFFE to continue being useful in this way, we need to make investments to ensure that we support diverse environments in the best possible way. One of the shortcomings today is that SPIFFE only works when you control the host running the workload and this restriction excludes deployment patterns that become more and more popular. After all, SPIFFE is the Secure Production Identity Framework **For Everyone**. Examples of such environments we want to enable:

- Kubernetes clusters with managed nodes (EKS Auto Mode, GKE Autopilot, and similar), where there is nowhere to put a node agent and hostPath mounts are not available.
- Environments such as AWS Lambda, GCP Cloud Run or Azure Functions.
- Continuous integration tooling such as GitHub Actions.
- Managed AI-Agent platforms.

We plan on building a remote Workload API, that focuses on broad SPIFFE support on platforms that cannot host an agent but already have a bootstrap credential available and still want the be part of the workload identity substrate that SPIFFE has become.

## SPIFFE in open environments

Workloads, AI agents included, increasingly act across trust boundaries with parties they have never met. A SPIFFE trust domain name today is entirely a deployment choice: self-registered, with no delegating authority, no registry and no technical guarantee of global uniqueness. The SPIFFE Federation spec allows outside collaborators validate your SVIDs, but discovery is manual and a peer has to learn out of band that the bundle for example.org is served at https://my-organization.com/bundle. This includes configuring the URL, the profile type and the trust domain name as three separate parameters that all have to be correct.

We would like to explore taking what the https_web profile started and bringing it into the trust domain identifier itself, for instance by leveraging the .well-known endpoint pattern commonly used in OAuth and OpenID Connect. The industry is moving the same direction, for instance with Client Instance Metadata Documents in OAuth, which is  now in active use in MCP.

## Post-quantum readiness

The JWT-SVID and WIT-SVID specifications limit the alg header to an explicit allowlist. This is enforced across the ecosystem in places like SDKs.

We've started the work of admitting post-quantum algorithms now, so implementations are ready before migrations become necessary.

Check out the recently [opened PR](https://github.com/spiffe/spiffe/pull/419) to see the proposal.

## Windows support

Existing SPIFFE implementations support Windows Server today outside of the SPIFFE specification, using named pipes rather than the unix and tcp schemes that SPIFFE_ENDPOINT_SOCKET accepts. Within the overall goal to support diverse environments we will upstream such support back into the standard to ensure interoperability and availability across the implementations.

# Collaboration

SIG-Spec meets weekly to discuss standard updates and proposals. The meeting is open and the community is welcome to join and contribute. See [SPIFFE community page](https://github.com/spiffe/spiffe#community) for details.