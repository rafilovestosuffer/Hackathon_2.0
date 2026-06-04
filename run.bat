@echo off
echo Starting InspectAI servers...
echo.
echo [1] Starting backend on http://localhost:8000
start cmd /k "cd backend && python main.py"
echo.
timeout /t 2
echo.
echo [2] Starting frontend on http://localhost:3000
start cmd /k "cd frontend && npm run dev"
echo.
echo Both servers are starting in separate windows.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000/api/inspect
echo.
pause
