@echo off
setlocal
cd /d "%~dp0"
py -3 -m pip install --upgrade pyinstaller
if errorlevel 1 exit /b 1
py -3 -m unittest -q test_engine test_advanced
if errorlevel 1 exit /b 1
py -3 -m PyInstaller --clean --noconfirm --onefile --windowed --name MURDILIMAX-Recovery --paths . murdilimax_recovery_v02.py
if errorlevel 1 exit /b 1
echo Executable: %CD%\dist\MURDILIMAX-Recovery.exe
pause
