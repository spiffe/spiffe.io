---
title: Extend SPIRE
short: Extending
kind: spire-developing
description: Learn how to extend SPIRE with third-party plugins
weight: 100
---

SPIRE is highly extensible via a plugin framework that allows many core operations to be added and customized.

# Node Attestor plugins

A Node Attestor implements validation logic for nodes (physical or virtual machines) that are attempting to establish their identity. Typically a Node Attestor is implemented as a plugin on the Server and with a corresponding plugin on the Agent. A Node Attestor plugin will often expose selectors that can be used when creating the registration entries that define a workload.

SPIRE comes with a set of built-in Node Attestor plugins for the [Server](https://github.com/spiffe/spire/blob/master/doc/spire_server.md) and [Agent](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md) that support various cloud platforms, schedulers and other machine identity sources. Servers can have multiple Node Attestor plugins enabled simultaneously, however a given Agent may only have one Node Attestor plugin enabled at a time.

In addition, known third-party Node Attestor plugins include:

* https://github.com/bloomberg/spire-tpm-plugin - This plugin allows SPIRE to attest to machines with a TPMv2 compatible Trusted Platform Module installed. The TPM holds the proof of identity of the machine, and SPIRE will require the TPM to provide a specific signed quote to prove it.

* https://github.com/zlabjp/spire-openstack-plugin - This plugin allows SPIRE to attest to nodes deployed by OpenStack and identify them by the OpenStack project ID and instance ID. 

# Node Resolver plugins

Once the identity of an individual node has been determined, in some cases it is valuable to be able to expose additional verified metadata about that workload as selectors for registration entries. For example, the AWS EC2 IID Node Attestor plugin can be used to prove the Instance ID of a given EC2 instance, but the AWS EC2 IID Node Resolver plugin will - by looking up additional instance metadata in AWS - expose additional selectors (such as instance tag or label) based on this verified metadata.

Node Resolver plugins are typically coupled to a specific Node Attestor plugin (such as the AWS EC2 IID Node Attestor), since they will rely on that plugin to verify the initial identity of the node.

SPIRE comes with a set of built-in Node Resolver plugins for the [Server](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).

# Workload Attestor plugins

While Node Attestors help SPIRE verify the identity of a node running a workload, Workload Attestors identify a specific workload running on that node. Workload attestors run on the Agent. A workload attestor may leverage kernel metadata retrieved during a call to the Workload API to determine the identity of a workload, but it may also choose to interrogate other local sources (such as the calling binary, the Docker daemon or the Kubernetes kubelet) to verify the identity of a workload. As with Node Attestor plugins, Workload Attestor plugins expose selectors that allow registration entries to be created for workloads based on the properties of the workload that the attestor verified.

SPIRE comes with a set of built-in Workload Attestor plugins for the [Agent](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md).

# Upstream Authority plugins

UpstreamAuthority plugins allow the SPIRE Server to integrate with existing public key infrastructure, such that the certificates it generates derive from specific intermediate or root certificates supplied to SPIRE. By choosing or developing different UpstreamAuthority plugins it is possible to customize how SPIRE retrieves these certificates (for example from a file, or a particular secrets manager or certificate vault).

SPIRE comes with a set of built-in UpstreamAuthority plugins for the [Server](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).

# KeyManager plugins

In some cases it might be desirable for SPIRE to avoid being exposed to a signing key at all - for example if the signing key is held in a secure hardware enclave. In such a case, the SPIRE Server and Agent can leverage KeyManager plugins to delegate the actual signing operation to another system (such as a TPM).

SPIRE comes with a set of built-in KeyManager plugins for the [Server](https://github.com/spiffe/spire/blob/master/doc/spire_server.md) and [Agent](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md).

# Notifier plugins

Notifier plugins allow actions to be triggered in other systems when certain events occur on the SPIRE Server, and in some cases interrupt the event itself. Notifier plugins can support a number of different use cases, such as when certificate rotation events occur.

SPIRE comes with a set of built-in Notifier plugins for the [Server](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).

# Working with first-party plugins

First party plugins can be enabled by including the appropriate configuration stanza in the `plugins` section of the Server or Agent configuration file. 

*   For instructions on modifying the Server and Agent configuration files, please follow [Configuring the SPIRE Server](/docs/latest/spire/using/configuring/).
*   For more information on enabling the plugins in the Server, read the [Server configuration guide](https://github.com/spiffe/spire/blob/master/doc/spire_server.md).
*   For more information on enabling the plugins in the Agent, read the [Agent configuration guide](https://github.com/spiffe/spire/blob/master/doc/spire_agent.md).

# Working with third party plugins

{{< warning >}}
Third party plugins are not officially supported by the SPIRE project, and may not work with the latest version of SPIRE. Please consult the authors of any third party plugins for details, and exercise caution when using third-party code.
{{< /warning >}}

To use a third party plugin, you must obtain or build a plugin binary that is designed to run on your target architecture. The plugin binary must then be installed on the same machines running the SPIRE Agent or Server and have sufficient permissions to be executed by the same user that the SPIRE Agent or Server is running as.

Once this has been done, configuration of a third party plugin is done through adding a stanza to the Server or Agent configuration file, as for first party plugins described above. However the configuration block should also include a `plugin_cmd` stanza that specifies the path to the plugin binary on disk.

For example:

```
NodeAttestor "tpm" {
	plugin_cmd = "/path/to/plugin_cmd"
	plugin_checksum = "sha256 of the plugin binary"
	plugin_data {
		ca_path = "/opt/spire/.data/certs"
	}
}
```
