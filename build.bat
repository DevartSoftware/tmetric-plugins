@echo off

pushd "%~dp0"

cd /d %~dp0\src

call npm install
call npm update jpm

call gulp

popd
