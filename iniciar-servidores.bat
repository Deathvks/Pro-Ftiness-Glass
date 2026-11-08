@echo off
title Pro Fitness Glass - Servidores Locales
echo ===================================================
echo   Iniciando Base de Datos MySQL y Servidor Backend
echo ===================================================
echo.

:: Comprobar si se ejecuta como Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Solicitando permisos de Administrador para iniciar MySQL...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Iniciar servicio MySQL si esta detenido
echo [*] Comprobando servicio MySQL (MYSQL80)...
sc query MYSQL80 | find "RUNNING" >nul 2>&1
if %errorLevel% neq 0 (
    echo [*] Iniciando servicio MYSQL80...
    net start MYSQL80
) else (
    echo [OK] MySQL ya esta en ejecucion.
)

echo.
echo [*] Iniciando Backend en http://192.168.0.58:3001 ...
cd /d "%~dp0backend"
npm run dev
