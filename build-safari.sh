#!/usr/bin/env bash

set -e

pushd .

# store all params
PARAMS=$@

while (("$#")); do
    case "$1" in
        --serviceUrl=*)
            serviceUrl="${1#*=}"
            ;;
    esac
    shift
done

PATH=/usr/local/bin:$PATH

npm i
npx --no-install gulp build:safari $PARAMS

cd ./dist/safari

appName=TMetric\ for\ Safari
appExtensionName=TMetric\ for\ Safari\ Extension

if [ -n "$serviceUrl" ]; then
    search=https://app.tmetric.com
    replace=$serviceUrl
    file=./$appExtensionName/script.js
    echo Replace $search with $replace in $file
    awk -v a="$search" -v b="$replace" '{ gsub(a, b); print }' "$file" > tmp && mv tmp "$file"
fi

xcodebuild

infoPListFile=./build/Release/$appName.app/Contents/Info.plist
version=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$infoPListFile")

packageFile="tmetric_for_safari-$version.pkg"

pkgbuild --install-location /Applications --component "./build/Release/$appName.app" "$packageFile"

popd
