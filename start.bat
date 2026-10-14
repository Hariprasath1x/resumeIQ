@echo off
@rem ==============================================================================
@rem ResumeIQ-py — One-Click Startup Script for Windows
@rem
@rem Starts both the FastAPI backend and React/Vite frontend together with:
@rem - Self-resolving repository path (run from File Explorer or Command Prompt)
@rem - Python 3.12 and Node.js/npm detection
@rem - MongoDB availability check (graceful warning if offline)
@rem - Port conflict detection with safe instance reuse
@rem - Virtual environment auto-detection / creation (backend\.venv)
@rem - Dependency verification and safe installation
@rem - HTTP service readiness verification before browser launch
@rem - Informative error logging with pause-on-failure
@rem ==============================================================================

setlocal EnableExtensions EnableDelayedExpansion

@rem 1. Resolve project root reliably from batch file's own directory
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo =======================================================
echo  ResumeIQ-py -- Unified Platform Launcher (Windows)
echo =======================================================
echo [INFO] Project root: %PROJECT_ROOT%

@rem 2. Verify required repository structure and files
if not exist "%PROJECT_ROOT%backend\app\main.py" (
    echo [ERROR] Missing critical file: backend\app\main.py
    echo         Please ensure start.bat is run inside the ResumeIQ-py repository.
    goto :fail
)
if not exist "%PROJECT_ROOT%backend\requirements.txt" (
    echo [ERROR] Missing critical file: backend\requirements.txt
    goto :fail
)
if not exist "%PROJECT_ROOT%frontend\package.json" (
    echo [ERROR] Missing critical file: frontend\package.json
    goto :fail
)

@rem 3. Detect Node.js and npm
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js was not found on your PATH.
    echo         Please install Node.js (v18+) from https://nodejs.org/
    goto :fail
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm was not found on your PATH.
    goto :fail
)

for /f "tokens=*" %%i in ('node -v') do set "NODE_VER=%%i"
for /f "tokens=*" %%i in ('npm -v') do set "NPM_VER=%%i"
echo [INFO] Detected Node.js: %NODE_VER% ^| npm: %NPM_VER%

@rem 4. Detect compatible Python 3.12 interpreter
set "PYTHON_CMD="

if exist "%PROJECT_ROOT%backend\.venv\Scripts\python.exe" (
    for /f "tokens=2 delims= " %%v in ('"%PROJECT_ROOT%backend\.venv\Scripts\python.exe" --version 2^>nul') do (
        echo %%v | findstr /b "3.12" >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            set "PYTHON_CMD=%PROJECT_ROOT%backend\.venv\Scripts\python.exe"
        )
    )
)

if not defined PYTHON_CMD (
    py -3.12 --version >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "PYTHON_CMD=py -3.12"
    )
)

if not defined PYTHON_CMD (
    python3.12 --version >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        set "PYTHON_CMD=python3.12"
    )
)

if not defined PYTHON_CMD (
    for /f "tokens=2 delims= " %%v in ('python --version 2^>nul') do (
        echo %%v | findstr /b "3.12" >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            set "PYTHON_CMD=python"
        )
    )
)

if not defined PYTHON_CMD (
    echo [ERROR] Python 3.12 is required for ResumeIQ-py, but was not detected.
    echo         Please install Python 3.12 from https://www.python.org/downloads/
    echo         IMPORTANT: Check "Add python.exe to PATH" during installation.
    goto :fail
)

for /f "tokens=*" %%i in ('%PYTHON_CMD% --version 2^>^&1') do set "PY_VER_STR=%%i"
echo [INFO] Detected Python interpreter: %PY_VER_STR% (%PYTHON_CMD%)

@rem 5. Configuration check without exposing secrets
echo [INFO] Checking environment configuration...
if exist "%PROJECT_ROOT%backend\.env" (
    echo [OK] backend\.env found.
) else (
    echo [WARN] backend\.env was not found.
    echo        To configure Groq AI extraction and Firebase Authentication:
    echo        copy backend\.env.example backend\.env
    echo        and configure your credentials.
)

if exist "%PROJECT_ROOT%frontend\.env" (
    echo [OK] frontend\.env found.
) else (
    echo [WARN] frontend\.env was not found.
    echo        To configure Firebase client credentials and API base URL:
    echo        copy frontend\.env.example frontend\.env
)

@rem 6. MongoDB connectivity check
echo [INFO] Checking MongoDB availability on 127.0.0.1:27017...
set "MONGO_RUNNING=0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = New-Object System.Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1', 27017); exit 0 } catch { exit 1 } finally { $c.Close() }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "MONGO_RUNNING=1"
    echo [OK] MongoDB is active on port 27017 (Job discovery is ready).
) else (
    echo [WARN] MongoDB is NOT reachable on 127.0.0.1:27017.
    echo        Resume analysis, scoring, and role matching will work,
    echo        but database-backed job discovery will be unavailable.
    echo        To enable job discovery, ensure MongoDB Windows service is started.
)

@rem 7. Check ports 8000 and 5173 for conflicts or reusable ResumeIQ instances
set "BACKEND_REUSE=0"
set "FRONTEND_REUSE=0"

netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/' -UseBasicParsing -TimeoutSec 2; if ($r.Content -match 'ResumeIQ Backend API') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] Port 8000 is already running a healthy ResumeIQ backend. Reusing existing service.
        set "BACKEND_REUSE=1"
    ) else (
        echo [ERROR] Port 8000 is occupied by an unrelated application.
        echo         Please terminate the conflicting process or free port 8000 before running ResumeIQ.
        goto :fail
    )
)

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] Port 5173 is already running ResumeIQ frontend. Reusing existing service.
        set "FRONTEND_REUSE=1"
    ) else (
        echo [ERROR] Port 5173 is occupied by an unrelated application.
        echo         Please terminate the conflicting process or free port 5173 before running ResumeIQ.
        goto :fail
    )
)

if %BACKEND_REUSE% EQU 1 (
    if %FRONTEND_REUSE% EQU 1 (
        echo.
        echo =======================================================
        echo  Both ResumeIQ services are already running and healthy!
        echo    Frontend UI:      http://localhost:5173
        echo    Backend API:      http://127.0.0.1:8000
        echo    Interactive Docs: http://127.0.0.1:8000/docs
        echo =======================================================
        if not "%NO_BROWSER%"=="1" (
            start http://localhost:5173
        )
        goto :end_ok
    )
)

@rem 8. Setup/verify Python virtual environment
set "VENV_DIR=%PROJECT_ROOT%backend\.venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"

if not exist "%VENV_PYTHON%" (
    echo [INFO] Virtual environment not found. Creating backend\.venv using %PYTHON_CMD%...
    %PYTHON_CMD% -m venv "%VENV_DIR%"
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to create virtual environment in backend\.venv.
        goto :fail
    )
    echo [OK] Virtual environment created.
)

@rem 9. Verify and install backend dependencies if needed
echo [INFO] Verifying backend dependencies...
"%VENV_PYTHON%" -c "import fastapi, uvicorn, pydantic, pydantic_settings, groq, pymongo, fitz, docx" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Backend dependencies missing or incomplete.
    echo        Installing requirements (requires internet connection)...
    "%VENV_PYTHON%" -m pip install --no-input -r "%PROJECT_ROOT%backend\requirements.txt"
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install backend dependencies.
        goto :fail
    )
    echo [OK] Backend dependencies installed.
) else (
    echo [OK] Backend dependencies verified.
)

@rem 10. Verify and install frontend dependencies if needed
if not exist "%PROJECT_ROOT%frontend\node_modules" (
    echo [INFO] frontend\node_modules not found.
    echo        Installing frontend dependencies (requires internet connection)...
    cd /d "%PROJECT_ROOT%frontend"
    if exist "package-lock.json" (
        call npm ci
        if !ERRORLEVEL! NEQ 0 (
            call npm install
        )
    ) else (
        call npm install
    )
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies.
        cd /d "%PROJECT_ROOT%"
        goto :fail
    )
    cd /d "%PROJECT_ROOT%"
    echo [OK] Frontend dependencies installed.
) else (
    echo [OK] Frontend dependencies verified.
)

@rem 11. Launch services in separate windows
if %BACKEND_REUSE% EQU 0 (
    echo [INFO] Starting FastAPI backend on http://127.0.0.1:8000...
    start "ResumeIQ - Backend" cmd /k "cd /d ""%PROJECT_ROOT%backend"" && ""%VENV_PYTHON%"" -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
)

if %FRONTEND_REUSE% EQU 0 (
    echo [INFO] Starting React/Vite frontend on http://localhost:5173...
    start "ResumeIQ - Frontend" cmd /k "cd /d ""%PROJECT_ROOT%frontend"" && npm run dev -- --port 5173"
)

@rem 12. HTTP Service Readiness Polling (Max 35 seconds)
echo [INFO] Waiting for services to become ready...

if %BACKEND_REUSE% EQU 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i=1; $i -le 35; $i++) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/' -UseBasicParsing -TimeoutSec 1; if ($r.Content -match 'ResumeIQ Backend API') { $ready = $true; break } } catch {}; Start-Sleep -Seconds 1 }; if (-not $ready) { exit 1 }"
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Backend failed to respond on http://127.0.0.1:8000/ within 35 seconds.
        echo         Please check the "ResumeIQ - Backend" terminal window for error logs.
        goto :fail
    )
    echo [OK] Backend is healthy at http://127.0.0.1:8000/
)

if %FRONTEND_REUSE% EQU 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i=1; $i -le 35; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { $ready = $true; break } } catch {}; Start-Sleep -Seconds 1 }; if (-not $ready) { exit 1 }"
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Frontend failed to respond on http://localhost:5173/ within 35 seconds.
        echo         Please check the "ResumeIQ - Frontend" terminal window for error logs.
        goto :fail
    )
    echo [OK] Frontend is healthy at http://localhost:5173/
)

@rem 13. Open browser and display connection info
echo.
echo =======================================================
echo  ResumeIQ is ready!
echo.
echo    Frontend UI:        http://localhost:5173
echo    Backend API:        http://127.0.0.1:8000
echo    Interactive Docs:   http://127.0.0.1:8000/docs
echo.
echo  Backend and frontend are running in dedicated windows.
echo  Close those windows or press Ctrl+C in them to stop.
echo =======================================================

if not "%NO_BROWSER%"=="1" (
    start http://localhost:5173
)

goto :end_ok

:fail
echo.
echo [FAIL] Startup aborted due to errors listed above.
echo Press any key to close this window...
pause >nul
exit /b 1

:end_ok
endlocal
exit /b 0
