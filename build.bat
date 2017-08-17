@echo off

pushd "%~dp0"

cd /d %~dp0\src

call npm install
call npm update jpm

call gulp %*

:: Pack Edge extension
if not defined ProgramFiles(x86) SET ProgramFiles(x86)=%ProgramFiles%
set MakeAppx="%ProgramFiles(x86)%\Windows Kits\10\App Certification Kit\MakeAppx.exe"
cd /d %~dp0\dist\edge
:: TODO: if exist %MakeAppx% %MakeAppx% pack ...

popd
