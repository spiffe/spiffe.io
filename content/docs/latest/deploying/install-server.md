---
title: Install the SPIRE Server
short: Install Server
kind: deploying
description: How to install the SPIRE Server on Linux and Kubernetes
weight: 60
aliases:
    - /spire/docs/install-server
    - /docs/latest/spire/installing/install-server
---
## Step 1: Obtain the SPIRE Binaries

Pre-built SPIRE releases can be found on the [SPIRE downloads page](/downloads/#spire-releases). The tarballs contain both server and agent binaries.

If you wish, you may also [build SPIRE from source](https://github.com/spiffe/spire/blob/main/CONTRIBUTING.md).

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

## Step 3: Configure the Server {#step-3}

To configure the server on Linux, you:

1. Configure the trust domain
2. Configure the server certificate authority (CA), which might include configuring an UpstreamAuthority plugin
3. Configure the node attestation plugin
4. Configure a default **.data** directory for persisting data

However, to get a simple deployment up and running for demonstration purposes, you need only go through steps 1, 2, and 3. 

To configure the items in steps 1, 2, and 4, edit the server’s configuration file, located in **/opt/spire/conf/server/server.conf**.

See [Configuring SPIRE](/docs/latest/spire/using/configuring/) for details about how to configure SPIRE, in particular Node Attestation and Workload Attestation.

Note that a SPIRE Server must be restarted once its configuration has been modified for changes to take effect.

See [Install SPIRE Agents](/docs/latest/spire/installing/install-agents/) to learn how to install the SPIRE Agent.

# How to install the SPIRE Server on Kubernetes

This section walks you step-by-step through getting a server running in your Kubernetes cluster and configuring a workload container to access SPIRE.

{{< warning >}}
You must run all commands from the directory containing the **.yaml** files used for configuration.
{{< /warning >}}

## Step 1: Obtain the Required Files {#section-1}

To obtain the required **.yaml** files, clone **https://github.com/spiffe/spire-tutorials** and copy the **.yaml** files from the **spire-tutorials/k8s/quickstart** subdirectory.

## Step 2: Configure Kubernetes Namespace for SPIRE Components {#section-2}

Follow these steps to configure the **spire** namespace in which SPIRE Server and SPIRE Agent are deployed.

1. Create the namespace:

    ```console
    $ kubectl apply -f spire-namespace.yaml
    ```

2. Run the following command and verify that *spire* is listed in the output:

    ```console
    $ kubectl get namespaces
    ```

## Step 3: Configure SPIRE Server {#section-3}

To configure the SPIRE Server on Kubernetes, you:

1. Create server service account
2. Create server bundle configmap
3. Create server configmap
4. Create server statefulset
5. Create server service

See the following sections for details.

### Create Server Service Account

1. Configure a service account named **spire-server** by applying the **server-account.yaml** configuration file:

    ```console
    $ kubectl apply -f server-account.yaml
    ```

2. To confirm successful creation, verify that *spire-server* appears in the output of the following command:

    ```console
    $ kubectl get serviceaccount --namespace spire
    ```

### Create Server Bundle Configmap, Role & ClusterRoleBinding

For the server to function, it is necessary for it to provide agents with certificates that they can use to verify the identity of the server when establishing a connection.

In a deployment such as this, where the agent and server share the same cluster, SPIRE can be configured to automatically generate these certificates on a periodic basis and update a configmap with contents of the certificate. To do that, the server needs the ability to get and patch a configmap object in the `spire` namespace.

1. Create a Configmap named **spire-bundle** by applying the **spire-bundle-configmap.yaml** configuration file:

    ```console
    $ kubectl apply -f spire-bundle-configmap.yaml
    ```

2. To confirm successful creation, verify the configmap **spire-bundle** is listed in the output of the following command:

    ```console
    $ kubectl get configmaps --namespace spire | grep spire
    ```

To allow the server to read and write to this configmap, a ClusterRole must be created that confers the appropriate entitlements to Kubernetes RBAC, and that ClusterRoleBinding must be associated with the service account created in the previous step.

1. Create a ClusterRole named **spire-server-trust-role** and a corresponding ClusterRoleBinding by applying the **server-cluster-role.yaml** configuration file:

    ```console
    $ kubectl apply -f server-cluster-role.yaml
    ```

2. To confirm successful creation, verify that the ClusterRole **spire-server-trust-role** appears in the output of the following command:

    ```console
    $ kubectl get clusterroles --namespace spire | grep spire
    ```

### Create Server Configmap

The server is configured in the Kubernetes configmap specified in **server-configmap.yaml**, which specifies a number of important directories, notably **/run/spire/data** and **/run/spire/config**. These volumes are bound in when the server container is deployed.

Follow the [Configuring SPIRE](/docs/latest/spire/using/configuring/) section for full details on how to configure the SPIRE Server, in particular Node Attestation and Workload Attestation.

Note that a SPIRE Server must be restarted once its configuration has been modified for changes to take effect.

To applying the server configmap to your cluster, issue the following command:

```console
$ kubectl apply -f server-configmap.yaml
```

### Create Server StatefulSet

Deploy the server by applying the configuration **server-statefulset.yaml** file:

```console
$ kubectl apply -f server-statefulset.yaml
```

This creates a statefulset called **spire-server** in the **spire** namespace and starts up a **spire-server** pod, as demonstrated in the output of the following two commands:

```console
$ kubectl get statefulset --namespace spire

NAME           READY   AGE
spire-server   1/1     86m


$ kubectl get pods --namespace spire

NAME                           READY   STATUS    RESTARTS   AGE
spire-server-0                 1/1     Running   0          86m
```

When you deploy the server it automatically configures a livenessProbe on the SPIRE server's GRPC port, which ensures availability of the container.

When the server deploys, it binds in the volumes summarized in the following table:

| Volume           | Description                                                                | Mount Location        |
|:-----------------|:---------------------------------------------------------------------------|:----------------------|
| **spire-config** | A reference to the **spire-server** configmap created in the previous step | **/run/spire/config** |
| **spire-data**   | The hostPath for the server's SQLite database and keys file                | **/run/spire/data**   |

### Create Server Service

1. Create the server service by applying the **server-service.yaml** configuration file:

    ```console
    $ kubectl apply -f server-service.yaml
    ```

2. Verify that the **spire** namespace now has a **spire-server** service in the **spire** namespace:

    ```console
    $ kubectl get services --namespace spire

    NAME           TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
    spire-server   NodePort   10.107.205.29   <none>        8081:30337/TCP   88m
    ```

# Where next?

Once you've installed the SPIRE Server, consider reviewing the guide on [How to install SPIRE Agents](/docs/latest/spire/installing/install-agents/).

{{< scarf/pixels/high-interest >}}
