---
title: SPIFFE Concepts
short: Concepts
weight: 200
kind: spiffe-about
aliases:
    - /spiffe/concepts
    - /docs/latest/spiffe/concepts
---

This section looks at some basic concepts in SPIFFE that we refer to frequently throughout this overview.

## Workload

A workload is a single piece of software, deployed with a particular configuration for a single purpose; it may comprise multiple running instances of software, all of which perform the same task. The term “workload” may encompass a range of different definitions of a software system, including:

* A web server running a Python web application, running on a cluster of virtual machines with a load-balancer in front of it.  
* An instance of a MySQL database.  
* A worker program processing items on a queue.  
* A collection of independently deployed systems that work together, such as a web application that uses a database service. The web application and database could also individually be considered workloads.

For SPIFFE’s purposes, a workload may often be more fine-grained than a physical or virtual node -- often as fine grained as individual processes on the node. This is crucial for workloads that, for example, are hosted in a container orchestrator, where several workloads may be coexisting (yet be isolated from each other) on a single node.

For SPIFFE’s purposes, a workload may also span many nodes -- for example, an elastically scaled web server that may be running on many machines simultaneously.

While the granularity of what’s considered a workload will vary depending on context, for SPIFFE’s purposes it is _assumed_ that a workload is sufficiently well isolated from other workloads such that a malicious workload could not steal the credentials of another after they have been issued. The robustness of this isolation and the mechanism by which it is implemented is beyond the scope of SPIFFE.

## SPIFFE ID

A SPIFFE ID is a string that uniquely and specifically identifies a workload. SPIFFE IDs may also be assigned to intermediate systems that a workload runs on (such as a group of virtual machines). For example, **spiffe://acme.com/billing/payments** is a valid SPIFFE ID.

SPIFFE IDs are a [Uniform Resource Identifier (URI)](https://tools.ietf.org/html/rfc3986) which takes the following format: **spiffe://_trust domain_/_workload identifier_**

The _workload identifier_ uniquely identifies a specific workload within a [trust domain](#trust-domain).

The [SPIFFE specification](https://github.com/spiffe/spiffe/blob/main/standards/SPIFFE.md) describes in detail the format and use of SPIFFE IDs.

## Trust Domain

The trust domain corresponds to the trust root of a system. A trust domain could represent an individual, organization, environment or department running their own independent SPIFFE infrastructure. All workloads identified in the same trust domain are issued identity documents that can be verified against the root keys of the trust domain.

It is generally advised to keep workloads that are in either different physical locations (such as different data centers or cloud regions) or environments where different security practices are applied (such as a staging or lab environment compared to a production environment) in distinct trust domains.

## SPIFFE Verifiable Identity Document (SVID)

An SVID is the document with which a workload proves its identity to a resource or caller. An SVID is considered valid if it has been signed by an authority within the SPIFFE ID's trust domain. 

An SVID contains a single SPIFFE ID, which represents the identity of the service presenting it. It encodes the SPIFFE ID in a cryptographically-verifiable document, in one of two currently supported formats: an X.509 certificate or a JWT token. 

As tokens are susceptible to _replay attacks_, in which an attacker that obtains the token in transit can use it to impersonate a workload, it is advised to use X.509-SVIDs whenever possible. However, there may be some situations in which the only option is the JWT token format, for example, when your architecture has an L7 proxy or load balancer between two workloads.

For detailed information on the SVID, see the [SVID specification](https://github.com/spiffe/spiffe/blob/main/standards/X509-SVID.md).

## SPIFFE Workload API

The workload API provides the following:

For identity documents in X.509 format (an X.509-SVID):

* Its identity, described as a SPIFFE ID.  
* A private key tied to that ID that can be used to sign data on behalf of the workload. A corresponding short-lived X.509 certificate is also created, the X509-SVID. This can be used to establish TLS or otherwise authenticate to other workloads.  
* A set of certificates -- known as a [trust bundle](#trust-bundle) -- that a workload can use to verify an X.509-SVID presented by another workload

For identity documents in JWT format (a JWT-SVID): 

* Its identity, described as a SPIFFE ID  
* The JWT token  
* A set of certificates -- known as a [trust bundle](#trust-bundle) -- that a workload can use to verify the identity of other workloads.    

In similar fashion to the [AWS EC2 Instance Metadata API](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html), and the [Google GCE Instance Metadata API](https://cloud.google.com/compute/docs/storing-retrieving-metadata), the Workload API does not require that a calling workload have any knowledge of its own identity, or possess any authentication token when calling the API. This means your application need not co-deploy any authentication secrets with the workload.

Unlike these other APIs however, the Workload API is platform agnostic, and can identify running services at a process level as well as a kernel level -- which makes it suitable for use with container schedulers such as Kubernetes.

In order to minimize exposure from a key being leaked or compromised, all private keys (and corresponding certificates) are short lived, rotated frequently and automatically. Workloads can request new keys and trust bundles from the Workload API before the corresponding key(s) expire.

## Trust Bundle 

When using X.509-SVIDs, a trust bundle is used by a destination workload to verify the identity of a source workload. A trust bundle is a collection of one or more certificate authority (CA) root certificates that the workload should consider trustworthy. Trust bundles contain public key material for both X.509 and JWT SVIDs. 

The public key material used to validate X.509 SVIDs is a set of certificates. The public key material for validating JWTs is a raw public key. Trust bundle contents are frequently rotated. A workload retrieves a trust bundle when it calls the Workload API.

# Further Reading {#spec}

SPIFFE is a specification described in the following documents (maintained in the [SPIFFE GitHub repo](https://github.com/spiffe/spiffe)):

{{< specs >}}
{{< scarf/pixels/medium-interest >}}
