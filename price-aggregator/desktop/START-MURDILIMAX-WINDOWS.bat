@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python Launcher was not detected.
  echo Install Python 3.11 or newer from https://www.python.org/downloads/windows/
  pause
  exit /b 1
)
py -3 murdilimax_recovery_v02.py
if errorlevel 1 (
  echo Launch failed. Keep all .py files together in the same folder.
  echo Run: py -3 -m unittest -v test_engine test_advanced
  pause
  exit /b 1
)
