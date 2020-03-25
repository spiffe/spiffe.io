---
title: AWS OIDC Authentication
description: Using OIDC to Authenticate SPIRE to AWS S3 on Kubernetes
weight: 4
toc: true
aliases:
menu:
  spire:
    weight: 50
    parent: 'spire-try'
---

This tutorial builds on the [Kubernetes Quickstart](/spire/try/getting-started-k8s/) guide to describe how a SPIRE identified workload can, using a JWT-SVID, authenticate to Amazon AWS APIs, assume an AWS IAM role, and retrieve data from an AWS S3 bucket. This avoids the need to create and deploy AWS IAM credentials with the workload itself.

In this tutorial you will learn how to:

* Deploy the OIDC Discovery Provider Service
* Create the required DNS A record to point to the Discovery Provider document
* Create a sample AWS identity provider, policy, role, and S3 bucket
* Test access to the S3 bucket

## Prerequisites

Note the following required accounts, prerequisites, and limitations before starting on this tutorial:

* You'll need access to the Kubernetes environment that you configured when going through [Kubernetes Quickstart](/spire/try/getting-started-k8s/) 
* You'll need access to the AWS console to configure an identity provider, policy, role, and S3 bucket
* This tutorial cannot run on Minikube as the Kubernetes environment must be network accessible by AWS
* You'll need the ability to configure a DNS A record for the SPIRE OIDC Discovery Provider document location (see next section)

### Required DNS A Record for the OIDC Discovery Provider IP Address

The SPIRE OIDC Discovery Provider provides a URL to the location of the discovery document specified by the OIDC protocol. After starting the spire-oidc service you'll need to configure a DNS A record to point to the external IP address of that service. In the YAML files set up for this tutorial, replace MY\_DISCOVERY\_DOMAIN with the FQDN of the planned DNS hostname. The FQDN value for MY\_DISCOVERY\_DOMAIN does not need to correspond to an existing FQDN on your network. It is specific to the Kubernetes environment.

