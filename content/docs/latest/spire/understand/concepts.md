---
title: SPIRE Concepts
short: Concepts
kind: spire-understand
description: An overview of SPIRE's architecture and fundamentals
weight: 20
---

SPIRE is a production-ready implementation of the [SPIFFE APIs](/docs/latest/spiffe/overview/) that performs node and workload attestation in order to securely issue SVIDs to workloads, and verify the SVIDs of other workloads, based on a predefined set of conditions. 

{{< info >}}
SPIRE is just one implementation of the SPIFFE specification. For a list of current implementations, see the [spiffe.io homepage](/). 
{{< /info >}}

This section describes the architecture and components of SPIRE, walks you through “a day in the life of” how SPIRE issues an identity to a workload, and looks at some basic SPIRE concepts.

# SPIRE Architecture and Components

A SPIRE deployment is composed of a SPIRE Server and one or more SPIRE Agents. A server acts as a signing authority for identities issued to a set of workloads via agents. It also maintains a registry of workload identities and the conditions that must be verified in order for those identities to be issued. Agents expose the SPIFFE Workload API locally to workloads, and must be installed on each node on which a workload is running. 

{{< figure src="/img/server_and_agent.png" width="70" caption="Server and Agent" >}}

## All about the Server

A SPIRE Server is responsible for managing and issuing all identities in its configured SPIFFE trust domain. It stores [registration entries](#workload-registration) (which specify the [selectors](#selectors) that determine the conditions under which a particular SPIFFE ID should be issued) and signing keys, uses [node attestation](#node-attestation) to authenticate agents' identities automatically, and creates SVIDs for workloads when requested by an authenticated agent.

{{< figure src="/img/server.png" width="70" caption="The SPIRE Server" >}}

The behavior of the server determined is through a series of plugins. SPIRE comes with several plugins included, but additional plugins can be built to extend SPIRE for specific use cases. Types of plugins include:

**Node attestor plugins** which, together with agent node attestors, verify the identity of the node the agent is running on. See the section [Node Attestation](#node-attestation) for more information.

**Node resolver plugins** which expand the set of selectors the server can use to identify the node by verifying additional properties about the node. See the section [Node Resolution](#node-resolution) for more information.

**Datastore plugins**, which the server uses to store, query, and update various pieces of information, such as [registration entries](#workload-registration), which nodes have attested, what the selectors for those nodes are. There is one built-in datastore plugin which can use a MySQL, SQLite 3, or PostgresSQL database to store the necessary data. By default it uses SQLite 3.

**Key manager plugins**, which control how the server stores private keys used to sign X.509-SVIDs and JWT-SVIDs. 

**Upstream authority plugins**. By default the SPIRE Server acts as its own certificate authority. However, you can use an upstream authority plugin to use a different CA from a different PKI system.

You customize the server’s behavior by configuring plugins and various other configuration variables. See the [SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md) for details. 

## All about the Agent

A SPIRE Agent runs on every node on which an identified workload runs. The agent:

* requests SVIDs from the server and caches them until a workload requests its SVID  
* exposes the SPIFFE Workload API to workloads on node and attests the identity of workloads that call it  
* provides the identified workloads with their SVIDs

{{< figure src="/img/agent.png" width="70" caption="The SPIRE Agent" >}}

The agent’s main components include:

* Node attestor plugins which, together with server node attestors, verify the identity of the node the agent is running on. See the section [Node Attestation](#node-attestation) for more information.  

* Workload attestor plugins -- which verify the identity of the workload process on the node, by querying information about the process from the node operating system and comparing it against the information you gave the server when you [registered the workload’s properties](#workload-registration) using selectors. See the section [Workload Attestation](#workload-attestation) for more information.  

* Key manager plugins, which the agent uses to generate and use private keys for X.509-SVIDs issued to workloads.

You customize the agent’s behavior by configuring plugins and other configuration variables. See the [SPIRE Agent Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md) for details.

## Custom Server and Agent Plugins

You can create custom server and agent plugins for particular platforms and architectures for which SPIRE doesn’t include plugins. For example, you could create server and agent node attestors for an architecture other than those summarized under [Node Attestation](#node-attestation). Or you could create a custom datastore plugin to support a type of database SPIRE doesn’t currently support. Because SPIRE loads custom plugins at runtime, you need not recompile SPIRE in order to enable them. 

For help creating custom server and agent plugins, see [SPIRE Plugin Development](https://github.com/spiffe/plugin-template/blob/master/SPIRE_PLUGIN_GUIDE.md). 

# A Day in the Life of an SVID

This section walks through a “day in the life” of how SPIRE issues an identity to a workload, from the time the agent starts up on a node to the point of a workload on the same node receiving a valid identity in the form of an X.509 SVID. Note that SVIDs in JWT format are handled differently. For the purposes of simple demonstration, the workload is running on AWS EC2. 

1. The SPIRE Server starts up.  
2. Unless the user has configured an UpstreamAuthority plugin, the server generates a self-signed certificate (a certificate signed with its own private key); the server will use this certificate to sign SVIDs for all the workloads in this server’s trust domain.
3. If it’s the first time starting up, the server automatically generates a trust bundle, whose contents it stores in a datastore you specify in the datastore plugin -- described in the section "Built-in plugins" in the 
[SPIRE Server Configuration Reference](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).
4. The server turns on its registration API, to allow you to register workloads.  
5. The SPIRE Agent starts up on the node that the workload is running on.  
6. The agent performs node attestation, to prove to the server the identity of the node it is running on. For example, when running on an AWS EC2 Instance it would typically perform node attestation by supplying an [AWS Instance Identity Document](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-identity-documents.html) to the server.  
7. The agent presents this proof of identity to the server over a TLS connection authenticated via the bootstrap bundle the agent is configured with. 
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

# SPIRE Concepts

This section looks at some basic concepts in SPIRE that we will refer to throughout the rest of this document.

## Workload Registration

In order for SPIRE to identify a workload, you must register the workload with the SPIRE Server, via registration entries. Workload registration tells SPIRE how to identify the workload and which SPIFFE ID to give it. 

A registration entry maps an identity -- in the form of a SPIFFE ID -- to a set of properties known as selectors that the workload must possess in order to be issued a particular identity. During workload attestation, the agent uses these selector values to verify the workload’s identity. 

Workload registration is covered in detail in the [SPIRE Documentation](/docs/latest/spire/using/registering/)

## Attestation 

Attestation in the context of SPIRE, is asserting the identity of a workload. SPIRE achieves this by gathering attributes of both the workload process itself and the node that the SPIRE Agent runs on from trusted third parties and comparing them to a set of selectors defined when the workload was registered. 

The trusted third parties SPIRE queries in order to perform attestation are platform-specific. 

SPIRE performs attestation in two phases: first node attestation (in which the identity of the node the workload is running on is verified) and then workload attestation (in which the workload on the node is verified). 

SPIRE has a flexible architecture that allows it to use many different trusted third parties for both node and workload attestation, depending on the environment the workload is running in. You tell SPIRE which trusted third parties to use via entries in agent and server configuration files and which types of information to use for attestation via the selector values you specified when you registered the workloads.

### Node Attestation

SPIRE requires that each agent authenticate and verify itself when it first connects to a server; this process is called node attestation. During node attestation, the agent and server together verify the identity of the node the agent is running on. They do this via plugins known as node attestors. All node attestors interrogate a node and its environment for pieces of information that only that node would be in possession of, to prove the node’s identity. 

The result of a successful node attestation is that the agent receives a unique SPIFFE ID. The agent’s SPIFFE ID then serves as the “parent” of the workloads it’s in charge of. 

Examples of proof of the node’s identity include: 

* an identity document delivered to the node via a cloud platform (such as an AWS Instance Identity Document) 
* verifying a private key stored on a Hardware Security Module or Trusted Platform Module attached to the node  
* a manual verification provided through a join token when the agent is installed
* identification credentials provisioned by a multi-node software system when it was installed on the node (such as a Kubernetes Service Account token)  
* other proof of machine identity (such as a deployed server certificate) 

Node attestors return an (optional) set of node selectors to the server that identify a specific machine (such as an Amazon Instance ID). Since the specific identity of a single machine is often not useful when defining the identity of a workload, SPIRE queries a [node resolver](#node-resolution) (if there is one) to see what additional properties of the attested node can be verified (for example, if the node is a member of an AWS Security Group). The set of selectors from both attestor and resolver become the set of selectors associated with the agent node’s SPIFFE ID.  
 
{{< info >}}
Node selectors are not required for node attestation unless you are [mapping workloads to multiple nodes](#mapping-workloads-to-multiple-nodes).
{{< /info >}}

The following diagram illustrates the steps in node attestation. In this illustration, the underlying platform is AWS:

{{< figure src="/img/node_attestation.png" width="50" caption="Node Attestation" >}}

#### Summary of Steps: Node Attestation

1. The agent AWS node attestor plugin queries AWS for proof of the node’s identity and gives that information to the agent.  
2. The agent passes this proof of identity to the server. The server passes this data to its AWS node attestor. 

3. The server AWS node attestor validates proof of identity independently, or by calling out to an AWS API, using the information it obtained in step 2. The node attestor also creates a SPIFFE ID for the agent, and passes this back to the server process, along with any node selectors it discovered.  
4. The server sends back an SVID for the agent node.

#### Node Attestors

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

#### Node Resolvers

The server supports node resolver plugins for the following platforms:

* Amazon Web Services
* Microsoft Azure

### Workload Attestation

Workload attestation asks the question: “Who is this process?” The agent answers that question by interrogating locally available authorities (such as the node’s OS kernel, or a local kubelet running on the same node) in order to determine the properties of the process calling the Workload API.

These properties are then compared against the information provided to the server when you [registered the workload’s properties using selectors](#workload-registration). 

These types of information might include:

* How the process is scheduled by the underlying operating system. On a Unix-based systems, this might be by User ID (uid), Group ID (gid), filesystem path, etcetera.)  
* How the process is scheduled by an orchestration system such as Kubernetes. In this case, the workload might be described by the Kubernetes Service Account or namespace it is running in.

While both agents and servers play a role in node attestation, only agents are involved in workload attestation.

The following diagram illustrates the steps in workload attestation:

{{< figure src="/img/workload_attestation.png" width="60" caption="Workload Attestation" >}}

#### Summary of Steps: Workload Attestation

1. A workload (WL) calls the Workload API to request an SVID. On Unix systems this is exposed as a Unix Domain Socket.
2. The agent interrogates the node’s kernel to identify the process ID of the caller. It then invokes any configured workload attestor plugins, providing them with the process ID of the workload.  
3. Workload attestors use the process ID to discover additional information about the workload, querying neighboring platform-specific components -- such as a Kubernetes kubelet as necessary. Typically these components also reside on the same node as the agent.  
4. The attestors return the discovered information to agent in the form of selectors.  
5. The agent determines the workload's identity by comparing discovered selectors to registration entries, and returns the correct cached SVID to the workload. 

#### Workload Attestors

SPIRE includes workload attestor plugins for Unix, Kubernetes, and Docker. For details on specific attestors supported by default, see the section [Attestation](#attestation). 

