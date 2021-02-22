@echo off
cd /d %~dp0

call npx --no-install gulp version --newversion=4.1.0
