---
title: Community Day 2026
description: Celebrating ten years of SPIFFE. 27 October 2026, City of London & Online.
---

Celebrating ten years of SPIFFE.

**Tuesday 27 October 2026 · Starting 14:00 UTC**

Bloomberg, City of London. Streamed online via Zoom. In-person places are limited.

[Register for Community Day](https://forms.gle/t3sjPdzTAhenWbA2A)

## Agenda

All times are UTC, which is London time on the day. Timings are provisional and the running order may change.

### 13:30 to 14:00: Doors open

In-person attendees are welcome to arrive from 13:30. The stream starts
at 14:00.

### 14:00 to 14:10: Welcome and opening remarks

Noah Stride (Teleport)

### 14:15 to 14:45: Keynote

Joe Beda (Stacklok)

### 14:50 to 15:20: SPIRE Maintainers Update

Sorin Dumitru (Bloomberg)

### 15:25 to 15:55: SPIFFE Maintainers Update

Noah Stride (Teleport), Arndt Schwenkschuster (Defakto)

A look back at what we've done over the last six months, and what we're
planning to tackle in the next twelve. We'll give a high-level overview of
the proposed work items - if any of them would be useful to you, we'd love
you to get involved.

### 15:55 to 16:15: Break

### 16:15 to 16:45: Operating SPIRE at Wise

Taras Burko (Wise), Matthew Kennedy (Wise)

SPIRE has been successfully powering our workload identity and mTLS for
years. In this session we're going to show how we're running it at Wise
scale, discuss service mesh and Kafka integrations, and share operational
stories.

### 16:50 to 17:20: SPIFFE and AIMS - A foundation for Agentic Identity

Pieter Kasselman (Defakto)

AI agents are workloads. They're spun up on demand, act for users and for
other agents, and decide at runtime which tools and data to reach for.
Static API keys and long-lived secrets can't keep up. Agents need
identities and credentials that are verifiable, short-lived and tied to
where they run. This is a problem made for SPIFFE.

The IETF WIMSE working group recently adopted the Agent Identity
Management System (AIMS) model. It points to SPIFFE as a critical part of
an agentic identity system. This talk walks through the AIMS model layer
by layer and shows where SPIFFE slots in and how it enables the other
layers in the system. Attendees will leave with a clear picture of how
existing SPIFFE/SPIRE deployments become the foundation for agent
identity, and where the community can help shape what comes next.

### 17:25 to 17:55: SPIFFE in Flux, or how we reached the KubernetesObjectReference SPIFFE standard

Matheus Pimenta (ControlPlane)

Show our quest in Flux to support SPIFFE complying to our multi-tenancy
model. This resulted in the Broker API that was recently introduced by
SPIFFE. In particular, it's the story behind the KubernetesObjectReference
SPIFFE standard that we contributed to support Flux.

### 18:00 to 18:30: After the SVID: Emerging Authorization Patterns for SPIFFE Workloads and Agents

Kevin Sapp (Aembit)

SPIFFE deliberately stops at authentication. Every team that adopts it
then has to answer "what is this workload allowed to do?" on its own. This
talk maps the emerging approaches: SVIDs as OAuth credentials, token
exchange and Transaction Tokens, WIMSE, AuthZEN, and AAuth. It covers
where each fits, what's mature, and what's still a draft.

### 18:30: Drinks and snacks

