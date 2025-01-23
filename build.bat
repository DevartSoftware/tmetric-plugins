@echo off

pushd "%~dp0"

cd /d %~dp0

call npm install
IF %ERRORLEVEL% NEQ 0 GOTO END

call npx --no-install gulp %*
IF %ERRORLEVEL% NEQ 0 GOTO END

:: Pack sources for Mozilla
git archive -o dist/firefox/tmetric-src.zip HEAD

:END
popd
