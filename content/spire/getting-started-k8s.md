---
title: Getting Started Guide for Kubernetes
short: Getting Started on Kubernetes
description: Install and run a SPIRE Server and Agent locally on a Kubernetes cluster
weight: 3
toc: true
aliases: [tutorial-spire-on-kubernetes, tutorial-spire-on-kubernetes/]
---

# About this Guide

This guide walks you through getting a SPIRE Server and SPIRE Agent running in a Kubernetes cluster, and configuring a workload container to access SPIRE.


## Before You Begin

Before you begin, read through this section for information about the environment and deployment it sets up. Also, if you’re not familiar with basic SPIFFE and SPIRE concepts, be sure to review the [SPIFFE/SPIRE Overview](https://spiffe.io/spire/overview/).

## Tested Kubernetes Versions

This steps in this guide have been tested on these Kubernetes versions: 1.13.1, 1.12.4, and 1.10.12.

{{< warning >}}
If you are using minikube to run this tutorial, when starting your test cluster you should pass some additional configuration flags.
```
minikube start \
    --extra-config=apiserver.service-account-signing-key-file=/var/lib/minikube/certs/sa.key \
    --extra-config=apiserver.service-account-key-file=/var/lib/minikube/certs/sa.pub \
    --extra-config=apiserver.service-account-issuer=api \
    --extra-config=apiserver.service-account-api-audiences=api,spire-server \
    --extra-config=apiserver.authorization-mode=RBAC \
    --extra-config=kubelet.authentication-token-webhook=true
```
{{< /warning >}}

## Deployment and Configuration Details

* The server statefulset runs on a Kubernetes worker node, using a PersistentVolumeClaim for storage
* The agent daemonset runs on each Kubernetes worker node
* All SPIRE components are created in a Kubernetes namespace called **spire**.
* The server runs in a service account named **spire-server**
* The agent runs in a service account named **spire-agent**
* The agent uses a **hostPath** bind mount for sharing the agent API's UNIX domain socket with application containers.
* This guide does all configuring via Kubernetes configmaps. The container image for SPIRE contains only binaries.

# Steps

This section walks you step-by-step through getting a server and agent(s) running in your Kubernetes cluster and configuring a workload container to access SPIRE.

{{< warning >}}
You must run all commands from the directory containing the **.yaml** files used for configuration. See [Obtain the Required Files](#section-1) for details.
{{< /warning >}}

## Section 1: Obtain the Required Files {#section-1}

This deployment this guide walks you through setting up requires a number of **.yaml** files *and* you must run all commands in the directory in which those files
reside.

To obtain this directory of files clone **https://github.com/spiffe/spire-tutorials** and obtain
the **.yaml** files from the **spire-tutorials/k8s** subdirectory.

## Section 2: Configure Kubernetes Namespace for SPIRE Components {#section-2}

Follow these steps to configure the **spire** namespace in which SPIRE Server and SPIRE Agent are deployed.

1. Create the namespace:

    ```bash
    $ kubectl apply -f spire-namespace.yaml
    ```

2. Run the following command and verify that *spire* is listed in the output:

    ```bash
    $ kubectl get namespaces
    ```

## Section 3: Configure SPIRE Server {#section-3}

To configure the SPIRE server, you:

1. Create server service account
2. Create server configmap
3. Create server statefulset

### Create Server Service Account

1. Configure a service account named **spire-server**, by applying the **server-account.yaml** configuration file:

    ```bash
    $ kubectl apply -f server-account.yaml
    ```

2. To confirm successful creation, verify that “spire-server” appears in the output of the following command:

    ```bash
    $ kubectl get serviceaccount --namespace spire
    ```

### Create Server Bundle Configmap, Role & ClusterRoleBinding

For the server to function, it is necessary for it to provide agents with certificates that they can use to verify the identity of the server when establishing a connection.

In a deployment such as this, where the agent and server share the same cluster, SPIRE can be configured to automatically generate these certificates on a periodic basis and update a configmap with contents of the certificate. To do that, the server needs the ability to get and patch a configmap object in the `spire` namespace.

1. Create the Configmap a named **spire-bundle** by applying the **spire-bundle-configmap.yaml** configuration file:

    ```bash
    $ kubectl apply -f spire-bundle-configmap.yaml
    ```

2. To confirm successful creation, verify the configmap **spire-bundle** is listed in the output of the following command:

    ```bash
    $ kubectl get configmaps --namespace spire | grep spire
    ```

To allow the server to read and write to this configmap, a ClusterRole must be created that confers the appropriate entitlements to Kubernetes RBAC, and that ClusterRoleBinding must be associated with the service account created in the previous step.

1. Create a ClusterRole named **spire-server-trust-role** and a corresponding ClusterRoleBinding by applying the **server-cluster-role.yaml** configuration file:

    ```bash
    $ kubectl apply -f server-cluster-role.yaml
    ```

2. To confirm successful creation, verify that the ClusterRole appears in the output of the following command:

    ```bash
    $ kubectl get clusterroles --namespace spire | grep spire
    ```

### Create Server Configmap

The server is configured in the Kubernetes configmap specified in server-configmap.yaml, which specifies a number of important directories, notably **/run/spire/data** and **/run/spire/config**. These volumes are bound in when the server container is deployed.

To create the server configmap, issue the following command:

```bash
$ kubectl apply -f server-configmap.yaml
```

### Create Server StatefulSet

Deploy the server by applying the configuration **server-statefulset.yaml** file:

```bash
$ kubectl apply -f server-statefulset.yaml
```

This creates a statefulset called **spire-server** in the **spire** namespace and starts up a **spire-server** pod, as demonstrated in the output of the following two commands:

```bash
$ kubectl get statefulset --namespace spire

NAME           READY   AGE
spire-server   1/1     86m


$ kubectl get pods --namespace spire

NAME                           READY   STATUS    RESTARTS   AGE
spire-server-0                 1/1     Running   0          86m
```

When you deploy the server it automatically configures a livenessProbe on the SPIRE server's GRPC port, which ensures availability of the container.

When the server deploys, it binds in the volumes summarized in the following table:

| Volume | Description | Mount Location |
| :------ |:---------- | :------------- |
| **spire-config** | A reference to the **spire-server** configmap created in the previous step | **/run/spire/config** |
| **spire-data** | The hostPath for the server's SQLite database and keys file | **/run/spire/data** |

### Create Server Service

1. Create the server service by applying the **server-service.yaml** configuration file:

    ```bash
    $ kubectl apply -f server-service.yaml
    ```

2. Verify that the **spire** namespace now has a **spire-server** service in the **spire** namespace:

    ```bash
    $ kubectl get services --namespace spire

    NAME           TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
    spire-server   NodePort   10.107.205.29   <none>        8081:30337/TCP   88m
    ```

## Section 4: Configure SPIRE Agent {#section-4}

To configure the agent, you:

1. Create the agent service account
2. Create the agent configmap
3. Create the agent daemonset

### Create Agent Service Account

Apply the **agent-account.yaml** configuration file to create a service account named **spire-agent** in the **spire** namespace:

```bash
$ kubectl apply -f agent-account.yaml
```

To allow the agent read access to the kubelet API to perform workload attestation, a ClusterRole must be created that confers the appropriate entitlements to Kubernetes RBAC, and that ClusterRoleBinding must be associated with the service account created in the previous step.

1. Create a ClusterRole named **spire-agent-cluster-role** and a corresponding ClusterRoleBinding by applying the **agent-cluster-role.yaml** configuration file:

    ```bash
    $ kubectl apply -f agent-cluster-role.yaml
    ```

2. To confirm successful creation, verify that the ClusterRole appears in the output of the following command:

    ```bash
    $ kubectl get clusterroles --namespace spire | grep spire
    ```

### Create Agent Configmap

Apply the **agent-configmap.yaml** configuration file to create the agent configmap.

```bash
$ kubectl apply -f agent-configmap.yaml
```

The **agent-configmap.yaml** file specifies a number of important directories, notably **/run/spire/sockets** and **/run/spire/config**. These directories are bound in when the agent container is deployed.

### Create Agent Daemonset

Agents are deployed as a daemonset and one runs on each Kubernetes worker instance.

Deploy the SPIRE agent by applying the **agent-daemonset.yaml** configuration.

```bash
$ kubectl apply -f agent-daemonset.yaml
```

This creates a daemonset called **spire-agent** in the **spire** namespace and starts up a **spire-agent** pod along side **spire-server**, as demonstrated in the output of the following two commands:

```bash
$ kubectl get daemonset --namespace spire

NAME          DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
spire-agent   1         1         1       1            1           <none>          6m45s

$ kubectl get pods --namespace spire

NAME                           READY   STATUS    RESTARTS   AGE
spire-agent-88cpl              1/1     Running   0          6m45s
spire-server-b95945658-4wbkd   1/1     Running   0          103m
```

When the agent deploys, it binds the volumes summarized in the following table:

| Volume | Description | Mount Location |
| :------ |:---------- | :------------- |
| **spire-config** | The spire-agent configmap created in the  [Create Agent Configmap](#create-agent-configmap) step | **/run/spire/config** |
| **spire-sockets** | The hostPath, which will be shared with all other pods running on the same worker host. It contains a UNIX domain socket that workloads use to communicate with the agent API. | **/run/spire/sockets** |

## Section 5: Register Workloads {#section-5}

In order to enable SPIRE to perform workload attestation -- which allows the agent to identify the workload to attest to its agent --  you must register the workload in the server. This tells SPIRE how to identify the workload and which SPIFFE ID to give it.

1. Create a new registration entry for the node, specifying the SPIFFE ID to allocate to the node:

    ```shell
    $ kubectl exec -n spire spire-server-0 -- /opt/spire/bin/spire-server entry create \
        -spiffeID spiffe://example.org/ns/spire/sa/spire-agent \
        -parentID spiffe://example.org/spire/server \
        -selector k8s_sat:cluster:demo-cluster \
        -selector k8s_sat:agent_ns:spire \
        -selector k8s_sat:agent_sa:spire-agent \
        -node
    ```

2. Create a new registration entry for the workload, specifying the SPIFFE ID to allocate to the workload:

    ```shell
    $ kubectl exec -n spire spire-server-0 -- /opt/spire/bin/spire-server entry create \
        -spiffeID spiffe://example.org/ns/default/sa/default \
        -parentID spiffe://example.org/ns/spire/sa/spire-agent \
        -selector k8s:ns:default \
        -selector k8s:sa:default
    ```

## Section 6: Configure a Workload Container to Access SPIRE {#section-6}

In this step, you configure a workload container to access SPIRE. Specifically, you are configuring the workload container to access the Workload API UNIX domain socket.

The **client-deployment.yaml** file configures a no-op container using the **spire-k8s** docker image used for the server and agent. Examine the `volumeMounts` and `volumes configuration` stanzas to see how the UNIX domain `agent.sock` is bound in.

You can test that the agent socket is accessible from an application container by issuing the following sequence of commands:

1. Apply the deployment file:

    ```bash
    $ kubectl apply -f client-deployment.yaml
    ```

2. Obtain the pod hash for the workload container pod:

    ```bash
    $ kubectl get pods

    NAME                      READY   STATUS    RESTARTS   AGE
    client-6f9659bd44-m98vv   1/1     Running   0          18s
    ```

3. Obtain a shell connection to the running pod:

    ```bash
    $ kubectl exec -it client-6f9659bd44-m98vv /bin/sh
    ```

4. Verify the container can access the socket:

    ```bash
    /opt/spire # /opt/spire/bin/spire-agent api fetch -socketPath /run/spire/sockets/agent.sock
    ```

If the agent is not running, you’ll see an error message such as “no such file or directory" or “connection refused”.

If the agent is running, you’ll see a list of SVIDs.

## Section 7: Tear Down All Components {#section-7}

1. Delete the workload container:

    ```bash
    $ kubectl delete deployment client
    ```

2. Run the following commands to delete all deployments and configurations for the agent, server, and namespace:

    ```bash
    $ kubectl delete namespace spire
    ```

# Examining Server and Agent Logs

You examine server and agent logs with the `kubectl logs` command.

## Examine Server Logs

To examine the server logs, obtain the name of the random hash pod name displayed in the [Create Server StatefulSet](#create-server-statefulset) step, and then pass it into the `kubectl` logs command, as demonstrated here:

```bash
$ kubectl logs -f spire-server-b95945658-4wbkd --namespace spire
```

Your output should look something like the following:

```
time="2019-10-17T20:48:17Z" level=debug msg="Initializing API endpoints" subsystem_name=endpoints
time="2019-10-17T20:48:17Z" level=info msg="Starting TCP server" address="[::]:8081" subsystem_name=endpoints
time="2019-10-17T20:48:17Z" level=info msg="Starting UDS server" address=/tmp/spire-registration.sock subsystem_name=endpoints
time="2019-10-17T20:48:17Z" level=debug msg="Notifier handled event" event="bundle loaded" notifier=k8sbundle subsystem_name=ca_manager
time="2019-10-17T20:48:55Z" level=debug msg="Signing CSR for Agent SVID" agent_id="spiffe://example.org/spire/agent/k8s_sat/demo-cluster/578c8d2a-4713-468c-9619-35d5b3ec848e" attestor=k8s_sat spiffe_id="spiffe://example.org/spire/agent/k8s_sat/demo-cluster/578c8d2a-4713-468c-9619-35d5b3ec848e" subsystem_name=node_api
time="2019-10-17T20:48:55Z" level=debug msg="Signed X509 SVID" expiration="2019-10-17T21:48:55Z" spiffe_id="spiffe://example.org/spire/agent/k8s_sat/demo-cluster/578c8d2a-4713-468c-9619-35d5b3ec848e" subsystem_name=ca
time="2019-10-17T20:48:55Z" level=info msg="Node attestation request completed" address="10.0.2.15:41048" attestor=k8s_sat spiffe_id="spiffe://example.org/spire/agent/k8s_sat/demo-cluster/578c8d2a-4713-468c-9619-35d5b3ec848e" subsystem_name=node_api
```

## Examine Agent Logs

To examine the agent logs, obtain the name of the random hash pod name displayed in the  Create Agent Daemonset step, and then pass it into the `kubectl` logs command, as demonstrated here:

```bash
$ kubectl logs -f spire-agent-88cpl --namespace spire
```

Your output should look something like the following:

```
time="2019-10-17T20:50:51Z" level=info msg="Starting agent with data directory: \"/run/spire\""
time="2019-10-17T20:50:51Z" level=info msg="Plugin loaded." built-in_plugin=true plugin_name=k8s_sat plugin_services="[]" plugin_type=NodeAttestor subsystem_name=catalog
time="2019-10-17T20:50:51Z" level=info msg="Plugin loaded." built-in_plugin=true plugin_name=memory plugin_services="[]" plugin_type=KeyManager subsystem_name=catalog
time="2019-10-17T20:50:51Z" level=info msg="Plugin loaded." built-in_plugin=true plugin_name=k8s plugin_services="[]" plugin_type=WorkloadAttestor subsystem_name=catalog
time="2019-10-17T20:50:51Z" level=info msg="Plugin loaded." built-in_plugin=true plugin_name=unix plugin_services="[]" plugin_type=WorkloadAttestor subsystem_name=catalog
time="2019-10-17T20:50:51Z" level=debug msg="No pre-existing agent SVID found. Will perform node attestation" path=/run/spire/agent_svid.der subsystem_name=attestor
2019/10/17 20:50:51 [DEBUG] Starting checker name=agent
time="2019-10-17T20:50:51Z" level=info msg="Starting workload API" subsystem_name=endpoints
```

# Considerations For A Production Environment

When deploying SPIRE in a production environment the following considerations should be made.

In the [Create Server Configmap](#create-server-configmap) step: set the the cluster name in the `k8s_sat NodeAttestor` entry to the name you provide in the **agent-configmap.yaml** configuration file.

If your Kubernetes cluster supports projected service account tokens, consider using the built-in 
[Projected Service Account Token k8s Node Attestor](https://github.com/spiffe/spire/blob/master/doc/plugin_server_nodeattestor_k8s_psat.md) for authenticating the SPIRE agent to the server. Projected Service Account Tokens are more tightly scoped than regular service account tokens, and thus more secure.

As configured, the SPIRE agent does not verify the identity of the Kubernetes kubelet when requesting metadata for workload attestation. For additional security, you may wish to configure the Kubernetes workload attestor to perform this verification on compatible Kubernetes distributions by setting `skip_kubelet_verification` to `false`. [Read more](https://github.com/spiffe/spire/blob/master/doc/plugin_agent_workloadattestor_k8s.md)