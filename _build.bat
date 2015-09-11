@echo off
cd /d %~dp0
call npm install
call npm -g install gulp-cli
call gulp