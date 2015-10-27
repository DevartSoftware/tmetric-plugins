@echo off
cd /d %~dp0\src

call npm -g install gulp-cli@0.3.0
call npm -g install typescript@1.5.x
call npm -g install selenium-standalone@4.6.x
call selenium-standalone install