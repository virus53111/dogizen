@echo off
setlocal
cd /d "%~dp0"
py -3 murdilimax_crystal.py
if errorlevel 1 echo Install Qt/Pillow to run from source: py -3 -m pip install -r requirements.txt
endlocal
