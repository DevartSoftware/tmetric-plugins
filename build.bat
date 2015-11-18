@echo off
cd /d %~dp0
call npm install
call npm -g install gulp-cli@0.3.x
call npm -g install typescript@1.6.x
call gulp