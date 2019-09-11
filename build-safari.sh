#!/usr/bin/env bash

pushd .

gulp_params=$1

PATH=/usr/local/bin:$PATH

npm i
npx --no-install gulp build:safari ${gulp_params}

cd ./dist/safari

xcodebuild

appName=TMetric\ for\ Safari
infoPListFile=./${appName}/Info.plist
version=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "${infoPListFile}")

packageFile="tmetric_for_safari-${version}.pkg"

pkgbuild --install-location /Applications --component "./build/Release/${appName}.app" "${packageFile}"

popd