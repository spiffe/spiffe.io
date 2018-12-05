# spiffe.io

This repository contains the source for the [SPIFFE](https://github.com/spiffe/spiffe) website, currently hosted at https://spiffe.netlify.com. That website also contains the documentation for [SPIRE](https://github.com/spiffe/spire), the SPIFFE Runtime Environment.

## Toolchain

The site is built using:

* [Hugo](https://gohugo.io/)
* The [Bulma](https://bulma.io) CSS framework

## Develop the site locally

To develop the locally, you'll first need to install some assets (mostly Sass assets) using [npm](https://npmjs.org):

```shell
make setup
```

With those assets in place, you can run the site locally using [Hugo](#hugo) or [Docker](#docker).

### Hugo

To run the site using Hugo, make sure it's [installed](https://gohugo.io/getting-started/installing/) and then run:

```shell
make serve
```

> Check the `HUGO_VERSION` environment variable in the [`netlify.toml`](netlify.toml) configuration file to see which Hugo version is deemed canonical for the SPIFFE website. Any Hugo version at or after that version should work fine. If you plan on working on the Sass/CSS, make sure to install the "extended" version of Hugo with support for [Hugo Pipes](https://gohugo.io/hugo-pipes/), which processes the Sass in realtime.

### Docker

If you have Docker installed, a convenient alternative to installing Hugo itself is to simply run:

```shell
make docker-serve
```

 `docker run --rm -it -v $(PWD):/src -p 1313:1313 -u hugo jguyomard/hugo-builder hugo server -w --bind=0.0.0.0`

from the base directory of this repository. A live-updated local version of the site will be made available from http://localhost:1313/.