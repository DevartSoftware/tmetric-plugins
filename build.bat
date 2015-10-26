@echo off
cd /d %~dp0\src

call npm install
call gulp build

cd ..