@echo off
cd /d %~dp0\src
call npm install
call npm -g install gulp-cli@0.3.0
call npm -g install typescript@1.5.x
call gulp install:selenium
