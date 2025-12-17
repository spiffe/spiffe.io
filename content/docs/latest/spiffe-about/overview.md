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

<!-- The following static tables replace the old method of importing implementer and tool data using {{< spiffe/issuers >}} and {{< spiffe/consumers >}} -->

# Which Tools Implement SPIFFE?

SPIFFE comprises many specifications, each providing different parts of the SPIFFE functionality. Software that implements SPIFFE may support some or all of these functionalities. The following tables captures software that’s capable of providing your infrastructure with SPIFFE identities, along with the functionalities they support.

## Open Source Software That Implements SPIFFE

| Software     | X.509 SVID | JWT SVID | Attestation-based Issuance | Workload API | SDS API | SPIFFE Federation | OIDC Federation | PKI Integration | Kubernetes Support | VM and Bare Metal Support | Serverless Support |
|:-------------|:----------:|:--------:|:--------------------------:|:------------:|:-------:|:-----------------:|:---------------:|:---------------:|:------------------:|:-------------------------:|:------------------:|
| SPIRE        | ✔          | ✔        | ✔                          | ✔            | ✔       | ✔                 | ✔               | ✔               | ✔                  | ✔                         | ✔                  |
| Cert-manager | ✔          |          | ✔                          |              |         |                   |                 | ✔               | ✔                  |                           |                    |
| Consul       | ✔          |          |                            |              |         |                   |                 | ✔               | ✔                  | ✔                         | Beta               |
| Dapr         | ✔          | ✔        |                            |              |         |                   |                 | ✔               | ✔                  | ✔                         |                    |
| Istio        | ✔          |          | ✔                          |              | ✔       |                   |                 | ✔               | ✔                  | ✔                         |                    |

## Commercial Software That Implements SPIFFE

| Software                                                                                                   | X.509 SVID | JWT SVID | Attestation-based Issuance | Workload API | SDS API | SPIFFE Federation | OIDC Federation | PKI Integration | Kubernetes Support | VM and Bare Metal Support | Serverless Support |
|:-----------------------------------------------------------------------------------------------------------|:----------:|:--------:|:--------------------------:|:------------:|:-------:|:-----------------:|:---------------:|:---------------:|:------------------:|:-------------------------:|:------------------:|
| [GCP](https://cloud.google.com/)                                                                           |     ✔      |          |             ✔              |              |         |                   |                 |        ✔        |         ✔          |             ✔             |                    |
| [Greymatter.io](https://greymatter.io)                                                                     |     ✔      |    ✔     |             ✔              |      ✔       |    ✔    |                   |                 |        ✔        |         ✔          |             ✔             |         ✔          |
| [Defakto](https://www.defakto.security)                                                                    |     ✔      |    ✔     |             ✔              |      ✔       |    ✔    |         ✔         |        ✔        |        ✔        |         ✔          |             ✔             |         ✔          |
| [Teleport](https://goteleport.com/platform/machine-and-workload-identity/)                                 |     ✔      |    ✔     |             ✔              |      ✔       |    ✔    |         ✔         |        ✔        |        ✔        |         ✔          |             ✔             |                    |
| [Venafi](https://www.cyberark.com/products/workload-identity-manager/)                                     |     ✔      |          |             ✔              |              |         |                   |                 |                 |         ✔          |             ✔             |                    |
| [Red Hat](https://www.redhat.com/en/technologies/cloud-computing/openshift/what-is-openshift-service-mesh) |     ✔      |    ✔     |             ✔              |      ✔       |   ✔**   |         ✔         |        ✔        |        ✔        |         ✔          |             ✔             |                    |

** Supported via Red Hat's OpenShift Service Mesh 3.0  

### Explanation of Columns - Software that Implements SPIFFE

X.509 SVID
: Can generate X.509 SVIDs for workloads

JWT SVID
: Can generate JWT SVIDs for workloads

Attestation-based Issuance
: Leverages node and/or workload attestation for issuing SVIDs

Workload API
: Can serve the Workload API for automatic rotation

SDS API
: Can serve Envoy SDS API

SPIFFE Federation
: Can serve and consume the SPIFFE Federation API

OIDC Federation
: Can serve OIDC Federation API

PKI Integration
: Can leverage existing or external PKI for X.509 SVID issuance

Kubernetes Support
: Supports workloads running in Kubernetes

VM and Bare Metal Support
: Supports workloads running in VMs or on bare metal

Serverless Support
: Supports workloads running in serverless environments

## Which Tools Work with SPIFFE?

SPIFFE enjoys a broad ecosystem, with many software projects, products, and platforms providing SPIFFE support in one way or another. While SPIFFE works with any software that knows how to use a JWT or an X.509 certificate, the following list captures software that supports SPIFFE as a first class citizen, along with the level of support they provide.

### Open Source Software that Works with SPIFFE

| Software               | X.509 SVID | JWT SVID | SPIFFE Authentication | Workload API |
|:-----------------------|:----------:|:--------:|:---------------------:|:------------:|
| Envoy                  |     ✔      |    ✔     |           ✔           |              |
| Ghostunnel             |     ✔      |          |           ✔           |      ✔       |
| Istio                  |     ✔      |    ✔     |           ✔           |              |
| Knox                   |     ✔      |          |           ✔           |              |
| VMware Secrets Manager |     ✔      |          |           ✔           |      ✔       |
| SPIKE                  |     ✔      |          |           ✔           |      ✔       |

### Commercial Software that Works with SPIFFE

| Software                                                                                               | X.509 SVID | JWT SVID | SPIFFE Authentication | Workload API |
|:-------------------------------------------------------------------------------------------------------|:----------:|:--------:|:---------------------:|:------------:|
| [AWS IAM Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) |     ✔      |          |                       |              |
| [GCP Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)     |     ✔      |    ✔     |                       |              |
| [Greymatter.io](https://greymatter.gitbook.io/grey-matter-documentation/usage/fabric/security/spire)   |     ✔      |    ✔     |           ✔           |      ✔       |
| [WarpStream](https://docs.warpstream.com/warpstream/kafka/manage-security/mutual-tls-mtls) |     ✔      |          |                       |              |

### Explanation of Columns - Software that Works with SPIFFE

X.509 SVID
: Supports X.509 SVID-based authentication

JWT SVID
: Supports JWT SVID-based authentication

SPIFFE Authentication
: Supports federated SPIFFE authentication based on trust domain name

Workload API
: Supports attaching to the SPIFFE Workload API
