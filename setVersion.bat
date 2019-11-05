@echo off
cd /d %~dp0

call npx --no-install gulp version --newversion=2.13.5
