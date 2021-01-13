---
title: SPIFFE Overview
short: Overview
description: An overview of the SPIFFE specification
kind: spiffe-about
weight: 100
aliases:
    - /docs/latest
    - /spiffe
    - /docs/latest/spiffe/overview
---

**SPIFFE**, the Secure Production Identity Framework for Everyone, is a set of open-source standards for securely identifying software systems in dynamic and heterogeneous environments. Systems that adopt SPIFFE can easily and reliably mutually authenticate wherever they are running.

Distributed design patterns and practices such as micro-services, container orchestrators, and cloud computing have led to production environments that are increasingly dynamic and heterogeneous. Conventional security practices (such as network policies that only allow traffic between particular IP addresses) struggle to scale under this complexity. A first-class identity framework for workloads in an organization becomes necessary.

Further, modern developers are expected to understand and play a role in how applications are deployed and managed in production environments. Operations teams require deeper visibility into the applications they are managing. As we move to a more evolved security stance, we must offer better tools to both teams so they can play an active role in building secure, distributed applications.

SPIFFE is a set of open-source specifications for a framework capable of bootstrapping and issuing identity to services across heterogeneous environments and organizational boundaries. The heart of these specifications is the one that defines short lived cryptographic identity documents -- called [SVIDs](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid) via a [simple API](/docs/latest/spiffe/concepts/#spiffe-workload-api). Workloads can then use these identity documents when authenticating to other workloads, for example by establishing a TLS connection or by signing and verifying a JWT token.

You can read more about how the SPIFFE APIs are defined and used in the [Concepts](/docs/latest/spiffe/concepts/) guide.

# Which tools implement SPIFFE?

The following tools implement some or all of the SPIFFE specification, and issue SPIFFE IDs:

{{< spiffe/issuers >}}

# Which tools work with SPIFFE?

The following tools include built-in integrations to consume SPIFFE IDs:

{{< spiffe/consumers >}}
