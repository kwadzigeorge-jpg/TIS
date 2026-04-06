@echo off
:loop
"C:\Users\DELL\TIS\cloudflared.exe" tunnel --url http://localhost:4000
echo Tunnel disconnected, restarting...
ping -n 3 127.0.0.1 >nul
goto loop
