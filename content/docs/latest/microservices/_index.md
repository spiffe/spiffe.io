---
title: Secure Microservices Communication
short: Securing Microservices
kind: microservices
---
SPIRE provides a means to secure communication between microservices in the same environment or across a variety of providers such as AWS, GCP, Azure, bare metal, and so on. These examples demonstrate using SPIRE with the [Envoy](https://www.envoyproxy.io/) service mesh. SPIRE authentication communication can be implemented with X.509 certificates (most secure) or JWT tokens (good for proxy situations).

{{< sectiontoc "microservices" >}}
