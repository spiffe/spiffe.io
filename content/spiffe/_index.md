---
title: SPIFFE overview
short: Overview
weight: 1
---

**SPIFFE**, the Secure Production Identity Framework for Everyone, is a set of open-source standards for securely identifying software systems in dynamic and heterogenous environments. Systems that adopt SPIFFE can easily and reliably mutually authenticate wherever they are running.

Distributed design patterns and practices such as micro-services, container orchestrators, and cloud computing have led to production environments that are increasingly dynamic and heterogenous. Conventional security practices (such as network policies that only allow traffic between particular IP addresses) struggle to scale under this complexity. A first-class identity framework for workloads in an organization becomes necessary.

Further, modern developers are expected to understand and play a role in how applications are deployed and managed in production environments. Operations teams require deeper visibility into the applications they are managing. As we move to a more evolved security stance, we must offer better tools to both teams so they can play an active role in building secure, distributed applications.

The SPIFFE standard provides a specification for a framework capable of bootstrapping and issuing identity to services across heterogeneous environments and organizational boundaries.

# Components

The SPIFFE standard comprises three major components:

* The *SPIFFE ID* which standardizes an identity namespace, and
* The [SPIFFE Verifiable Identity Document](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE-ID.md) which dictates the manner in which an issued identity may be presented and verified, and
* The [SPIFFE Workload API](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE_Workload_API.md) which specifies an API through which identity may be retrieved and/or verified by a software system.

## Further Reading {#spec}

SPIFFE is a specification described in the following documents (maintained in the [SPIFFE GitHub repo](https://github.com/spiffe/spiffe)):

{{< specs >}}
