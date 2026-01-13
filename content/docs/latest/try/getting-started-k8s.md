---
title: Quickstart for Kubernetes
description: Quickly get SPIRE up and running on a Kubernetes cluster
kind: try
weight: 50
aliases:
    - /tutorial-spire-on-kubernetes
    - /spire/try/getting-started-k8s
    - /spire/getting-started-k8s
    - /docs/latest/spire/installing/getting-started-k8s
---

# Overview

This guide walks you through getting a SPIRE Server and SPIRE Agent running in a Kubernetes cluster, and configuring a workload container to access SPIRE.

In this introduction to SPIRE on Kubernetes you will learn how to:

* Create the appropriate Kubernetes namespaces and service accounts to deploy SPIRE
* Deploy the SPIRE Server as a Kubernetes statefulset
* Deploy the SPIRE Agent as a Kubernetes daemonset
* Configure a registration entry for a workload
* Fetch an x509-SVID over the SPIFFE Workload API
* Learn where to find resources for more complex installations

The steps in this guide have been tested using Kubernetes versions 1.29 through 1.34.

{{< info >}}
If you are using Minikube to run this tutorial you should specify some special flags as described [here](#considerations-when-using-minikube).
{{< /info >}}

{{< info >}}
If you are using Kubeadm to run this tutorial, a default storage class and an associated provisioner must be manually created, otherwise the **spire-server** pod will stay in `Pending` status, showing the `1 pod has unbound immediate PersistentVolumeClaims` error.
{{< /info >}}

# Obtain the Required Files

To follow this guide, you will need several YAML files. You can obtain them by cloning the SPIRE tutorials repository at https://github.com/spiffe/spire-tutorials and navigating to the `spire-tutorials/k8s/quickstart` subdirectory. Ensure that all `kubectl` commands are run from this directory.

Set up a Kubernetes environment on a provider of your choice or use Minikube. Link the Kubernetes environment to the kubectl command.

# Configure Kubernetes Namespace for SPIRE Components

Follow these steps to configure the **spire** namespace in which SPIRE Server and SPIRE Agent are deployed.

1. Change to the directory containing the **.yaml** files.

2. Create the namespace:

    ```bash
    $ kubectl apply -f spire-namespace.yaml
    ```

3. Run the following command and verify that *spire* is listed in the output:

    ```bash
    $ kubectl get namespaces
    ```

# Configure SPIRE Server

## Create Server Bundle Configmap, Role & ClusterRoleBinding

For the server to function, it is necessary for it to provide agents with certificates that they can use to verify the identity of the server when establishing a connection.

In a deployment such as this, where the agent and server share the same cluster, SPIRE can be configured to automatically generate these certificates on a periodic basis and update a configmap with contents of the certificate. To do that, the server needs the ability to get and patch a configmap object in the `spire` namespace.

To allow the server to read and write to this configmap, a ClusterRole must be created that confers the appropriate entitlements to Kubernetes RBAC, and that ClusterRoleBinding must be associated with the service account created in the previous step.

Create the server's service account, configmap and associated role bindings as follows:

```bash
$ kubectl apply \
    -f server-account.yaml \
    -f spire-bundle-configmap.yaml \
    -f server-cluster-role.yaml
```

## Create Server Configmap

The server is configured in the Kubernetes configmap specified in server-configmap.yaml, which specifies a number of important directories, notably **/run/spire/data** and **/run/spire/config**. These volumes are bound in when the server container is deployed.

Deploy the server configmap and statefulset by applying the following files via kubectl:

```bash
$ kubectl apply \
    -f server-configmap.yaml \
    -f server-statefulset.yaml \
    -f server-service.yaml
```

This creates a statefulset called **spire-server** in the **spire** namespace and starts up a **spire-server** pod, as demonstrated in the output of the following commands:

```bash
$ kubectl get statefulset --namespace spire

NAME           READY   AGE
spire-server   1/1     86m

$ kubectl get pods --namespace spire

NAME                           READY   STATUS    RESTARTS   AGE
spire-server-0                 1/1     Running   0          86m

$ kubectl get services --namespace spire

NAME           TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
spire-server   NodePort   10.107.205.29   <none>        8081:30337/TCP   88m
```

# Configure and deploy the SPIRE Agent

To allow the agent read access to the kubelet API to perform workload attestation, a Service Account and ClusterRole must be created that confers the appropriate entitlements to Kubernetes RBAC, and that ClusterRoleBinding must be associated with the service account created in the previous step.

```bash
$ kubectl apply \
    -f agent-account.yaml \
    -f agent-cluster-role.yaml
```

Apply the **agent-configmap.yaml** configuration file to create the agent configmap and deploy the Agent as a daemonset that runs one instance of each Agent on each Kubernetes worker node.

```bash
$ kubectl apply \
    -f agent-configmap.yaml \
    -f agent-daemonset.yaml
```

This creates a daemonset called **spire-agent** in the **spire** namespace and starts up a **spire-agent** pod along side **spire-server**, as demonstrated in the output of the following commands:

```bash
$ kubectl get daemonset --namespace spire

NAME          DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
spire-agent   1         1         1       1            1           <none>          6m45s

$ kubectl get pods --namespace spire

NAME                           READY   STATUS    RESTARTS   AGE
spire-agent-88cpl              1/1     Running   0          6m45s
spire-server-0                 1/1     Running   0          103m
```

As a daemonset, you'll see as many **spire-agent** pods as you have nodes.

# Register Workloads

In order to enable SPIRE to perform workload attestation -- which allows the agent to identify the workload to attest to its agent -- you must register the workload in the server. This tells SPIRE how to identify the workload and which SPIFFE ID to give it.

1. Create a new registration entry for the node, specifying the SPIFFE ID to allocate to the node:

    ```shell
    $ kubectl exec -n spire spire-server-0 -- \
        /opt/spire/bin/spire-server entry create \
        -spiffeID spiffe://example.org/ns/spire/sa/spire-agent \
        -selector k8s_psat:cluster:demo-cluster \
        -selector k8s_psat:agent_ns:spire \
        -selector k8s_psat:agent_sa:spire-agent \
        -node
    ```

2. Create a new registration entry for the workload, specifying the SPIFFE ID to allocate to the workload:

    ```shell
    $ kubectl exec -n spire spire-server-0 -- \
        /opt/spire/bin/spire-server entry create \
        -spiffeID spiffe://example.org/ns/default/sa/default \
        -parentID spiffe://example.org/ns/spire/sa/spire-agent \
        -selector k8s:ns:default \
        -selector k8s:sa:default
    ```

# Configure a Workload Container to Access SPIRE

In this section, you configure a workload container to access SPIRE. Specifically, you are configuring the workload container to access the Workload API UNIX domain socket.

The **client-deployment.yaml** file configures a no-op container using the **spire-k8s** docker image used for the server and agent. Examine the `volumeMounts` and `volumes configuration` stanzas to see how the UNIX domain `agent.sock` is bound in.

You can test that the agent socket is accessible from an application container by issuing the following commands:

1. Apply the deployment file:

    ```bash
    $ kubectl apply -f client-deployment.yaml
    ```

2. Verify that the container can access the socket:

    ```bash
    $ kubectl exec -it $(kubectl get pods -o=jsonpath='{.items[0].metadata.name}' \
       -l app=client)  -- /opt/spire/bin/spire-agent api fetch -socketPath /run/spire/sockets/agent.sock
    ```

   If the agent is not running, you’ll see an error message such as “no such file or directory" or “connection refused”.

   If the agent is running, you’ll see a list of SVIDs.

# Tear Down All Components

1. Delete the workload container:

    ```bash
    $ kubectl delete deployment client
    ```

2. Run the following command to delete all deployments and configurations for the agent, server, and namespace:

    ```bash
    $ kubectl delete namespace spire
    ```

3. Run the following commands to delete the ClusterRole and ClusterRoleBinding settings:

    ```bash
    $ kubectl delete clusterrole spire-server-trust-role spire-agent-cluster-role
    $ kubectl delete clusterrolebinding spire-server-trust-role-binding spire-agent-cluster-role-binding
    ```

# Considerations When Using Minikube

If you are using Minikube to run this tutorial, when starting your cluster you should pass some additional configuration flags.
```
$ minikube start \
    --extra-config=apiserver.service-account-signing-key-file=/var/lib/minikube/certs/sa.key \
    --extra-config=apiserver.service-account-key-file=/var/lib/minikube/certs/sa.pub \
    --extra-config=apiserver.service-account-issuer=api \
    --extra-config=apiserver.api-audiences=api,spire-server \
    --extra-config=apiserver.authorization-mode=Node,RBAC
```
{{< info >}}
For Kubernetes versions prior to 1.17.0 the `apiserver.authorization-mode` can be specified as `apiserver.authorization-mode=RBAC`. Besides, for older versions of Kubernetes you should use `apiserver.service-account-api-audiences` configuration flag instead of `apiserver.api-audiences`.
{{< /info >}}

# Next steps

* [Review the SPIRE Documentation](/docs/latest/spire/using/) to learn how to configure SPIRE for your environment.

{{< scarf/pixels/medium-interest >}}
