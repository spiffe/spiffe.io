
---
title: Upgrading
short: Upgrading
description: How to upgrade the SPIRE Helm chart
kind: spire-helm-charts-hardened-about
weight: 110
aliases:
    - /docs/latest/helm-charts-hardened/upgrading
---

# Chart version number meaning

The chart has its own version number following the semver scheme of:

`Major`.`Minor`.`Patch` versioning.

# Prerequisite

## Version upgrades
We only support upgrading one Major/Minor version at a time. Version skipping isn't supported except for patch versions.

Examples:
 * Its supported to upgrade from 0.11.1 directly to 0.11.7
 * Its supported to upgrade from 0.11.2 to 0.12.1
 * Its not supported to upgrade from 0.11.0 to 0.13.0

## Additional Upgrade Steps

From time to time we may need to have you do some upgrade steps before upgrading. We only will do this
during Major or Minor version changes of the chart, never a patch release.

Look at the upgrade notes from the chart before performing the upgrade.
They can be found here:
https://artifacthub.io/packages/helm/spiffe/spire#upgrade-notes

# Upgrading

Once all prerequisite steps have been preformed, upgrade the instance by running the following:

```shell
helm upgrade --install --create-namespace -n spire-mgmt spire-crds spire-crds \
  --repo https://spiffe.github.io/helm-charts-hardened/

helm upgrade --install -n spire-mgmt spire spire \
 --repo https://spiffe.github.io/helm-charts-hardened/ \
 -f your-values.yaml
```
