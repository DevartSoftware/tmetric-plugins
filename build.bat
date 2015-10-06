@echo off
cd /d %~dp0
npm install
call gulp build