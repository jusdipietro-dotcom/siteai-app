@echo off
title Facturacion ARCA
echo ========================================
echo   SISTEMA DE FACTURACION ARCA
echo   http://localhost:5000
echo ========================================
echo.
cd /d "%~dp0"
set PATH=%PATH%;C:\Program Files\Git\mingw64\bin

:: Cargar variables de entorno desde .env
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%a"=="#" set "%%a=%%b"
    )
)

venv\Scripts\python app.py
pause
