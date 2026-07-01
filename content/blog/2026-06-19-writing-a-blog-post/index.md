---
title: "Writing a blog post"
description: "An annotated example post. Copy this folder to start a new post; it documents the front matter, images, and tags as it goes."
date: 2026-06-19
author: "The SPIFFE Maintainers"
tags: ["SPIFFE", "SPIRE", "Community"]
images: ["cover.png"]
draft: true
---

This post is a working template. It is marked `draft: true`, so it never appears
on the published site, but you can read it locally with `make serve` (or
`make docker-serve`). The quickest way to start a new post is to copy this
folder, rename it, and replace the contents.

## Create the folder

Each post is a folder under `content/blog/` whose name is the publish date
followed by a short slug, for example `2026-06-19-writing-a-blog-post`. The date
prefix keeps posts sorted in the filesystem, and it becomes part of the URL. The
folder holds an `index.md` file (this file) plus any images the post uses.

```text
content/blog/
  2026-06-19-writing-a-blog-post/
    index.md
    cover.png
    turtle.svg
```

## Fill in the front matter

The block fenced by `---` at the very top of this file is the front matter. It
sets everything about the post except the body. Here is what each field does:

- **`title`** - the headline. It shows on the post, on the blog index, in the
  browser tab, and in search results.
- **`description`** - one or two sentences. This is reused in three places: the
  excerpt on the blog index, the SEO meta description, and the preview text when
  the post is shared on social media. Keep it under about 160 characters.
- **`date`** - the publish date, `YYYY-MM-DD`. It drives ordering (newest first)
  and the byline. Match it to the date in the folder name. A date in the future
  hides the post until then.
- **`author`** - your name, as a plain string. For more than one author, list
  them in a single string, e.g. `"Jane Doe, John Smith"`.
- **`tags`** - choose from our three tags: `SPIFFE`, `SPIRE`, and `Community`.
  They appear on the post and on the blog index.
- **`images`** - optional. The social-share image (see below). If you leave it
  out, the SPIFFE logo is used.
- **`draft`** - set this to `false` (or remove it) when the post is ready to
  publish. While it is `true`, the post only appears in local previews.

## Add images

Put images inside this folder and reference them with normal Markdown. Always
write descriptive alt text in the square brackets - it helps both accessibility
and SEO:

![The SPIFFE turtle, the project mascot](turtle.svg)

```markdown
![The SPIFFE turtle, the project mascot](turtle.svg)
```

Because the image lives in the post folder, it is published next to the post and
the link resolves correctly. A few guidelines:

- Use PNG or JPG for screenshots and photos, and SVG for diagrams.
- Keep files reasonably sized; very large images slow the page down.
- For the social-share image (the preview shown when the post is linked in chat
  or on social media), set `images: ["cover.png"]` in the front matter and put
  `cover.png` in the folder. A raster image around 1200x630 works best.

## Write the body

Everything below the front matter is the body, written in Markdown. Use `##` and
`###` for section headings (the `title` is the page's only top-level heading),
and the usual Markdown for **bold**, _italics_, [links](https://spiffe.io),
lists, and `code`. Fenced code blocks are syntax-highlighted:

```go
ctx := context.Background()
source, err := workloadapi.NewX509Source(ctx)
```

## Preview and publish

Run the site locally and open
[`http://localhost:1313/blog/`](http://localhost:1313/blog/). Saving a change
reloads the page automatically. When the post is ready, set `draft: false` and
open a pull request. Merging to `master` publishes it automatically.
