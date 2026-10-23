---
title: Getting SPIRE
description: Platforms on Which SPIRE is Supported
sidebar:
  label: Getting SPIRE
  order: 10
---

## Start Using SPIRE

This page describes some options to get started with SPIRE.

### Docker Compose

* [SPIRE 101](https://github.com/spiffe/spire/blob/v1.15.5/doc/SPIRE101.md) is an introduction to SPIRE that runs on Docker Compose

* Additional Docker Compose demos are available in the [spire-tutorials](https://github.com/spiffe/spire-tutorials) repo

### Kubernetes

* Start with the [Helm quickstart](/docs/spire/helm/installation/#quick-start) in a non-production cluster. Use chart values to configure and upgrade the installation.

* For production, follow the [production deployment instructions](/docs/spire/helm/installation/#production-deployment). To learn how the components fit together using individual manifests, follow [SPIRE from scratch on Kubernetes](/docs/spire/try/getting-started-k8s/).

* Additional Kubernetes demos are available in the [spire-tutorials](https://github.com/spiffe/spire-tutorials) repo

### Linux

* The SPIRE GitHub [releases](https://github.com/spiffe/spire/releases) page has download links and changelogs for each SPIRE release

* The spiffe.io [Get SPIRE](/downloads/) page has additional download options and instructions for building SPIRE yourself

* [Quickstart for Linux and MacOS X](/docs/spire/try/getting-started-linux-macos-x/) describes how to download and test a simple one-node installation of the SPIRE Server and Agent

### MacOS

* There are no pre-built SPIRE executables available for MacOS, but [Quickstart for Linux and MacOS X](/docs/spire/try/getting-started-linux-macos-x/) describes how to download and build SPIRE to test a simple one-node installation of the SPIRE Server and Agent
