---
title: AWS OIDC Authentication
description: Using SPIRE and OIDC to Authenticate Workloads on Kubernetes to AWS S3
kind: keyless
weight: 10
aliases:
   - /spire/try/oidc-federation-aws
   - /docs/latest/spire-integrations/oidc-federation/oidc-federation-aws
---

This tutorial builds on the [Kubernetes Quickstart](/docs/latest/spire/installing/getting-started-k8s/) guide to describe how a SPIRE identified workload can, using a JWT-SVID, authenticate to Amazon AWS APIs, assume an AWS IAM role, and retrieve data from an AWS S3 bucket. This avoids the need to create and deploy AWS IAM credentials with the workload itself.

In this tutorial you will learn how to:

* Deploy the OIDC Discovery Provider Service
* Create the required DNS A record to point to the OIDC Discovery document endpoint
* Create a sample AWS identity provider, policy, role, and S3 bucket
* Test access to the S3 bucket

## Prerequisites

Note the following required accounts, prerequisites, and limitations before starting this tutorial:

* You'll need access to the Kubernetes environment that you configured when going through [Kubernetes Quickstart](/docs/latest/spire/installing/getting-started-k8s/). The Kubernetes environment must be able to expose an Ingress to the public internet. _Note: This is generally not true for local Kubernetes environments such as Minikube._
* You'll need access to the AWS console with an account that has permissions to configure an identity provider, IAM policy, IAM role, and S3 bucket.
* You'll need the ability to configure a DNS A record for the SPIRE OIDC Discovery document endpoint (see [Part 2](#part-2-configure-dns-for-the-oidc-discovery-ip-address))


# Part 1: Configure SPIRE Components

In the first part of this procedure, you configure the SPIRE components in Kubernetes.

## Download Kubernetes YAML Files for this Tutorial

To get the YAML files required for this tutorial, clone https://github.com/spiffe/spire-tutorials. The files for this tutorial are in the `k8s/oidc-aws` directory.

## Replace Placeholder Strings in YAML Files

The following strings in the YAML files must be substituted for values specific to your environment. Each location where you must make a change has been marked with `TODO:` in the YAML files.

