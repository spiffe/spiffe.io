---
title: Secure Microservices Communication
sidebar:
  label: Securing Microservices
  order: 100
editUrl: https://github.com/spiffe/spiffe.io/blob/42e7c82fc4a8117e2fc2d6933180279aae18adeb/content/docs/latest/microservices/_index.md
---

SPIRE provides a means to secure communication between microservices in the same environment or across a variety of providers such as AWS, GCP, Azure, bare metal, and so on. These examples demonstrate using SPIRE with the [Envoy](https://www.envoyproxy.io/) service mesh. SPIRE authentication communication can be implemented with X.509 certificates (most secure) or JWT tokens (good for proxy situations).
