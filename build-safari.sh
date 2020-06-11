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
    case "$1" in
        --idUrl=*)
            idUrl="${1#*=}"
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

replace() {
    file=$1
    search=$2
    replace=$3
    echo Replace $search with $replace in $file
    awk -v a="$search" -v b="$replace" '{ gsub(a, b); print }' "$file" > tmp && mv tmp "$file"
}

if [ -n "$serviceUrl" ]; then
    replace "./$appExtensionName/script.js" https://app.tmetric.com $serviceUrl
    replace "./$appExtensionName/SafariExtensionHandler.swift" https://app.tmetric.com $serviceUrl
fi

if [ -n "$idUrl" ]; then
    replace "./$appExtensionName/SafariExtensionHandler.swift" https://id.tmetric.com $idUrl
fi

xcodebuild

infoPListFile=./build/Release/$appName.app/Contents/Info.plist
version=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$infoPListFile")

packageFile="tmetric_for_safari-$version.pkg"

pkgbuild --install-location /Applications --component "./build/Release/$appName.app" "$packageFile"

popd
