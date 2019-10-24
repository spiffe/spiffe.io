---
title: SPIFFE Overview
short: Overview
description: An overview of the SPIFFE specification
weight: 1
toc: true
---

**SPIFFE**, the Secure Production Identity Framework for Everyone, is a set of open-source standards for securely identifying software systems in dynamic and heterogeneous environments. Systems that adopt SPIFFE can easily and reliably mutually authenticate wherever they are running.

Distributed design patterns and practices such as micro-services, container orchestrators, and cloud computing have led to production environments that are increasingly dynamic and heterogeneous. Conventional security practices (such as network policies that only allow traffic between particular IP addresses) struggle to scale under this complexity. A first-class identity framework for workloads in an organization becomes necessary.

Further, modern developers are expected to understand and play a role in how applications are deployed and managed in production environments. Operations teams require deeper visibility into the applications they are managing. As we move to a more evolved security stance, we must offer better tools to both teams so they can play an active role in building secure, distributed applications.

SPIFFE is a set of open-source specifications for a framework capable of bootstrapping and issuing identity to services across heterogeneous environments and organizational boundaries. The heart of these specifications is the one that defines short lived cryptographic identity documents -- called SVIDs. Workloads can then use these identity documents when authenticating to other workloads, for example by establishing a TLS connection or by signing and verifying a JWT token.

# SPIFFE Components

The SPIFFE standard comprises three major components:

* The [SPIFFE ID](/spiffe/concepts/#spiffe-id), which standardizes an identity namespace and defines how services identify themselves to each other.  
* The [SPIFFE Verifiable Identity Document (SVID)](http://localhost:1313/spiffe/concepts/#spiffe-verifiable-identity-document-svid), which dictates how an issued identity is presented and verified. It encodes SPIFFE IDs in a short lived cryptographically-verifiable document. This specification is composed of two more specific ones -- **X.509-SVID** and **JWT-SVID** -- that describe how SVIDs should be presented in X.509 and JWT token formats respectively.  
* The [Workload API](http://localhost:1313/spiffe/concepts/#spiffe-workload-api), which specifies an API for a workload issuing and/or retrieving another workload’s SVID.  

# Which tools implement SPIFFE?

{{< warning >}}
TODO - Describe tools that implement some or all of the SPIFFE specification. SPIRE, Istio, Consul, CyberArk
{{< /warning >}}

# Which tools work with SPIFFE?

{{< warning >}}
TODO - Describe projects that implement the SPIFFE specification, eg. Ghostunnel
{{< /warning >}}