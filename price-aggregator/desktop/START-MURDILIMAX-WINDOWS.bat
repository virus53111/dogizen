@echo off
cd /d "%~dp0"
where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py murdilimax_recovery_v02.py
) else (
  where python >nul 2>&1
  if %ERRORLEVEL%==0 (
    python murdilimax_recovery_v02.py
  ) else (
    echo Python 3.11+ required: https://www.python.org/downloads/
    pause
    exit /b 1
  )
)
if %ERRORLEVEL% NEQ 0 pause
