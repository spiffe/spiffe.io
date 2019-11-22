setup:
	npm install

serve:
	HIDE_RELEASES=true hugo server \
	--buildDrafts \
	--buildFuture \
	--disableFastRender \
	--ignoreCache \
	--noHTTPCache

serve-with-releases:
	hugo server \
	--buildDrafts \
	--buildFuture \
	--disableFastRender

production-build:
	hugo --gc

preview-build:
	hugo --baseURL $(DEPLOY_PRIME_URL)

docker-serve:
	docker run --rm -it -v $(PWD):/src -p 1313:1313 -e HIDE_RELEASES=true klakegg/hugo:latest-ext server --buildDrafts --buildFuture

docker-serve-with-releases:
	docker run --rm -it -v $(PWD):/src -p 1313:1313 klakegg/hugo:latest-ext server --buildDrafts --buildFuture
