@echo off
cd /d C:\Users\DELL\TIS\app
set PATH=C:\Users\DELL\AppData\Local\nvm\v25.9.0;%PATH%
set EXPO_TOKEN=x2YHY1BH3V6ueWB6V9yNUSW8HUSx9iLH8o-GVOYi
set CI=
echo Node version:
node --version
echo.
echo Starting Expo tunnel...
echo.
node node_modules\expo\bin\cli start --tunnel --clear
pause
