@echo off
rem iFINITY AgentZ MCP launcher (Windows).
rem
rem Claude hosts resolve the MCP `command` against the Windows PATH (they do NOT
rem inject its bundled Git Bash), so a bare `sh` command dies with `spawn sh
rem ENOENT` before any shell script can run. This .cmd is the Windows entry
rem point: it runs dist\index.js with the current iFINITY AgentZ desktop app's
rem bundled Electron via ELECTRON_RUN_AS_NODE=1. An explicit developer override
rem or a standalone Node on PATH remains available when AgentZ is not installed.
rem
rem `@echo off` is required: the MCP protocol owns stdout, so command echoing
rem must be suppressed. All diagnostics go to stderr.

setlocal enableextensions enabledelayedexpansion

rem dist\index.js sits one level up from this servers\ folder.
set "ENTRY=%~dp0..\dist\index.js"

rem 1) Explicit override (developer / packaged-runtime escape hatch).
if defined AGENTZ_NODE if exist "%AGENTZ_NODE%" (
  set "ELECTRON_RUN_AS_NODE=1"
  "%AGENTZ_NODE%" "%ENTRY%"
  exit /b !errorlevel!
)

rem 2) Runtime pointer written by the iFINITY AgentZ Hub on startup. The Hub
rem    writes forward slashes, so normalize to backslashes before use.
set "POINTER=%USERPROFILE%\.ifinity-agentz\node-runtime"
if exist "%POINTER%" (
  set /p RUNTIME=<"%POINTER%"
  if defined RUNTIME (
    set "RUNTIME=!RUNTIME:/=\!"
    if exist "!RUNTIME!" (
      set "ELECTRON_RUN_AS_NODE=1"
      "!RUNTIME!" "%ENTRY%"
      exit /b !errorlevel!
    )
  )
)

rem 3) Known per-user Hub install location.
set "HUB=%LOCALAPPDATA%\Programs\@ifinitycompanion\iFINITY AgentZ.exe"
if exist "%HUB%" (
  set "ELECTRON_RUN_AS_NODE=1"
  "%HUB%" "%ENTRY%"
  exit /b !errorlevel!
)

rem 4) A real Node on PATH is a developer fallback. Normal users must run the
rem    plugin with the current runtime supplied by AgentZ so an unrelated local
rem    Node version cannot bypass the plugin's OS trust-store support.
where node >nul 2>nul
if !errorlevel! == 0 (
  node "%ENTRY%"
  exit /b !errorlevel!
)

>&2 echo [agentz-mcp] Cannot start: no Node runtime found and the iFINITY AgentZ desktop app was not located. Open or install iFINITY AgentZ (https://ifinityagentz.co.uk), or install Node.js.
exit /b 1
