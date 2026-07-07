# Contributing to spiffe.io

Thanks for your interest in improving [spiffe.io](https://spiffe.io).

This  repository contains the source for the SPIFFE
website, built with [Hugo](https://gohugo.io/) and the [Bulma](https://bulma.io)
CSS framework, and published automatically by [Netlify](https://netlify.com). 

Contributions of all kinds are welcome: fixing typos, improving
documentation, updating page layouts, or writing blog posts.

## Before You start: Is the Content in This Repo?

**Some documentation pages are not maintained here.** At build time, [
`pull_external.py`](pull_external.py) pulls a number of Markdown pages from 
other SPIFFE repositories, as described in [`external.yaml`](external.yaml). 

These pages come from:

* [spiffe/spire](https://github.com/spiffe/spire): SPIRE configuration
  references, upgrading, scaling, and quickstart docs
* [spiffe/spire-tutorials](https://github.com/spiffe/spire-tutorials): the
  Envoy, OPA, Vault, federation, and nested-SPIRE tutorials
* [spiffe/spiffe](https://github.com/spiffe/spiffe): the SPIFFE specifications

If the page you want to fix is one of these, **open your PR against the upstream
repository instead**: changes made here would be overwritten on the next build. 

To check, look for the source file in [`external.yaml`](external.yaml), or
see the auto-generated `content/.gitignore` after a local build, which lists
every pulled file.

Everything else (the rest of [`content/`](content), the data files in [
`data/`](data), layouts and shortcodes in [`layouts/`](layouts)) is 
maintained in this repository.

## Running the Site Locally

The preferred way is Docker, since it's the only tool you need to install:

```shell
make docker-serve
```

Alternatively, with a local toolchain (Hugo, Python, Pipenv, and npm — see
the [README](README.md#using-your-local-environment) for versions):

```shell
make setup
make serve
```

Either way, the site becomes available at [`http://localhost:1313`](http://localhost:1313) 
and rebuilds automatically when you edit Markdown files or 
[`external.yaml`](external.yaml). 

See the [README](README.md) for details, including the`-with-releases` variants 
and how to check for broken links with`make check-links` or 
`make docker-check-links`.

## Where Things Live

* **Documentation**: Markdown under [`content/docs/latest/`](content/docs/latest), 
  organized by section (`deploying/`, `planning/`, `maintenance/`, 
  and so on). Remember the external-content caveat above.
* **Blog posts**: folders under [`content/blog/`](content/blog) named
  `YYYY-MM-DD-slug`.
  The [README](README.md#writing-for-the-blog) has a full walkthrough, including
  an annotated example post to copy.
* **"Who uses SPIFFE?"**: [`data/users.yaml`](data/users.yaml), with logos 
  in [`static/img/logos`](static/img/logos).
* **Shortcodes**: [`layouts/shortcodes`](layouts/shortcodes), for embedding
  custom logic in Markdown (admonition blocks, the `spire-latest` version 
  shortcode, and more).

## Submitting a Pull Request

1. Fork the repository and create a branch from `master`.
2. Make your changes and verify them locally with `make docker-serve` (or
   `make serve`).
3. **Sign off every commit** (`git commit -s`). This repository requires
   the [Developer Certificate of Origin](https://github.com/apps/dco) on all
   commits; PRs with unsigned commits cannot be merged.
4. Open the pull request, filling in the template with a description of the
   change and, if applicable, `Fixes #<issue number>`.
5. Netlify builds a **deploy preview** for every PR: check the preview link
   posted on your PR to see your change rendered before it merges.

Once your PR is merged to `master`, Netlify builds and publishes the site
automatically in about a minute; there's nothing else to do.

## Filing Issues

Found a problem but can't fix it yourself? [File an issue](https://github.com/spiffe/spiffe.io/issues/new/choose)

The docs issue template will ask for the affected page URL and help you determine
whether the fix belongs here or upstream.

## Questions?

* Join the [SPIFFE Slack](https://slack.spiffe.io/): it's the fastest way to
  reach the maintainers and the community.
* For questions about the SPIFFE project itself (not the website), see
  the [spiffe/spiffe](https://github.com/spiffe/spiffe) community repository.