| String | Description | Files to Change |
| --- | --- | --- |
| MY\_EMAIL\_ADDRESS | Specify a valid email address to satisfy the terms of service for the Let's Encrypt certificate authority used in AWS OIDC federation. No email will actually be sent to this address. Example value: user@example.org | oidc-dp-configmap.yaml (1 instance) |
| MY\_DISCOVERY\_DOMAIN | Replace with the domain that you will use in the A record for the OIDC Discovery document endpoint. See [Part 2](#part-2-configure-dns-for-the-oidc-discovery-ip-address) for details. Example value: `oidc-discovery.example.org` | ingress.yaml (2 instances), oidc-dp-configmap.yaml (1 instance), server-configmap.yaml (1 instance) |

In the YAML files, instances of the `example.org` [trust domain](/docs/latest/spiffe/concepts/#trust-domain) are valid to use for this tutorial and do not need to be changed.

## Deploy OIDC Discovery Provider Configmap

The SPIRE OIDC Discovery Provider provides a URL to the location of the discovery document specified by the OIDC protocol. The oidc-dp-configmap.yaml file specifies the URL to the OIDC Discovery Provider.

Before running the command below, ensure that you have replaced the MY\_DISCOVERY\_DOMAIN placeholder with the FQDN of the Discovery Provider as described in [Replace Placeholder Strings in YAML Files](#replace-placeholder-strings-in-yaml-files).

Change to the directory containing the `k8s/oidc-aws` YAML files and use the following command to apply the updated server configmap, the configmap for the OIDC Discovery Provider, and deploy the updated **spire-server** statefulset:

```console
$ kubectl apply \
    -f server-configmap.yaml \
    -f oidc-dp-configmap.yaml \
    -f server-statefulset.yaml
```

To verify that the **spire-server** pod has **spire-server** and **spire-oidc** containers, run:

```console
$ kubectl get pods -n spire -l app=spire-server -o \
    jsonpath='{.items[*].spec.containers[*].name}{"\n"}'
```

This should output:

```console
spire-server spire-oidc
```

## Configure the OIDC Discovery Provider Service and Ingress

Use the following command to set up a service definition for the OIDC Discovery Provider and to configure ingress for that service:

```console
$ kubectl apply \
    -f server-oidc-service.yaml \
    -f ingress.yaml 
```


# Part 2: Configure DNS for the OIDC Discovery IP Address

As part of this tutorial, you will need to register a public DNS record that will resolve to the public IP address of your Kubernetes cluster. This will require you or an administrator to have registered a domain name (e.g. `yutani.com`) with a domain name registrar, have configured its name server to point to a DNS service, and have the ability to create an A record for a new subdomain (e.g. `oidc-discovery.yutani.com`) in that DNS service. If you don't have a registered domain name or access to a DNS service, services like Google Domains can help you set one up for a fee.

In this tutorial, the subdomain that you create will provide an endpoint to the discovery document specified by the OIDC protocol. AWS will query this endpoint as part of the authentication handshake between AWS and SPIRE.

## Retrieve the IP Address of the SPIRE OIDC Discovery Provider

Run the following command to retrieve the external IP address of the **spire-oidc** service. The **spire-oidc** Discovery Provider service must provide an external IP address for AWS to access the OIDC Discovery document provided by **spire-oidc**.

```console
$ kubectl get service -n spire spire-oidc

NAME           TYPE           CLUSTER-IP    EXTERNAL-IP    PORT(S)          AGE
spire-oidc     LoadBalancer   10.12.0.18    34.82.139.13   443:30198/TCP    108s
```

## Configure an A Record for the OIDC Discovery Document Endpoint

Using your preferred DNS tool, put the MY\_DISCOVERY\_DOMAIN domain and the **spire-oidc** external IP address in a new DNS A record. The A record should take the following form:

```console
MY_DISCOVERY_DOMAIN          A        EXTERNAL-IP for spire-oidc service
```

For example:
```console
oidc-discovery.example.org   A        93.184.216.34
```

{{< info >}}
Do not use the `oidc-discovery.example.org` domain or IP address shown above.
{{< /info >}}

## Verify the DNS A Record

As with any change to DNS, it will take minutes or hours for the new A record to propagate to DNS servers. This tutorial will not work until the A record is propagated. Negative DNS query results will be cached, causing headaches. So, to be safe, wait an hour or so to test the DNS change after creating the A record.

1. Use `nslookup` to display the DNS information for the domain you configured in the A record:

   ```console
   $ nslookup oidc-discovery.example.org
   Server:        203.0.113.0
   Address:	      203.0.113.0#53

   Non-authoritative answer:
   Name:	oidc-discovery.example.org
   Address: 93.184.216.34
   ```

   The `Address:` field at the bottom should correspond to the IP address in the A record.

2. In your browser, navigate to `https://MY_DISCOVERY_DOMAIN/.well-known/openid-configuration`. You should see JSON output similar to the following:

   ```json
   {
     "issuer": "https://oidc-discovery.example.org",
     "jwks_uri": "https://oidc-discovery.example.org/keys",
     "authorization_endpoint": "",
     "response_types_supported": [
       "id_token"
     ],
     "subject_types_supported": [],
     "id_token_signing_alg_values_supported": [
       "RS256",
       "ES256",
       "ES384"
     ]
   }
   ```


# Part 3: Configure AWS Components

After configuring an A Record for the OIDC discovery document endpoint, continue with configuring AWS.

## Create an AWS S3 Bucket and Test File

Create a simple test file in an AWS S3 bucket to use for testing.

1. Create a text file on your local computer called `test.txt` with the following single line:

   ```console
   oidc-tutorial file
   ```

   You'll upload this file to the S3 bucket momentarily.

2. Navigate to the AWS [Amazon S3 page](https://s3.console.aws.amazon.com/s3/home), logging in if necessary.

3. Click **Create bucket**.

4. Under **Bucket name** type a name for the S3 bucket that you'll use for testing.

   The bucket name must be unique across all S3 bucket names in Amazon S3 since buckets can be accessed via a URL. Substitute the name of this bucket for MY\_TEST\_BUCKET in the JSON policy definition in [Create an AWS IAM Policy](#create-an-aws-iam-policy) and when testing in [Part 4](#part-4-test-access-to-aws-s3).

5. Leave the **Region**, **Bucket settings for Block Public Access**, and **Advanced settings** at the default values and click **Create bucket**.

6. Click the name of your bucket to open the bucket. 

7. Click **Upload**.

8. Add the `test.txt` file to the upload area using your local file navigator or drag and drop.

9. Click **Upload**.

## Set up an OIDC Identity Provider on AWS

To allow the SPIRE Agent to authenticate to an AWS service S3 bucket, you must configure an OpenID Connect identity provider. The AWS identity provider queries the SPIRE OIDC Discovery document endpoint that you configured.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Identity Providers** on the left and then click **Create Provider** at the top of the page.

3. For **Provider Type**, choose **OpenID Connect**.

4. For **Provider URL**, type `https://` and then the FQDN corresponding to the value that you used for MY\_DISCOVERY\_DOMAIN in the YAML files. The AWS identity provider queries the SPIRE OIDC Discovery document at this URL.

5. For **Audience**, type `mys3`. The SPIRE Agent presents this string to AWS when authenticating to the Amazon S3 bucket. 

6. Click **Next Step**. AWS verifies access to the Provider URL after you click the button and displays an error if it is inaccessible. If this occurs, ensure that the DNS is properly configured for public access to the SPIRE OIDC Discovery document endpoint (Provider URL).

6. Verify the information on the **Verify Provider Information** page and if OK, click **Create**.

## Create an AWS IAM Policy

The following simple AWS IAM policy governs access to the S3 bucket used in this tutorial. In the next section, you will associate this policy with an IAM role.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Policies** on the left and then click **Create Policy** in the top middle of the page.

3. Click the **JSON** tab.

4. Replace the existing skeleton JSON with the following JSON policy definition and replace MY\_TEST\_BUCKET with the name of the S3 test bucket that you created in [Create an AWS S3 Bucket and Test File](#create-an-aws-s3-bucket-and-test-file):

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
                   "arn:aws:s3:::MY_TEST_BUCKET",
                   "arn:aws:s3:::MY_TEST_BUCKET/*",
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

4. For **Identity provider**, choose the identity provider that you created in AWS. The identity provider will be your Discovery document FQDN followed by `:aud`, such as `oidc-discovery.example.org:aud`.

5. For **Audience**, choose the audience you specified in the identity provider: `mys3`.

6. Click **Next: Permissions**.

7. Search for the policy that you created in the previous section: `oidc-federation-test-policy`. Click the check box next to that policy and then click **Next: Tags**. (Don't click the name of the policy.)

8. Click **Next: Review** to skip the **Add Tags** screen.

9. Type the name `oidc-federation-test-role` for the IAM role and click **Create role**. 

## Add the SPIFFE ID to the IAM Role

To allow the workload from outside AWS to access AWS S3, add the workload's SPIFFE ID to the IAM role. This restricts access to the IAM role to JWT SVIDs with the specified SPIFFE ID.

1. Navigate to the AWS [Identity and Access Management (IAM) page](https://console.aws.amazon.com/iam/home#/home), logging in if necessary.

2. Click **Roles** on the left, use the search field to find the `oidc-federation-test-role` IAM role that you created in the last section, and click the role.

3. At the top of the **Summary** page, next to **Role ARN**, copy the role ARN into the clipboard by clicking the small icon at the end. Save the ARN in a file such as `oidc-arn.txt` for use in the testing section ([Part 4](#part-4-test-access-to-aws-s3)).

4. Click the **Trust relationships** tab near the middle of the page and then click **Edit trust relationship**.

5. In the JSON access control policy, add a condition line at the end of the `StringEquals` attribute to restrict access to workloads matching the workload SPIFFE ID that was assigned in the [Kubernetes Quickstart](/docs/latest/spire/installing/getting-started-k8s/). The new line to add is:

   ```json
   "MY_DISCOVERY_DOMAIN:sub": "spiffe://example.org/ns/default/sa/default"
   ```
   But substitute your Discovery document FQDN for MY\_DISCOVERY\_DOMAIN. Add a comma at the end of the previous line after `"mys3"`. When finished, the JSON should look similar to the following if you used `oidc-discovery.example.org` for your OIDC discovery domain:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::012345678901:oidc-provider/oidc-discovery.example.org"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "oidc-discovery.example.org:aud": "mys3",
             "oidc-discovery.example.org:sub": "spiffe://example.org/ns/default/sa/default"
           }
         }
       }
     ]
   }
   ```

6. Click **Update Trust Policy**. This change to the IAM role takes a minute or two to propagate.


# Part 4: Test Access to AWS S3

Now that SPIRE in Kubernetes, the DNS A record for the OIDC Discovery document endpoint, and AWS are configured for OIDC federation, we'll test the connection. This test retrieves a JWT SVID from the SPIRE Agent and uses the JWT token in the JWT SVID to access S3.

1. In the directory containing the YAML files, apply the client deployment file to create a test client in a different namespace:

    ```console
    $ kubectl apply -f client-deployment.yaml
    ```

2. Start a shell on the client:

   ```console
   $ kubectl exec -it $(kubectl get pods -o \
       jsonpath={'.items[*]'.metadata.name}) -- /bin/sh
   ```

3. Fetch a JWT SVID from the identity provider on AWS and save the token from the JWT SVID into a file on the client container called `token`:

   ```console
   # /opt/spire/bin/spire-agent api fetch jwt -audience mys3 -socketPath \
       /run/spire/sockets/agent.sock | sed '2!d' | sed 's/[[:space:]]//g' > token
   ```

4. Verify that the token was successfully written:

   ```console
   # cat token
   eyJhbGciOiJSUzI1NiIsImtpZCI6InpRdm9WWVpoVTBJWlpEUXBVOFN0MFdoQXdWZVp1S2
   JqIiwidHlwIjoiSldUIn0.eyJhdWQiOlsibXlzMyJdLCJleHAiOjE1ODU2MDYzNjAsImlh
   dCI6MTU4NTYwNjA2MCwiaXNzIjoiaHR0cHM6Ly90ZWNocHVicy1vaWRjLWRpc2NvdmVyeS
   5za2l0YWxlZS5vcmciLCJzdWIiOiJzcGlmZmU6Ly9leGFtcGxlLm9yZy9ucy9kZWZhdWx0
   L3NhL2RlZmF1bHQifQ.aGyDeySJ1BFeM9Afv3Vi6BBE3fw-Op4JWWuq3IfzRp9NW4Aet_Z
   SkAG25O7A0C8MZgFb2_-1o0O60HMhO0CUPoJzIScUL62GarfOE3-HDKZbf3fyh8dzO14wq
   oU9JAEbCZuMViyW0uMFqAOMYXcGFSEyA0DKcYrHQxT7t9kUTW6BiPtM5s5AZG0uOeUGBeH
   hh2q1FAi97Ui3vNdH4nmSaklhtKzQh18j5HA4fSXOIwYIIlUm9b6nQlxTKNrS93uD8TSj7
   oiZbiGU0w2YetmSrQi15mqPUshnuigNCAFeHgB-eoSK9zAPJncWmZqyD8RLbU7LT61LusF
   g-JsJaiVYkA
   ```

5. Locate the ARN of the IAM role that you created in [Part 3](#part-3-configure-aws-components) and saved in `oidc-arn.txt`. Alternatively, return to the AWS console and find the ARN of the IAM role there.

6. Run the following command, pasting the ARN in place of MY\_ROLE\_NAME\_ARN and your S3 test bucket name in place of MY\_TEST\_BUCKET:

   ```console
   # AWS_ROLE_ARN=MY_ROLE_NAME_ARN AWS_WEB_IDENTITY_TOKEN_FILE=token aws s3 \
       cp s3://MY_TEST_BUCKET/test.txt test.txt
   ```

   If successful, this command will output the following and the `test.txt` file should be copied to the client container:

   ```console
   download: s3://oidc-federation-test-bucket/test.txt to ./test.txt
   ```

   See the next section if the command isn't successful.

7. Verify that the `test.txt` file exists and contains `oidc-tutorial file`:

   ```console
   # cat test.txt
   oidc-tutorial file
   ```

8. Exit from `/bin/sh` on the client container:

   ```console
   # exit
   ```

## Troubleshooting S3 Testing

If you ran into a problem testing access to the `test.txt` file in S3, see the following sections for possible solutions.

### An error occurred (403) Error

If in step 6 of testing you get an error message that includes `An error occurred (403)`, the S3 bucket name in the AWS policy may not match the S3 bucket you specified on the command line.

### (ExpiredTokenException) Error

If in step 6 of testing you get an error message that includes `ExpiredTokenException`, the JWT token has expired. Start the test again at step 3 to download a new JWT token. These JWT tokens have an expiration time of 5 minutes, so you must complete the test within that time.

You can decode the token by pasting it in the tool at https://jwt.io . There you can check the token expiration time by hovering your mouse pointer over the `exp` field.

In a production environment, you will need a way to automatically refresh the JWT tokens for access to AWS.

### General Troubleshooting

Double check that the AWS policy name, role name, S3 bucket name, and ARN match across these settings and the commands that you type. This applies mostly if you needed to use different names than those listed here.

# Cleanup

When you are finished running this tutorial, you can use the following commands to remove the SPIRE setup for AWS OIDC Authentication.

## Kubernetes Cleanup

Keep in mind that these commands will also remove the setup that you configured in the [Kubernetes Quickstart](/docs/latest/spire/installing/getting-started-k8s/).

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

Remove the A record that you configured for the SPIRE OIDC Discovery document endpoint.
