This repository contains the source for the SPIFFE.io website, currently hosted at https://spiffe.netlify.com/

The site is built using [Hugo](https://gohugo.io/). To build and develop locally you can follow the instructions on the Hugo website.

If you have Docker installed, a convenient alternative to installing Hugo itself is to simply run 

 `docker run --rm -it -v $PWD:/src -p 1313:1313 -u hugo jguyomard/hugo-builder hugo server -w --bind=0.0.0.0`

from the base directory of this repository. A live-updated local version of the site will be made available from http://localhost:1313/.