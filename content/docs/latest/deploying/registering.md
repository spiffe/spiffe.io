---
title: Registering workloads
short: Registering workloads
kind: deploying
description: Registering workloads with SPIFFE IDs in the SPIRE Server
weight: 90
aliases:
    - /spire/docs/registering
    - /docs/latest/spire/using/registering
---

# How to create a registration entry {#create-registration-entry}

A registration entry contains the following:

* a SPIFFE ID 
* a set of one or more selectors
* a parent ID 

The server will send to the agent a list of all registration entries for workloads that are entitled to run on that node. Agents cache these registration entries and keep them updated. 

During workload attestation, the agent discovers selectors and compares them to those in the cached registration entries to determine which SVIDs they should assign to the workload.  

You register a workload either by issuing the `spire-server entry create` command at the command line or calling directly into the Entry API, as described in the [Entry API documentation](https://github.com/spiffe/spire-api-sdk/blob/{{< spire-latest "tag" >}}/proto/spire/api/server/entry/v1/entry.proto). Existing entries can be modified using the `spire-server entry update` command.

{{< info >}}
When running on Kubernetes, a common way to invoke commands on the SPIRE Server is through the `kubectl exec` command on a pod running the SPIRE Server. For example:
```
kubectl exec -n spire spire-server-0 -- \
    /opt/spire/bin/spire-server entry create \
    -spiffeID spiffe://example.org/ns/default/sa/default \
    -parentID spiffe://example.org/ns/spire/sa/spire-agent \
    -selector k8s:ns:default \
```
{{< /info >}}

To learn more about the `spire-server entry create` and `spire-server entry update` commands and options, consult the [SPIRE Server reference guide](/docs/latest/deploying/spire_server/).

# How to register a workload

Registering a workload is accomplished by creating one or more registration entries in the SPIRE Server. To register a workload, it is necessary to tell SPIRE both:

1.  a SPIFFE ID assigned to the agent(s) that are running on the node(s) that the workload is entitled to run on, and
1.  the attributes of the workload itself running on those machines

## 1. Defining the SPIFFE ID of the Agent

The SPIFFE ID assigned to the Agent may be an ID assigned automatically as part of the node attestation process. For example, when a Agent is attested the AWS IID node attestor, it is automatically assigned a SPIFFE ID of the form `spiffe://example.org/agent/aws_iid/ACCOUNT_ID/REGION/INSTANCE_ID`.

Alternatively, a SPIFFE ID may be assigned to one or more Agents by creating a [registration entry](#create-registration-entry) that specifies via selectors specific attributes of a node. For example SPIFFE ID `spiffe://acme.com/web-cluster` can be assigned to any SPIRE Agent running on a set of EC2 instances with the tag `app` set to a value of `webserver` by creating a registration entry like the following:

```
spire-server entry create \ 
    -node \
    -spiffeID spiffe://acme.com/web-cluster \
    -selector tag:app:webserver
```

A selector is a native property of a node or workload that SPIRE can verify before issuing an identity.  A single registration entry may contain either node selectors or workload selectors but not both. Note the `-node` flag in the command above, which denotes this command is specifying node selectors.

Different selectors are available depending on the platform or architecture on which the workload’s application is running.

| For a list of supported selectors for this platform | Go here                                                                                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kubernetes**                                      | The [configuration reference page for the Kubernetes Node Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_k8s_sat.md)                       |
| **AWS**                                             | The [configuration reference page for the AWS Node Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_nodeattestor_aws_iid.md)                              |
| **Azure**                                           | The [configuration reference page for the Azure Managed Service Identity Node Resolver](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_server_noderesolver_azure_msi.md) |

## 2. Defining the SPIFFE ID of the Workload

Once the Agent or Agents has a SPIFFE ID assigned, another registration entry can be created to identify specific workloads when they call the Workload API exposed by that agent.

For example, to create a registration entry that will match a linux process running under Unix group ID 1000 running on an agent identified as `spiffe://acme.com/web-cluster` (described above) would be achieved with the following command:

```
spire-server entry create \
    -parentID spiffe://acme.com/web-cluster \
    -spiffeID spiffe://acme.com/webapp  \
    -selector unix:gid:1000
```

| For a list of supported selectors for this platform | Go here                                                                                                                                                                           |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Unix**                                            | The [configuration reference page for the Unix Workload Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_workloadattestor_unix.md)      |
| **Kubernetes**                                      | The [configuration reference page for the Kubernetes Workload Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_workloadattestor_k8s.md) |
| **Docker**                                          | The [configuration reference page for the Docker Workload Attestor](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/doc/plugin_agent_workloadattestor_docker.md)  |

# How to list registration entries

To list all existing registration entries, use the command `spire-server entry show`.

To filter registration entries to those that match a specific SPIFFE ID, parent SPIFFE ID, or registration entry ID, use the `-spiffeID`, `-parentID`, `-selector` or `-entryID` flags respectively.

{{< info >}}
Note that each registration entry has a single, unique Registration Entry ID, but multiple registration entries may specify the same SPIFFE ID.
{{< /info >}}

For example, to list all registration entries that match a set of EC2 instances with the tag `app` set to a value of `webserver`, run the following:

```
spire-server entry show -selector tag:app:webserver
```

To learn more about the `spire-server entry show` command and options, consult the [SPIRE Server reference guide](/docs/latest/deploying/spire_server/).

# How to remove registration entries

To permanently delete existing registration entries, use the command `spire-server entry delete`, specifying the relevant registration entry with the `-entryID` command. 

For example:

```
spire-server entry delete -entryID 92f4518e-61c9-420d-b984-074afa7c7002
```

To learn more about the `spire-server entry delete` command and options, consult the [SPIRE Server reference guide](/docs/latest/deploying/spire_server/).

# Mapping Workloads to Multiple Nodes

A workload registration entry can have a single parent ID. This could be the SPIFFE ID of a specific node (i.e. the SPIFFE ID of an agent as given through node attestation) or it could also be the SPIFFE ID of a node registration entry (sometimes referred to as a node alias/set). A node alias (or set) is a group of nodes that share similar characteristics that are given a shared identity. The node registration entry has the node selectors that are required in order for a node to qualify for the shared identity. Meaning that any node that has at least the selectors defined by a node registration entry is given that alias (or belongs to that node set). When a workload registration entry uses the SPIFFE ID of a node alias as the parent, any node with that alias is authorized to obtain SVIDs for that workload


For example:

```
spire-server entry create -node -spiffeID spiffe://devvm.local/mynodealias -selector tpm:pub_hash:xxxxx
```

# Where next?

Once you've learned how to create, update and delete registration entries, consider reviewing the guide on [How to use SVIDs](/docs/latest/spire/developing/svids/).

{{< scarf/pixels/high-interest >}}
