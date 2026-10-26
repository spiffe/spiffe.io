---
title: Deploying SPIRE
sidebar:
  label: Deploy
  order: 100
---

Start with [configuration](/docs/spire/deploying/configuring/) to choose attestors, the datastore, and trust-domain settings. Then [install the server](/docs/spire/deploying/install-server/), [install agents](/docs/spire/deploying/install-agents/), and [register workloads](/docs/spire/deploying/registering/).

For Kubernetes, start with the [Helm quickstart](/docs/spire/helm/installation/#quick-start) in a non-production cluster, or follow the [production deployment instructions](/docs/spire/helm/installation/#production-deployment) to configure chart values for your environment. Once workloads receive SVIDs, choose a [client library](/docs/spire/deploying/libraries/) or [service integration](/docs/spire/integrations/services/).

Use the [server](/docs/spire/deploying/spire_server/) and [agent](/docs/spire/deploying/spire_agent/) references for individual settings, and [telemetry configuration](/docs/spire/deploying/telemetry_config/) for monitoring.
