@echo off
setlocal
cd /d "%~dp0"
py -3 -m pip install -r requirements.txt "pyinstaller==6.16.0" || exit /b 1
set QT_QPA_PLATFORM=offscreen
py -3 -m unittest discover -v || exit /b 1
set QT_QPA_PLATFORM=
py -3 -m PyInstaller --clean --noconfirm --onefile --windowed --noupx --name MURDILIMAX-Recovery --icon assets\murdilimax.ico --paths . murdilimax_crystal.py || exit /b 1
echo EXE ready: dist\MURDILIMAX-Recovery.exe
endlocal
