@echo off
cd /d "%~dp0"
if "%~1"=="" (
  echo Drag your Videos folder onto this IMPORT_VIDEOS.cmd file.
  echo Or run: node IMPORT_VIDEOS.mjs "C:\path\to\videos"
  pause
  exit /b 1
)
node "%~dp0IMPORT_VIDEOS.mjs" "%~1"
pause
