---
title: SPIFFE Overview
description: An overview of the SPIFFE specification
sidebar:
  label: Overview
  order: 100
---

**SPIFFE**, the Secure Production Identity Framework for Everyone, is a set of open-source standards for securely identifying software systems in dynamic and heterogeneous environments. Systems that adopt SPIFFE can easily and reliably mutually authenticate wherever they are running.

Distributed design patterns and practices such as micro-services, container orchestrators, and cloud computing have led to production environments that are increasingly dynamic and heterogeneous. Conventional security practices (such as network policies that only allow traffic between particular IP addresses) struggle to scale under this complexity. A first-class identity framework for workloads in an organization becomes necessary.

Further, modern developers are expected to understand and play a role in how applications are deployed and managed in production environments. Operations teams require deeper visibility into the applications they are managing. As we move to a more evolved security stance, we must offer better tools to both teams so they can play an active role in building secure, distributed applications.

SPIFFE is a set of open-source specifications for a framework capable of bootstrapping and issuing identity to services across heterogeneous environments and organizational boundaries. The heart of these specifications is the one that defines short lived cryptographic identity documents -- called [SVIDs](/docs/latest/spiffe/concepts/#spiffe-verifiable-identity-document-svid) via a [simple API](/docs/latest/spiffe/concepts/#spiffe-workload-api). Workloads can then use these identity documents when authenticating to other workloads, for example by establishing a TLS connection or by signing and verifying a JWT token.

You can read more about how the SPIFFE APIs are defined and used in the [Concepts](/docs/latest/spiffe/concepts/) guide.


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
| [Palo Alto Networks](https://paloaltonetworks.com/idira/)                                                                    |     ✔      |    ✔     |             ✔              |      ✔       |         |                   |        ✔        |                 |         ✔          |             ✔             |         ✔          |
| [Teleport](https://goteleport.com/platform/machine-and-workload-identity/)                                 |     ✔      |    ✔     |             ✔              |      ✔       |    ✔    |         ✔         |        ✔        |        ✔        |         ✔          |             ✔             |                    |
| [Red Hat](https://www.redhat.com/en/technologies/cloud-computing/openshift/what-is-openshift-service-mesh) |     ✔      |    ✔     |             ✔              |      ✔       |   ✔**   |         ✔         |        ✔        |        ✔        |         ✔          |             ✔             |                    |
| [Cofide](https://www.cofide.io)                                                                            |     ✔      |    ✔     |             ✔              |      ✔       |    ✔    |         ✔         |        ✔        |        ✔        |         ✔          |             ✔             |         ✔          |
| [Aembit](https://aembit.io)                                                                                |     ✔      |    ✔     |             ✔              |              |         |                   |        ✔        |                 |         ✔          |             ✔             |         ✔          |

** Supported via Red Hat's OpenShift Service Mesh 3.0  

### Explanation of Columns - Software that Implements SPIFFE

<dl><dt>X.509 SVID</dt><dd><p>Can generate X.509 SVIDs for workloads</p></dd></dl>


<dl><dt>JWT SVID</dt><dd><p>Can generate JWT SVIDs for workloads</p></dd></dl>


<dl><dt>Attestation-based Issuance</dt><dd><p>Leverages node and/or workload attestation for issuing SVIDs</p></dd></dl>


<dl><dt>Workload API</dt><dd><p>Can serve the Workload API for automatic rotation</p></dd></dl>


<dl><dt>SDS API</dt><dd><p>Can serve Envoy SDS API</p></dd></dl>


<dl><dt>SPIFFE Federation</dt><dd><p>Can serve and consume the SPIFFE Federation API</p></dd></dl>


<dl><dt>OIDC Federation</dt><dd><p>Can serve OIDC Federation API</p></dd></dl>


<dl><dt>PKI Integration</dt><dd><p>Can leverage existing or external PKI for X.509 SVID issuance</p></dd></dl>


<dl><dt>Kubernetes Support</dt><dd><p>Supports workloads running in Kubernetes</p></dd></dl>


<dl><dt>VM and Bare Metal Support</dt><dd><p>Supports workloads running in VMs or on bare metal</p></dd></dl>


<dl><dt>Serverless Support</dt><dd><p>Supports workloads running in serverless environments</p></dd></dl>


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
| [Idira® by Palo Alto Networks](https://www.paloaltonetworks.com/idira/machines/secrets-management)      |     ✔      |    ✔     |           ✔           |              |
| [WarpStream](https://docs.warpstream.com/warpstream/kafka/manage-security/mutual-tls-mtls) |     ✔      |          |                       |              |

### Explanation of Columns - Software that Works with SPIFFE

<dl><dt>X.509 SVID</dt><dd><p>Supports X.509 SVID-based authentication</p></dd></dl>


<dl><dt>JWT SVID</dt><dd><p>Supports JWT SVID-based authentication</p></dd></dl>


<dl><dt>SPIFFE Authentication</dt><dd><p>Supports federated SPIFFE authentication based on trust domain name</p></dd></dl>


<dl><dt>Workload API</dt><dd><p>Supports attaching to the SPIFFE Workload API</p></dd></dl>
