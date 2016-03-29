@echo off

set serviceUrl=%1

pushd "%~dp0"

cd /d %~dp0\src

call npm install
call npm update jpm

call gulp

IF DEFINED serviceUrl (
    call gulp --test --serviceUrl=%serviceUrl%
)

popd
