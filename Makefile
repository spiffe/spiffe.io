HUGO_VERSION ?= 0.68.3

setup:
	npm install

serve: pull-external-content
	HIDE_RELEASES=true hugo server \
		--buildDrafts \
		--buildFuture \
		--disableFastRender \
		--ignoreCache \
		--noHTTPCache

serve-with-releases: pull-external-content
	hugo server \
		--buildDrafts \
		--buildFuture \
		--disableFastRender

production-build: pull-external-content
	hugo \
		--gc \
		--ignoreCache

preview-build: pull-external-content
	hugo \
		--gc \
		--ignoreCache \
		--baseURL $(DEPLOY_PRIME_URL)

docker-serve: pull-external-content
	docker run --rm -it -v $(PWD):/src -p 1313:1313 -e HIDE_RELEASES=true \
		klakegg/hugo:${HUGO_VERSION}-ext \
		server --buildDrafts --buildFuture

docker-serve-with-releases: pull-external-content
	docker run --rm -it -v $(PWD):/src -p 1313:1313 \
		klakegg/hugo:${HUGO_VERSION}-ext \
		server --buildDrafts --buildFuture

pull-external-content:
	python ./pull_external.py