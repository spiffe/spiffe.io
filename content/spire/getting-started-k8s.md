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

{{< warning >}}
This deployment this guide walks you through creating is not designed for a production Kubernetes environment.
A production environment requires adjustments to certain steps; the section
[Changes for a Production Environment](#changes-for-a-production-environment) walks you through the necessary changes.
{{< /warning >}}

## Before You Begin

Before you begin, read through this section for information about the environment and deployment it sets up. Also, if you’re not familiar with basic SPIFFE and SPIRE concepts, be sure to review the [SPIFFE/SPIRE Overview](https://spiffe.io/spire/overview/).

## Tested Kubernetes Versions

This steps in this guide have been tested on these Kubernetes versions: 1.13.1, 1.12.4, and 1.10.12.

## Assumptions

The sample **.yaml** files for this walkthrough assume you are running Kubernetes in a [minikube](https://kubernetes.io/docs/setup/minikube/) cluster. If you’re not running a minikube cluster, you will need to adjust certain configuration settings; these adjustments are called out in the relevant step in the guide.

## Deployment and Configuration Details

* The server statefulset runs on a Kubernetes worker node, using a PersistentVolumeClaim for storage
* The agent daemonset runs on each Kubernetes worker node
* All SPIRE components are created in a Kubernetes namespace called **spire**.
* The server runs in a service account named **spire-server**
* The agent runs in a service account named **spire-agent**
* The server uses a **hostPath** bind mount for persisting its keys and SQLite database.
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
2. Create server secrets
3. Create server configmap
4. Create server statefulset

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

1. Create two ClusterRole objects named **spire-server-role** and **spire-server-cluster-role**, and the corresponding ClusterRoleBinding objects by applying the **server-cluster-role.yaml** configuration file:

    ```bash
    $ kubectl apply -f server-cluster-role.yaml
    ```

2. To confirm successful creation, verify that the two ClusterRoles appear in the output of the following command:

    ```bash
    $ kubectl get clusterroles --namespace spire | grep spire
    ```

2. To confirm successful creation, verify that two ClusterRolesBindings appear in the output of the following command:

    ```bash
    $ kubectl get clusterrolebindings --namespace spire | grep spire
    ```

### Create Server Configmap

The server is configured in the Kubernetes configmap specified in server-configmap.yaml, which specifies a number of important directories, notably **/run/spire/data**, **/run/spire/config**, **/run/spire/secrets**, and **/run/k8s-certs**. These volumes are bound in when the server container is deployed.

The configmap also contains the bootstrap certificate **dummy_upstream_ca.crt**. As explained in the section [Changes for a Production Environment](#changes-for-a-production-environment), this is not appropriate for a production environment.

To create the server configmap, issue the following command:

```bash
$ kubectl apply -f server-configmap.yaml
```

### Create Server StatefulSet

Before you deploy the server: If you are not running Kubernetes in a minikube cluster, you must introspect the running pod for kube-apiserver to determine which certificate Kubernetes uses to validate service accounts. This will either be the value of **--service-account-key-file** OR -- if that is not provided to **kube-apiserver** -- the value of **--tls-private-key-file**. Depending on which applies to you, set the **k8s-sa-cert** value to the certificate in use.

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
| **spire-secrets** | A  reference to the **spire-server** secrets created in the step [Create Server Secrets](#create-server-secrets) | **/run/spire/secrets** |
| **spire-data** | The hostPath for the server's SQLite database and keys file | **/run/spire/data** |
| **k8s-sa-cert** | The public key used to validate service accounts. As noted under [Create Server StatefulSet](#create-server-statefulset) you must take special steps to correctly set this value if you're *not* running Kubernetes in a minikube cluster. | **/run/k8s-certs/sa.pub** |

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

To verify that the agent attested to the server, [examine the server logs](#examine-server-logs); you should expect output similar to the following:

```
time="2019-01-07T23:49:13Z" level=debug msg="Signing CSR for Agent SVID spiffe:
//example.org/spire/agent/k8s_sat/minikube/139f5941-b83b-43f9-b35c-cafbe720d3ff
" subsystem_name=node_api
time="2019-01-07T23:49:13Z" level=debug msg="Signed x509 SVID \"spiffe://exampl
e.org/spire/agent/k8s_sat/minikube/139f5941-b83b-43f9-b35c-cafbe720d3ff\" (expi
res 2019-01-07T23:59:39Z)" subsystem_name=ca_manager
time="2019-01-07T23:49:13Z" level=debug msg="could not find node resolver type
%qk8s_sat" subsystem_name=node_api
time="2019-01-07T23:49:13Z" level=info msg="Node attestation request from 192.1
68.122.147:36718 completed using strategy k8s_sat" subsystem_name=node_api
```

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
time="2019-01-07T20:41:39Z" level=debug msg="Setting umask to 077"
time="2019-01-07T20:41:39Z" level=info msg="data directory: \"/run/spire/data\"
  "
time="2019-01-07T20:41:39Z" level=info msg="Starting plugin catalog" subsystem_
  name=catalog
time="2019-01-07T20:41:39Z" level=debug msg="DataStore(sql): configuring plugin
  " subsystem_name=catalog
time="2019-01-07T20:41:39Z" level=debug msg="NodeAttestor(k8s_sat): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T20:41:39Z" level=debug msg="NodeResolver(noop): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T20:41:39Z" level=debug msg="KeyManager(disk): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T20:41:39Z" level=debug msg="UpstreamCA(disk): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T20:41:39Z" level=info msg="plugins started"
time="2019-01-07T20:41:39Z" level=debug msg="Loaded keypair set \"A\""
  subsystem_name=ca_manager
time="2019-01-07T20:41:39Z" level=debug msg="Loaded keypair set \"B\""
  subsystem_name=ca_manager
time="2019-01-07T20:41:39Z" level=debug msg="Loaded keypair sets"
  subsystem_name=ca_manager
time="2019-01-07T20:41:39Z" level=debug msg="Activating keypair set \"B\""
  subsystem_name=ca_manager
```

## Examine Agent Logs

To examine the agent logs, obtain the name of the random hash pod name displayed in the  Create Agent Daemonset step, and then pass it into the `kubectl` logs command, as demonstrated here:

```bash
$ kubectl logs -f spire-agent-88cpl --namespace spire
```

Your output should look something like the following:

```
time="2019-01-07T22:20:59Z" level=info msg="Starting plugin catalog" subsystem_
  name=catalog
time="2019-01-07T22:20:59Z" level=debug msg="WorkloadAttestor(k8s): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T22:20:59Z" level=debug msg="WorkloadAttestor(unix): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T22:20:59Z" level=debug msg="NodeAttestor(k8s_sat): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T22:20:59Z" level=debug msg="KeyManager(memory): configuring
  plugin" subsystem_name=catalog
time="2019-01-07T22:20:59Z" level=debug msg="No pre-existing agent SVID found.
  Will perform node attestation" subsystem_name=attestor
time="2019-01-07T22:29:31Z" level=info msg="Starting workload API"
  subsystem_name=endpoints
```

# Changes For A Production Environment

This deployment you set up in this walkthrough is not designed for a production Kubernetes environment. A production environment requires adjustments to certain steps; these changes are summarized in this section.

The server uses a **hostPath** bind mount for persisting its keys and SQLite database. In a production deployment, a more robust and secure persistence mechanism is required.

This walkthrough uses a bootstrap cert -- **dummy_upstream_ca.crt** -- and key from the SPIRE source tree. In a production deployment, you would generate a new key/certificate pair and implement certificate rotation.

In the [Create Server Configmap](#create-server-configmap) step: set the the cluster name in the `k8s_sat NodeAttestor` entry to the name you provide in the **agent-configmap.yaml** configuration file.