To get the external IP address required for the A record, you will need to proceed through the following steps until you start the spire-oidc service and verify the external IP address in the section [Verify That spire-oidc has an External Service Address](#verify-that-spireoidc-has-an-external-service-address). The DNS A record should take the following form:

```console
MY_DISCOVERY_DOMAIN          A        EXTERNAL-IP for spire-oidc service
```

For example:
```console
oidc-discovery.example.org   A        93.184.216.34
```

{{< info >}}
As with any change to DNS, it will take minutes or hours for the new A record to propagate to DNS servers. This tutorial will not work until the A record is propagated. Once the A record is propagated, you should be able to view the discovery document at https://MY_DISCOVERY_DOMAIN/.well-known/openid-configuration .
{{< /info >}}

Although this tutorial should contain all the info you need, the SPIRE OIDC Discovery Provider configuration file format is described on [GitHub](https://github.com/spiffe/spire/tree/master/support/oidc-discovery-provider).

This tutorial uses Let's Encrypt to configure a certificate for the OIDC Discovery Domain. But other than editing the oidc-dp-configmap.yaml file as described in the previous section, no additional setup steps are required for Let's Encrypt.

# Part One: Configure SPIRE Components

In the first part of this procedure, you configure the SPIRE components. In the second part, you configure the AWS components. You test the connection in the third part.

## Download Kubernetes YAML Files for this Tutorial

To get the YAML files required for this tutorial, clone https://github.com/spiffe/spire-tutorials. The files for this tutorial are in the **k8s/oidc-aws** directory.

## Replace Placeholder Strings in YAML Files

The following strings in the YAML files must be substituted for values specific to your environment. Each location where you must make a change has been marked with `TODO:` in the YAML files.

| String | Description | Files to Change |
| --- | --- | --- |
| MY\_EMAIL\_ADDRESS | The terms of service for the Let's Encrypt certificate authority requires that you specify a valid email. Let's Encrypt is used to configure a certificate for the OIDC Discovery Domain (see the [Discovery Provider](#required-dns-a-record-for-the-oidc-discovery-provider-ip-address) info above). Example value: user@example.org | oidc-dp-configmap.yaml (1 instance) |
| MY\_DISCOVERY\_DOMAIN | You must configure a public DNS A record for the IP address of the OIDC Discovery Provider. See the next section for details. Example value: `oidc-discovery.example.org` | ingress.yaml (2 instances), oidc-dp-configmap.yaml (1 instance), server-configmap.yaml (1 instance) |

In the YAML files, instances of the `example.org` [trust domain](/spiffe/concepts/#trust-domain) are valid to use for this tutorial and do not need to be changed.

## Deploy OIDC Discovery Provider Configmap

The SPIRE OIDC Discovery Provider provides a URL to the location of the discovery document specified by the OIDC protocol. The oidc-dp-configmap.yaml file specifies the URL to the OIDC Discovery Provider.

Before running the command below, ensure that you have replaced the MY\_DISCOVERY\_DOMAIN placeholder with the FQDN of the Discovery Provider as described in [Replace Placeholder Strings in YAML Files](#replace-placeholder-strings-in-yaml-files).

Use the following command to apply the updated server configmap, the configmap for the OIDC Discovery Provider, and deploy the updated **spire-server** statefulset:

```console
$ kubectl apply \
    -f server-configmap.yaml \
    -f oidc-dp-configmap.yaml \
    -f server-statefulset.yaml
```

To verify that the spire-server-0 pod has spire-server and spire-oidc containers, run:

```console
$ kubectl get pods spire-server-0 -n spire -o jsonpath='{.spec.containers[*].name}{"\n"}'
```

## Configure the OIDC Discovery Provider Service and Ingress

Use the following command to set up a service definition for the OIDC Discovery Provider and to configure ingress for that service:

```console
$ kubectl apply \
    -f server-oidc-service.yaml \
    -f ingress.yaml 
```

## Verify the spire-server Stateful Set

Verify that the spire-server stateful set has been created:

```console
$ kubectl get statefulset --namespace spire

NAME           READY   AGE
spire-server   0/1     10h
```

## Verify That spire-oidc has an External Service Address

Run the following command to verify that the EXTERNAL-IP value is present for the spire-oidc service. The spire-oidc Discovery Provider service must provide an external IP address for AWS to access the OIDC discovery document provided by spire-oidc.

```console
$ kubectl get service -n spire

NAME           TYPE           CLUSTER-IP    EXTERNAL-IP    PORT(S)          AGE
spire-oidc     LoadBalancer   10.12.0.18    34.82.139.13   443:30198/TCP    108s
spire-server   NodePort       10.12.13.51   <none>         8081:32115/TCP   10h
```

### Configure a DNS A Record to Point to the spire-oidc EXTERNAL-IP

At this point you can put the value of the spire-oidc EXTERNAL-IP in the required DNS A record, along with the value of the MY\_DISCOVERY\_DOMAIN domain that you specified in oidc-dp-configmap.yaml. For more details, see [Required DNS A Record for the OIDC Discovery Provider IP Address](#required-dns-a-record-for-the-oidc-discovery-provider-ip-address).

## Deploy the Client

Apply the client deployment file to create a client in a different namespace that you will use for testing in [part 3](#part-3-test-access-to-aws-s3) of this document:

```console
$ kubectl apply -f client-deployment.yaml
```

# Part Two: Configure AWS Components

After configuring the SPIRE components, continue with configuring AWS.

## Set up an OIDC Identity Provider on AWS

To allow the SPIRE Agent to authenticate to an AWS service S3 bucket, you must configure an OpenID Connect identity provider. The AWS identity provider queries the SPIRE OIDC Discovery Provider that you configured.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Identity Providers** on the left and then click **Create Provider** at the top of the page.

3. For **Provider Type**, choose **OpenID Connect**.

4. For **Provider URL**, type `https://` and then the FQDN corresponding to the value that you used for MY\_DISCOVERY\_DOMAIN in the YAML files. The AWS identity provider queries the SPIRE OIDC Discovery Provider at this URL.

5. For **Audience**, type `mys3`. The SPIRE Agent presents this string to AWS when authenticating to the Amazon S3 bucket. Click **Next Step**. AWS verifies access to the Provider URL after you click the button and displays an error if it is inaccessible. If this occurs, ensure that the DNS is properly configured for public access to the SPIRE OIDC Discovery Provider (Provider URL).

6. Verify the information on the **Verify Provider Information** page and if OK, click **Create**.

## Create an AWS IAM Policy

Create the following simple AWS IAM policy that governs access to the S3 bucket used in this tutorial. In the next section, you will associate this policy with an IAM role.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Policies** on the left and then click **Create Policy** in the top middle of the page.

3. Click the **JSON** tab.

4. Replace the existing skeleton JSON blob with the following JSON blob:

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "VisualEditor0",
               "Effect": "Allow",
               "Action": [
                   "s3:PutAccountPublicAccessBlock",
                   "s3:GetAccountPublicAccessBlock",
                   "s3:ListAllMyBuckets",
                   "s3:ListJobs",
                   "s3:CreateJob",
                   "s3:HeadBucket"
               ],
               "Resource": "*"
           },
           {
               "Sid": "VisualEditor1",
               "Effect": "Allow",
               "Action": "s3:*",
               "Resource": [
                   "arn:aws:s3:::oidc-federation-test-bucket",
                   "arn:aws:s3:::oidc-federation-test-bucket/*",
                   "arn:aws:s3:*:*:job/*"
               ]
           }
       ]
   }
   ```

5. Click **Review policy**.

6. For **Name**, type the name `oidc-federation-test-policy`.

7. Click **Create policy**.

## Create an AWS IAM Role for the Identity Provider

The IAM role contains the connection parameters for the OIDC federation to AWS such as the OIDC identity provider, IAM policy, and SPIFFE ID of the connecting workloads.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Roles** on the left and then click **Create Role** in the middle of the page.

3. Click **Web Identity** near the top of the page.

4. For **Identity provider**, choose the identity provider that you created in AWS. The identity provider will be your Discovery Provider FQDN followed by `:aud`, such as `oidc-discovery.example.org:aud`.

5. For **Audience**, choose the audience you specified in the identity provider: `mys3`.

6. Click **Next: Permissions**.

7. Search for the policy that you created in the previous section: `oidc-federation-test-policy`. Click the check box next to that policy and then click **Next: Tags**. (Don't click the name of the policy.)

8. Click **Next: Review** to skip the **Add Tags** screen.

9. Type the name `oidc-federation-test-role` for the IAM role and click **Create role**. 

## Add the SPIFFE ID to the IAM Role

To allow the workload from outside AWS to access AWS S3, add the workload's SPIFFE ID to the IAM role. This restricts access to the IAM role to JWT SVIDs with the specified SPIFFE ID.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Roles** on the left, use the search field to find the `oidc-federation-test-role` IAM role that you created in the last section, and click the role.

3. Click the **Trust relationships** tab near the middle of the page and then click **Edit trust relationship**.

4. In the JSON access control policy, add a condition line at the end of the `StringEquals` attribute to restrict access to workloads matching the workload SPIFFE ID that was assigned in the [Kubernetes Quickstart](/spire/try/getting-started-k8s/). Use the form shown below but substitute your Discovery Provider FQDN for MY\_DISCOVERY\_DOMAIN. Add a comma at the end of the previous line after `"mys3"`.

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::012345678901:oidc-provider/MY_DISCOVERY_DOMAIN"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "MY_DISCOVERY_DOMAIN:aud": "mys3",
             "MY_DISCOVERY_DOMAIN:sub": "spiffe://example.org/ns/default/sa/default"
           }
         }
       }
     ]
   }
   ```

5. Click **Update Trust Policy**.

## Create an AWS S3 Test File

Create a simple test file in an AWS S3 bucket to use for testing.

1. Create a text file on your local computer called `test.txt` with the following single line:

   ```console
   oidc-tutorial file
   ```

   You'll upload this file to the S3 bucket momentarily.

2. Navigate to the AWS [Amazon S3 page](https://s3.console.aws.amazon.com/s3/home), logging in if necessary.

3. Click **Create bucket**.

4. Under **Bucket name** type `oidc-federation-test-bucket`.

5. Leave the **Region**, **Bucket settings for Block Public Access**, and **Advanced settings** at the default values and click **Create bucket**.

6. Click `oidc-federation-test-bucket` to open the bucket. 

7. Click **Upload**.

8. Add the `test.txt` file to the upload area using your local file navigator or drag and drop.

9. Click **Upload**.

# Part 3: Test Access to AWS S3

Now that Kubernetes and AWS are configured for OIDC federation, we'll test the connection. This test retrieves a JWT SVID from the SPIRE Agent and uses the JWT token in the JWT SVID to access S3.

1. Run the following command to list the full name of the client pod:
   ```console
   $ kubectl get pods

   NAME                      READY   STATUS    RESTARTS   AGE
   client-74d4467b44-7nrs2   1/1     Running   0          27s
   ```

2. Start a shell on the client using the client pod name shown under **NAME** in the output of the last step.

   ```console
   $ kubectl exec -it client-74d4467b44-7nrs2 /bin/sh
   ```

3. Fetch a JWT SVID from the identity provider on AWS and save the token from the JWT SVID into a file on the client container called `token`:

   ```console
   # /opt/spire/bin/spire-agent api fetch jwt -audience mys3 -socketPath /run/spire/sockets/agent.sock | sed '2!d' | sed 's/[[:space:]]//g' > token
   ```

4. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

5. Click **Roles**, search for the `oidc-federation-test-role` role you created, and click on the role name.

6. At the top of the **Summary** page, next to **Role ARN**, copy the role ARN into the clipboard by clicking the small icon at the end.

7. Run the following command, pasting the ARN in place of ROLE-NAME-ARN:

   ```console
   # AWS_ROLE_ARN=ROLE-NAME-ARN AWS_WEB_IDENTITY_TOKEN_FILE=token aws s3 cp s3://oidc-federation-test-bucket/test.txt test.txt
   ```

   If successful, this command will output the following and the `test.txt` file should be copied to the client container:

   ```console
   download: s3://oidc-federation-test-bucket/test.txt to ./test.txt
   ```

   See the next section if the command isn't successful.

8. Verify that the `test.txt` exists and contains `oidc-tutorial file`:

   ```console
   # cat test.txt
   oidc-tutorial file

9. Exit from `/bin/sh` on the client container:

   ```console
   # exit
   ```

## Troubleshooting s3 Testing

If you ran into a problem testing access to the s3 `test.txt` file, see the following sections for possible solutions.

### An error occurred (403) Error

If in step 7 of testing you get an error message that includes `An error occurred (403)`, the S3 bucket name in the AWS policy may not match the S3 bucket you specified on the command line.

### (ExpiredTokenException) Error

If in step 7 of testing you get an error message that includes `ExpiredTokenException`, the JWT token has expired. Start the test again at step 3 to download a new JWT token. These JWT tokens have an expiration time of 5 minutes, so you must complete the test within that time.

You can decode the token by pasting it in the tool at https://jwt.io . There you can check the token expiration time by hovering your mouse pointer over the `exp` field.

In a production environment, you will need a way to automatically refresh the JWT tokens for access to AWS.

### (NotFound) Error

If in step 2 you get an error message that includes `(NotFound)`, be sure to substitute your client pod name instead of using the example pod shown in step 2.

### General Troubleshooting

Double check that the AWS policy name, role name, S3 bucket name, and ARN match across these settings and the commands that you type. This applies mostly if you needed to use different names than those listed here.

# Cleanup

When you are finished running this tutorial, you can use the following commands to remove the SPIRE setup for AWS OIDC Authentication.

## Kubernetes Cleanup

Keep in mind that these commands will also remove the setup that you configured in the [Kubernetes Quickstart](/spire/try/getting-started-k8s/).

1. Delete the workload container:

   ```console
   $ kubectl delete deployment client
   ```

2. Delete all deployments and configurations for the agent, server, and namespace:

   ```console
   $ kubectl delete namespace spire
   ```

3. Delete the ClusterRole and ClusterRoleBinding settings:

   ```console
   $ kubectl delete clusterrole spire-server-trust-role spire-agent-cluster-role
   $ kubectl delete clusterrolebinding spire-server-trust-role-binding spire-agent-cluster-role-binding
   ```


You may also need to remove configuration elements from your cloud-based Kubernetes environment.

## AWS Cleanup

Delete the policy, role, and S3 bucket that you configured for this tutorial.

## DNS Cleanup

You can remove the A record that you configured for the SPIRE OIDC Discovery Provider document location.
