---
# A short, descriptive headline. Shown on the post, the blog index, and in the
# browser tab / search results. (The folder's leading YYYY-MM-DD- date prefix is
# stripped from this derived title.)
title: "{{ replaceRE `^[0-9]{4}-[0-9]{2}-[0-9]{2}-` `` .Name | replace `-` ` ` | title }}"
# One or two sentences. Used as the listing excerpt AND the SEO meta
# description and social-share (Open Graph / Twitter) description.
description: ""
# Publish date. Drives ordering (newest first) and the byline. Posts dated in
# the future are hidden until that date.
date: {{ .Date }}
# Author name (a plain string). For multiple authors, comma-separate them.
author: ""
# Optional. One or more of: "SPIFFE", "SPIRE", "Community". Shown on the post
# and the blog index.
tags: []
# Optional. A social-share image. Co-locate it in this post's folder and
# reference it by filename, e.g. images: ["cover.png"]. Prefer a raster image
# (PNG/JPG), ~1200x630. Falls back to the site default if omitted.
# images: ["cover.png"]
# Set to false (or remove) to publish. Drafts only appear in local previews.
draft: true
---

Write your post here. The draft example post under content/blog/ is an annotated
template covering front matter, images, tags, and previewing locally.
