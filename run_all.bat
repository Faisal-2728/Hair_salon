@echo off
REM Start backend and frontend in new command windows (Windows)
SET ROOT=%~dp0
echo Starting backend...
start "Backend" cmd /k "cd /d "%ROOT%backend" && python app.py"
timeout /t 2 >nul
echo Starting frontend (will run npm install if needed)...
start "Frontend" cmd /k "cd /d "%ROOT%frontend" && npm install && npm run dev"
echo Launched backend and frontend in separate windows.
pause
