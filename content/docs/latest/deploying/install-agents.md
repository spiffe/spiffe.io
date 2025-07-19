---
title: Install SPIRE Agents
short: Install Agent
kind: deploying
description: How to install the SPIRE Agents on Linux and Kubernetes
weight: 70
aliases:
    - /spire/docs/install-agents
    - /docs/latest/spire/installing/install-agents
---

## Step 1: Obtain the SPIRE Binaries {#step-1}

Pre-built SPIRE releases can be found on the [SPIRE downloads page](/downloads/#spire-releases). The tarballs contain both server and agent binaries.

If you wish, you may also [build SPIRE from source](https://github.com/spiffe/spire/blob/{{< spire-latest "tag" >}}/CONTRIBUTING.md).

## Step 2: Install the Server and Agent {#step-2}

This introductory guide describes how to install the server and agent on the same node. On a typical production deployment you will have the server installed on one node and one or more agents installed on distinct nodes. 

To install the server and agent:

1. Obtain the latest tarball from the [SPIRE downloads page](/downloads/#spire-releases) and then extract it into the **/opt/spire** directory using the following commands:

    ```console
    wget https://github.com/spiffe/spire/releases/download/{{< spire-latest "tag" >}}/{{< spire-latest "tarball" >}}
    tar zvxf {{< spire-latest "tarball" >}}
    sudo cp -r spire-{{< spire-latest "version" >}}/. /opt/spire/
    ```

2. Add `spire-server` and `spire-agent` to your $PATH for convenience:

    ```console
    sudo ln -s /opt/spire/bin/spire-server /usr/bin/spire-server
    sudo ln -s /opt/spire/bin/spire-agent /usr/bin/spire-agent
    ```

## Step 3: Configure the Agent {#step-3}

Once the SPIRE Agent has been installed, you need to configure it for your environment. See [Configuring SPIRE](/docs/latest/spire/using/configuring/) for details about how to configure SPIRE, in particular Node Attestation and Workload Attestation.

Note that the SPIRE Agent must be restarted once its configuration has been modified for changes to take effect.

If you haven't already, see [Install SPIRE Server](/docs/latest/spire/installing/install-server/) to learn how to install the SPIRE Server.

# Installing SPIRE Agents on Kubernetes

{{< warning >}}
You must run all commands from the directory containing the **.yaml** files used for configuration. See [Obtain the Required Files](/docs/latest/spire/installing/install-server/#section-1) section of the SPIRE Server installation guide for details.
{{< /warning >}}

To install SPIRE Agents on Kubernetes, you:

1. Create the agent service account
2. Create the agent configmap
3. Create the agent daemonset

See the following sections for details.

## Step 1: Create Agent Service Account

Apply the **agent-account.yaml** configuration file to create a service account named **spire-agent** in the **spire** namespace:

```console
$ kubectl apply -f agent-account.yaml
```

To allow the agent read access to the kubelet API to perform workload attestation, a ClusterRole must be created that confers the appropriate entitlements to Kubernetes RBAC, and that ClusterRoleBinding must be associated with the service account created in the previous step.

1. Create a ClusterRole named **spire-agent-cluster-role** and a corresponding ClusterRoleBinding by applying the **agent-cluster-role.yaml** configuration file:

    ```console
    $ kubectl apply -f agent-cluster-role.yaml
    ```

2. To confirm successful creation, verify that the ClusterRole appears in the output of the following command:

    ```console
    $ kubectl get clusterroles --namespace spire | grep spire
    ```

## Step 2: Create Agent Configmap

Apply the **agent-configmap.yaml** configuration file to create the agent configmap. This is mounted as the `agent.conf` file that determines the SPIRE Agent's configuration. 

```console
$ kubectl apply -f agent-configmap.yaml
```

The **agent-configmap.yaml** file specifies a number of important directories, notably **/run/spire/sockets** and **/run/spire/config**. These directories are bound in when the agent container is deployed.

Follow the [Configuring SPIRE](/docs/latest/spire/using/configuring/) section for full details on how to configure the SPIRE Agent, in particular Node Attestation and Workload Attestation.

Note that the a SPIRE Agent must be restarted once its configuration has been modified for changes to take effect.

## Step 3: Create Agent Daemonset

Agents are deployed as a daemonset and one runs on each Kubernetes worker instance.

Deploy the SPIRE agent by applying the **agent-daemonset.yaml** configuration.

```console
$ kubectl apply -f agent-daemonset.yaml
```

This creates a daemonset called **spire-agent** in the **spire** namespace and starts up a **spire-agent** pod along side **spire-server**, as demonstrated in the output of the following two commands:

```console
$ kubectl get daemonset --namespace spire

NAME          DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
spire-agent   1         1         1       1            1           <none>          6m45s

$ kubectl get pods --namespace spire

NAME                           READY   STATUS    RESTARTS   AGE
spire-agent-88cpl              1/1     Running   0          6m45s
spire-server-0                 1/1     Running   0          103m
```

When the agent deploys, it binds the volumes summarized in the following table:

| Volume            | Description                                                                                                                                                                    | Mount Location         |
|:------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------|
| **spire-config**  | The spire-agent configmap created in the  [Create Agent Configmap](#step-2-create-agent-configmap) step.                                                                       | **/run/spire/config**  |
| **spire-sockets** | The hostPath, which will be shared with all other pods running on the same worker host. It contains a UNIX domain socket that workloads use to communicate with the agent API. | **/run/spire/sockets** |

# Where next?

If you haven't already, see [Install SPIRE Server](/docs/latest/spire/installing/install-server/) to learn how to install the SPIRE Server.

Once you've installed SPIRE Server and Agents, consider reviewing the guide on [Configuring the SPIRE Server and Agents](/docs/latest/spire/using/configuring/).

{{< scarf/pixels/high-interest >}}
