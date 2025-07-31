
---
title: Upgrading
short: Upgrading
description: How to upgrade the SPIRE stack using the Helm charts
kind: spire-helm-charts-hardened-about
weight: 100
aliases:
    - /docs/latest/helm-charts-hardened/upgrading
---

# Chart version number meaning

The chart has its own version number following the semver scheme of:

`Major`.`Minor`.`Patch` versioning.

# Prerequisites

## Version upgrades
We only support upgrading one Major/Minor version at a time. Version skipping isn't supported except for patch versions.

Examples:
 * It's supported to upgrade from 0.11.1 directly to 0.11.7
 * It's supported to upgrade from 0.11.2 to 0.12.1
 * It's not supported to upgrade from 0.11.0 to 0.13.0

## Additional Upgrade Steps

From time to time you may need to do some upgrade steps before upgrading. We'll only do this
during Major or Minor version changes of the chart, never a patch release.

Look at the [upgrade notes](https://artifacthub.io/packages/helm/spiffe/spire#upgrade-notes) from the chart before performing the upgrade.

# Upgrading

Once all prerequisite steps have been performed, upgrade the instance by running 
the following. Make sure to use the namespace you installed the chart to:

```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
  --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-mgmt spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/ \
 -f your-values.yaml
```

{{< scarf/pixels/high-interest >}}
