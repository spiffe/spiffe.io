setup:
	npm install

serve:
	hugo server \
	--buildDrafts \
	--buildFuture \
	--disableFastRender

production-build:
	hugo --gc

preview-build:
	hugo --baseURL $(DEPLOY_PRIME_URL)

docker-serve:
	docker run --rm -it -v $(PWD):/src -p 1313:1313 klakegg/hugo:latest-ext server --buildDrafts --buildFuture
