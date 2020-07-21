@echo off

pushd "%~dp0"

cd /d %~dp0

call npm install

call npx --no-install gulp %*

:: Pack sources for Mozilla
git archive -o dist/firefox/tmetric-src.zip HEAD

popd
