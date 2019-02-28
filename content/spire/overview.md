---
title: SPIFFE/SPIRE Overview
short: SPIFFE/SPIRE Overview
description: An overview of SPIFFE and SPIRE architecture and fundamentals
weight: 2
toc: true
---

## What Are SPIFFE and SPIRE?

SPIFFE, together with its implementation SPIRE, constitute a set of specifications and a software runtime to establish trust by securely identifying software services -- referred to as “workloads” in this context -- across a wide variety of hosting platforms. 

SPIFFE is a set of open-source specifications for a framework capable of bootstrapping and issuing identity to services across heterogeneous environments and organizational boundaries. The heart of these specifications is the one that defines short lived cryptographic identity documents -- called SVIDs. Workloads can then use these identity documents when authenticating to other workloads, for example by establishing an TLS connection or by signing and verifying a JWT token.

SPIRE is a production-ready implementation of the SPIFFE APIs that performs node and workload attestation in order to securely issue SVIDs to workloads, and verify the SVIDs of other workloads, based on a predefined set of conditions. 

{{< info >}}
SPIRE is just one implementation of the SPIFFE specification. For a list of current implementations, see the [spiffe.io homepage](https://spiffe.io). 
{{< /info >}}

## SPIFFE
This section describes the main components of SPIFFE and looks at some basic SPIFFE concepts.

### SPIFFE Components

The SPIFFE standard comprises three major components:

* The [SPIFFE ID](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE-ID.md), which standardizes an identity namespace and defines how services identify themselves to each other.  
* The [SPIFFE Verifiable Identity Document (SVID)](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE-ID.md#3-spiffe-verifiable-identity-document), which dictates how an issued identity is presented and verified. It encodes SPIFFE IDs in a short lived cryptographically-verifiable document. This specification is composed of two more specific ones -- [X.509-SVID](https://github.com/spiffe/spiffe/blob/master/standards/X509-SVID.md) and [JWT-SVID](https://github.com/spiffe/spiffe/blob/master/standards/JWT-SVID.md) -- that describe how SVIDs should be presented in X.509 and JWT token formats respectively.  
* The [Workload API](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE_Workload_API.md), which specifies an API for a workload issuing and/or retrieving another workload’s SVID.  

### SPIFFE Concepts

This section looks at some basic concepts in SPIFFE that we refer to frequently throughout this overview.

#### Workload

A workload is a single piece of software, deployed with a particular configuration for a single purpose; it may comprise multiple running instances of software, all of which perform the same task. The term “workload” may encompass a range of different definitions of a software system, including:

* A web server running a Python web application, running on a cluster of virtual machines with a load-balancer in front of it.  
* An instance of a MySQL database.  
* A worker program processing items on a queue.  
* A collection of independently deployed systems that work together, such as a web application that uses a database service. The web application and database could also individually be considered workloads.

For SPIFFE’s purposes, a workload may often be more fine-grained than a physical or virtual node -- often as fine grained as individual processes on the node. This is crucial for workloads that, for example, are hosted in a container orchestrator, where several workloads may be coexist in (yet be isolated from each other) on a single node.

For SPIFFE’s purposes, a workload may also span many nodes -- for example, an elastically scaled web server that may be running on many machines simultaneously.

While the granularity of what’s considered a workload will vary depending on context, for SPIFFE’s purposes it is _assumed_ that a workload is sufficiently well isolated from other workloads such that a malicious workload could not steal the credentials of another after they have been issued. The robustness of this isolation and the mechanism by which it is implemented is beyond the scope of SPIFFE.

#### SPIFFE ID

A SPIFFE ID is a string that uniquely and specifically identifies a workload. SPIFFE IDs may also be assigned to intermediate systems that a workload runs on (such as a group of virtual machines). For example, **spiffe://acme.com/billing/payments** is a valid SPIFFE ID.

SPIFFE IDs are a [Uniform Resource Identifier (URI)](https://tools.ietf.org/html/rfc3986) which takes the following format: **spiffe://_trust domain_/_workload identifier_**

The _workload identifier_ uniquely identifies a specific workload within a [trust domain](#trust-domain).

The [SPIFFE specification](https://github.com/spiffe/spiffe/blob/master/standards/SPIFFE.md) describes in detail the format and use of SPIFFE IDs.

#### Trust Domain

The trust domain corresponds to the trust root of a system. A trust domain could represent an individual, organization, environment or department running their own independent SPIFFE infrastructure. All workloads identified in the same trust domain are issued identity documents that can be verified against the root keys of the trust domain.

It is generally advised keep workloads that are in either different physical locations (such as different data centers or cloud regions) or environments where different security practices are applied (such as a staging or lab environment compared to a production environment) in distinct trust domains.

#### SVID

An SVID is the document with which a workload proves its identity to a resource or caller. An SVID is considered valid if it has been signed by an authority within the SPIFFE ID's trust domain. 

An SVID contains a single SPIFFE ID, which represents the identity of the service presenting it. It encodes the SPIFFE ID in a cryptographically-verifiable document, in one of two currently supported formats: an X.509 certificate or a JWT token. 

As tokens are susceptible to _replay attacks_, in which an attacker that obtains the token in transit can use it to impersonate a workload, it is advised to use X.509-SVIDs whenever possible. However, there may be some situations in which the only option is the JWT token format, for example, when your architecture has an L7 proxy or load balancer between two workloads.

For detailed information on the SVID, see the [SVID specification](https://github.com/spiffe/spiffe/blob/master/standards/X509-SVID.md).

#### Workload API

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

#### Trust Bundle 

When using X.509-SVIDs, a trust bundle is used by a destination workload to verify the identity of a source workload. A trust bundle is a collection of one or more certificate authority (CA) root certificates that the workload should consider trustworthy. Trust bundles contain public key material for both X.509 and JWT SVIDs. 

The public key material used to validate X.509 SVIDs is a set of certificates. The public key material for validating JWTs is a raw public key. Trust bundle contents are frequently rotated. A workload retrieves a trust bundle when it calls the Workload API.

## SPIRE

This section describes the architecture and components of SPIRE, walks you through “a day in the life of” a SPIRE deployment, and looks at some basic SPIRE concepts.

### SPIRE Architecture and Components

A SPIRE deployment is composed of a SPIRE Server and one or more SPIRE Agents. A server acts as a signing authority for identities issued to a set of workloads via agents. It also maintains a registry of workload identities and the conditions that must be verified in order for those identities to be issued. Agents expose the SPIFFE Workload API locally to workloads, and must be installed on each node on which a workload is running. 

![Server and Agent](/img/server_and_agent.png)

#### All about the Server

A SPIRE Server is responsible for managing and issuing all identities in its configured SPIFFE trust domain. It stores [registration entries](#workload-registration) (which specify the [selectors](#selectors) that determine the conditions under which a particular SPIFFE ID should be issued) and signing keys, uses [node attestation](#node-attestation) to authenticate agents' identities automatically, and creates SVIDs for workloads when requested by an authenticated agent.
<br>
<br>
![Server](/img/server.png)

The behavior of the server determined is through a series of plugins. SPIRE comes with several plugins included, but additional plugins can be built to extend SPIRE for specific use cases. Types of plugins include:

Node attestor plugins which, together with agent node attestors, verify the identity of the node the agent is running on. See the section [Node Attestation](#node-attestation) for more information.

Node resolver plugins which expand the set of selectors the server can use to identify the node by verifying additional properties about the node. See the section [Node Resolution](#node-resolution) for more information.

Datastore plugins, which the server uses to store, query, and update various pieces of information, such as [registration entries](#workload-registration), which nodes have attested, what the selectors for those nodes are. There is one built in datastore plugin which can use a SQLite 3 or PostgresSQL database to store the necessary data. By default it uses SQLite 3.

Key manager plugins, which control how the server stores private keys used to sign X.509-SVIDs and JWT-SVIDs. 

Upstream certificate authority (CA) plugins. By default the SPIRE Server acts as its own certificate authority. However, you can use an upstream CA plugin to use a different CA from a different PKI system.  

{{< info >}}
CAs apply to SVIDs in X.509 format only. SPIRE creates JWT-SVIDs without a certificate authority. 
{{< /info >}}

You customize the server’s behavior by configuring plugins and various other configuration variables. See the [SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md) for details. 

#### All about the Agent

A SPIRE Agent runs on every node on which an identified workload runs. The agent:

* requests SVIDs from the server and caches them until a workload requests its SVID  
* exposes the SPIFFE Workload API to workloads on node and attests the identity of workloads that call it  
* provides the identified workloads with their SVIDs  
<br>
<br>
![Agent](/img/agent.png)

The agent’s main components include:

* Node attestor plugins which, together with server node attestors, verify the identity of the node the agent is running on. See the section [Node Attestation](#node-attestation) for more information.  

* Workload attestor plugins -- which verify the identity of the workload process on the node, by querying information about the process from the node operating system and comparing it against the information you gave the server when you [registered the workload’s properties](#workload-registration) using selectors. See the section [Workload Attestation](#workload-attestation) for more information.  

* Key manager plugins, which the agent uses to generate and use private keys for X.509-SVIDs issued to workloads.

You customize the agent’s behavior by configuring plugins and other configuration variables. See the [SPIRE Agent Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md) for details.

#### Create Custom Server and Agent Plugins

You can create custom server and agent plugins for particular platforms and architectures for which SPIRE doesn’t include plugins. For example, you could create server and agent node attestors for an architecture other than those summarized under [Node Attestation](#node-attestation). Or you could create a custom datastore plugin to support a type of database SPIRE doesn’t currently support. Because SPIRE loads custom plugins at runtime, you need not recompile SPIRE in order to enable them. 

For help creating custom server and agent plugins, see the [SPIRE Plugin Development guide](https://github.com/spiffe/plugin-template/blob/master/SPIRE_PLUGIN_GUIDE.md). 

### A Day in the Life of a SPIRE Deployment

This section walks through a “day in the life” of a SPIRE deployment, from when agent starts up on a node all the way to the point of a workload on the same node receiving a valid identity in the form of an X.509 SVID. Note that SVIDs in JWT format are handled differently. For the purposes of simple demonstration, the workload is running on AWS EC2. 

1. The SPIRE Server starts up.  
2. The server generates a self-signed certificate (a certificate signed with its own private key); the server will use this certificate to sign SVIDs for all the workloads in this server’s trust domain.    
3. If it’s the first time starting up, the server automatically generates a trust bundle, whose contents it stores in datastore you specify in the datastore plugin -- described in the section "Built-in plugins" in the 
[SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).
4. The server turns on its registration API, to allow you to register workloads.  
5. The SPIRE Agent starts up on the node that the workload is running on.  
6. The agent performs node attestation, to prove to the server the identity of the node it is running on. For example, when running on an AWS EC2 Instance it would typically perform node attestation by supplying an [AWS Instance Identity Document](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-identity-documents.html) to the server.  
7. The agent presents this proof of identity to the server over an TLS connection authenticated via the bootstrap bundle the agent is configured with. 
{{< warning >}}
This bootstrap bundle is a default configuration, and should be replaced with customer-supplied credentials in production.     
{{< /warning >}}
8. The server calls the AWS API to validate the proof.    
9. AWS acknowledges the document is valid.    
10. The server performs node resolution, to verify additional properties about the agent node and update its registration entries accordingly. For example, if the node was attested using an AWS Instance Identity Document, then the server would use a supplied set of AWS credentials to query the AWS control plane to retrieve additional metadata about the instance ID that the AWS Instance Identity Document verified.  
11. The server issues an SVID to the agent, representing the identity of the agent itself.  
12. The agent contacts the server (using its SVID as its TLS client certificate) to obtain the registration entries it is authorized for and to ask the server to sign workload SVIDs.  
13. Now fully bootstrapped, the agent turns on the Workload API.  
14. A workload calls the Workload API to request an SVID.   
15. The agent initiates the workload attestation process by calling its workload attestors, providing them with the process ID of the workload process.  
16. Attestors use the process ID to discover additional information about the workload
17. The attestors return the discovered information to agent in the form of selectors
18. The agent determines the workload's identity by comparing discovered selectors to registration entries, and returns the correct SVID to the workload when the workload asks for it.  

### SPIRE Concepts

This section looks at some basic concepts in SPIRE that we will refer to throughout the rest of this document.

#### Workload Registration

In order for SPIRE to identify a workload, you must register the workload with the SPIRE Server, via registration entries. Workload registration tells SPIRE how to identify the workload and which SPIFFE ID to give it. 

A registration entry maps an identity -- in the form of a SPIFFE ID -- to a set of properties known as selectors that the workload must possess in order to be issued a particular identity. During workload attestation, the agent uses these selector values to verify the workload’s identity. 

A registration entry contains the following:

* a SPIFFE ID 
* a set of one or more selectors
* a parent ID 

A registration entry inherits any selectors from the parent ID, and this allows for common selectors across a number of workloads to be shared easily across a number of workloads. See the section [Mapping Workloads to Multiple Nodes](#mapping-workloads-to-multiple-nodes).

The server will send to the agent a list of all registration entries for workloads that are entitled to run on that node. Agents cache these registration entries and keep them updated. 

During workload attestation, the agent discovers selectors and compares them to those in the cached registration entries to determine which SVIDs they should assign to the workload.  

You register a workload either by issuing the **spire-server entry create** command at the command line or calling directly into the Registration API, as described in the [Registration API documentation](https://github.com/spiffe/spire/blob/master/proto/api/registration/registration.proto). 

Although registration entries apply primarily to workload attestation, SPIRE also uses them during node attestation to assign names to logical groups of nodes in order to specify that the workload can run on a group of nodes, as described in the section [Mapping Workloads to Multiple Nodes](#mapping-workloads-to-multiple-nodes).

##### Mapping Workloads to Multiple Nodes 

In many cases a workload may not be bound to a specific node; it may be able to run on any node in a cluster of machines. SPIRE can support this by assigning the logical group of agents a single SPIFFE ID and then mapping the group’s SPIFFE ID to the parent ID in the workload’s registration entry. 

Consider a scenario in which you are running workload as a container a Kubernetes cluster with 10 nodes. Kubernetes can pick any of the 10 nodes to schedule the container. 

If SPIRE required using a single agent’s ID as the Parent ID for the workload, then you would have to create 10 distinct registration entries, one for each node. Moreover, when you bring up a new Kubernetes node, nothing can run on that node until the you added a new registration entry for the workload specific to that node.

To solve this, you tell SPIRE that this workload can run on any of the nodes in this Kubernetes cluster, by doing the following:  

1. Create a registration entry to group the nodes in that cluster; this logical group entry includes: 

    * a SPIFFE ID, such as **spiffe://example.org/_my-cluster_**
    * one or more node selectors that identify nodes belonging to the group  

2. Create a second registration entry to set the workload’s Parent ID to the logical grouping’s SPIFFE ID: **spiffe://example.org/_my-cluster_** 

If you're using the Kubernetes node attestor, it will expose a SPIFFE ID for the cluster automatically that can be used as a Parent ID for workloads running on the cluster. 

{{< warning >}}
A single registration entry may contain either node selectors or workload selectors but not both.
{{< /warning >}}

The node selectors you choose determine which nodes SPIRE includes in the logical group. For example, the node selector(s) might be require the node be in a specific AWS autoscaling group, or Azure virtual network.

#### Selectors

A selector is a native property of a node or workload that SPIRE can verify before issuing an identity. Different selectors are available depending on the platform or architecture on which the workload’s application is running. 

Some platforms have only node selectors, some only workload selectors, and some a mixture of both, as summarized in the following two tables:

**Table 1: Supported workload attestation selectors, by platform**

| For a list of supported selectors for this platform | Go here |
| ---------------- | ----------- |
| **Unix**       | The [configuration reference page for the Unix Workload Attestor](https://github.com/spiffe/spire/blob/master/doc/plugin_agent_workloadattestor_unix.md)
| **Kubernetes** | The [configuration reference page for the Kubernetes Workload Attestor](https://github.com/spiffe/spire/blob/master/doc/plugin_agent_workloadattestor_k8s.md)
| **Docker** | The [configuration reference page for the Docker Workload Attestor](https://github.com/spiffe/spire/blob/master/doc/plugin_agent_workloadattestor_docker.md)
<br>

**Table 2: Supported node attestation/resolution selectors, by platform**

| For a list of supported selectors for this platform | Go here |
| ---------------- | ----------- |
| **Kubernetes**       | The [configuration reference page for the Kubernetes Node Attestor](https://github.com/spiffe/spire/blob/master/doc/plugin_server_nodeattestor_k8s_sat.md)
| **AWS**       | The [configuration reference page for the AWS Node Resolver](https://github.com/spiffe/spire/blob/master/doc/plugin_server_noderesolver_aws_iid.md)
| **Azure**       | The [configuration reference page for the Azure Managed Service Identity Node Resolver](https://github.com/spiffe/spire/blob/master/doc/plugin_server_noderesolver_azure_msi.md)


{{< info >}}
It is not necessary to specify node selectors unless you are mapping workloads to multiple nodes. 
{{< /info >}}

Consider an example in which you want to identify nodes based on AWS selectors and identify workloads based on Unix selectors. To accomplish this, you would create one registration entry for AWS node attestation and another entry for Unix workload attestation.

#### Attestation 

Attestation is the process of certifying that something is true. In the context of SPIRE, it is asserting the identity of a workload. SPIRE achieves this by gathering attributes of both the workload process itself and the node that the SPIRE Agent runs on from trusted third parties and comparing them to a set of selectors defined when the workload was registered. 

The trusted third parties SPIRE queries in order to perform attestation are platform-specific. 

SPIRE performs attestation in two phases: first node attestation (in which the identity of the node the workload is running on is verified) and then workload attestation (in which the workload on the node is verified). 

SPIRE has a flexible architecture that allows it to use many different trusted third parties for both node and workload attestation, depending on the environment the workload is running in. You tell SPIRE which trusted third parties to use via entries in agent and server configuration files and which types of information to use for attestation via the selector values you specified when you registered the workloads.

#### Node Attestation

SPIRE requires that each agent authenticate and verify itself when it first connects to a server; this process is called node attestation. During node attestation, the agent and server together verify the identity of the node the agent is running on. They do this via plugins known as node attestors. All node attestors interrogate a node and its environment for pieces of information that only that node would be in possession of, to prove the node’s identity. 

The result of a successful node attestation is that the agent receives a unique SPIFFE ID. The agent’s SPIFFE ID then serves as the “parent” of the workloads it’s in charge of. 

Examples of proof of the node’s identity include: 

* an identity document delivered to the node via a cloud platform (such as an AWS Instance Identity Document) 
* verifying a private key stored on a Hardware Security Module or Trusted Platform Module attached to the node  
* a manual verification provided through a join token when the agent is installed
identification credentials provisioned by a multi-node software system when it was installed on the node (such as a Kubernetes Service Account token)  
* other proof of machine identity (such as a deployed server certificate) 

Node attestors return an (optional) set of node selectors to the server that identify a specific machine (such as an Amazon Instance ID). Since the specific identity of a single machine is often not useful when defining the identity of a workload, SPIRE queries a [node resolver](#node-resolution) (if there is one) to see what additional properties of the attested node can be verified (for example, if the node is a member of an AWS Security Group). The set of selectors from both attestor and resolver become the set of selectors associated with the agent node’s SPIFFE ID.  
 
{{< info >}}
Node selectors are not required for node attestation unless you are [mapping workloads to multiple nodes](#mapping-workloads-to-multiple-nodes).
{{< /info >}}

The following diagram illustrates the steps in node attestation. In this illustration, the underlying platform is AWS:
<br>
<br>
![Node Attestation](/img/node_attestation.png)

###### Summary of Steps: Node Attestation

1. The agent AWS node attestor plugin queries AWS for proof of the node’s identity and gives that information to the agent.  
2. The agent passes this proof of identity to the server. The server passes this data to its AWS node attestor. 

3. The server AWS node attestor validates proof of identity independently, or by calling out to an AWS API, using the information it obtained in step 2. The node attestor also creates a SPIFFE ID for the agent, and passes this back to the server process, along with any node selectors it discovered.  
4. The server sends back an SVID for the agent node.

##### Node Attestors

Agents and servers interrogate the underlying platform through their respective node attestors. SPIRE supports node attestors for attesting node identity on a variety of environments, including:

* EC2 instances on AWS (using the EC2 Instance Identity Document)
* VMs on Microsoft Azure (using Azure Managed Service Identities)
* Google Compute Engine Instances on Google Cloud Platform (using GCE Instance Identity Tokens)
* Nodes that are a member of a Kubernetes cluster (using Kubernetes Service Account tokens)

For cases where there is no platform that can directly identify a node, SPIRE includes node attestors for attesting:

with server-generated join tokens

A join token is a pre-shared key between a SPIRE Server and Agent. The server can generate join tokens once installed that can be used to verify an agent when it starts. To help protect against misuse, join tokens expire immediately after use.

using an existing X.509 certificate

For information on configuring node attestors, see the [SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md) and [SPIRE Agent Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md).

#### Node Resolution

Once the individual node’s identity has been verified, “node resolver” plugins expands the set of selectors that can be used to identify the node by verifying additional properties about the node (for example, if the node is a member of a particular AWS security group, or has a particular tag associated with it). Only the server participates in node resolving. SPIRE runs node resolvers just once, directly after attestation.

##### Node Resolvers

The server supports node resolver plugins for the following platforms:

* Amazon Web Services
* Microsoft Azure

#### Workload Attestation

Workload attestation asks the question: “Who is this process?” The agent answers that question by interrogating locally available authorities (such as the node’s OS kernel, or a local kubelet running on the same node) in order to determine the properties of the process calling the Workload API.

These properties are then compared against the information provided to the server when you [registered the workload’s properties using selectors](#workload-registration). 

These types of information might include:

* How the process is scheduled by the underlying operating system. On a Unix-based systems, this might be by User ID (uid), Group ID (gid), filesystem path, etcetera.)  
* How the process is scheduled by an orchestration system such as Kubernetes. In this case, the workload might be described by the Kubernetes Service Account or namespace it is running in.

While both agents and servers play a role in node attestation, only agents are involved in workload attestation.

The following diagram illustrates the steps in workload attestation:

![Workload Attestation](/img/workload_attestation.png)

##### Summary of Steps: Workload Attestation

1. A workload (WL) calls the Workload API to request an SVID. On Unix systems this is exposed as a Unix Domain Socket.


The agent interrogates the node’s kernel to identify the process ID of the caller. It then invokes any configured workload attestor plugins, providing them with the process ID of the workload.  
2. Workload attestors use the process ID to discover additional information about the workload, querying neighboring platform-specific components -- such as a Kubernetes kubelet as necessary. Typically these components also reside on the same node as the agent.  
3. The attestors return the discovered information to agent in the form of selectors.  
4. The agent determines the workload's identity by comparing discovered selectors to registration entries, and returns the correct cached SVID to the workload. 

##### Workload Attestors

SPIRE includes workload attestor plugins for Unix, Kubernetes, and Docker. For details on specific attestors supported by default, see the section [Attestation](#attestation). 

