#!/usr/local/bin/bash
if [[ $2 == 'npm' ]]
then
	npm publish --tag "${3-latest}"
else
	npm run lint && npm run build && npm run build:test
	if [[ $? -eq 0 ]]
	then
		git fetch --prune --prune-tags
		gsed -i -E "s/\"version\": \".+\"/\"version\": \"$1\"/" package.json
		git add -A
		git commit -m "chore: bump version to $1"
		git push
		git tag "$1"
		git push origin "$1"
	fi
fi
