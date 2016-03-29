@echo off
pushd "%~dp0"
cd /d %~dp0\src

call npm install
call npm update jpm
call gulp

IF DEFINED trackerServiceUrl (
    call gulp --test
)

popd
