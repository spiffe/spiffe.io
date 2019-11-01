---
title: Registering workloads
description: Registering workloads
weight: 130
toc: true
---

# About registration entries

A registration entry contains the following:

* a SPIFFE ID 
* a set of one or more selectors
* a parent ID 

A registration entry inherits any selectors from the parent ID, and this allows for common selectors across a number of workloads to be shared easily across a number of workloads. See the section [Mapping Workloads to Multiple Nodes](#mapping-workloads-to-multiple-nodes).

The server will send to the agent a list of all registration entries for workloads that are entitled to run on that node. Agents cache these registration entries and keep them updated. 

During workload attestation, the agent discovers selectors and compares them to those in the cached registration entries to determine which SVIDs they should assign to the workload.  

You register a workload either by issuing the **spire-server entry create** command at the command line or calling directly into the Registration API, as described in the [Registration API documentation](https://github.com/spiffe/spire/blob/master/proto/spire/api/registration/registration.proto). 

Although registration entries apply primarily to workload attestation, SPIRE also uses them during node attestation to assign names to logical groups of nodes in order to specify that the workload can run on a group of nodes, as described in the section [Mapping Workloads to Multiple Nodes](#mapping-workloads-to-multiple-nodes).

## Mapping Workloads to Multiple Nodes 

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

## Selectors

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

# How register a workload

TODO

## On Kubernetes

TODO

## On Linux

TODO

# How to list workload registration entries

TODO

# How to remove workload registration entries

TODO