@echo off
chcp 65001 >nul
title Gestion Fiscale — Travailleur Autonome
cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   Gestion Fiscale — Travailleur Autonome (Quebec)       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Verifie si Node est installe
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js n'est pas installe.
    echo    Telecharge-le depuis : https://nodejs.org/fr/download
    echo.
    pause
    exit /b 1
)

REM Premier lancement : configurer la base si dev.db absent
if not exist "backend\prisma\dev.db" (
    echo Premier lancement detecte. Configuration en cours...
    echo.
    call npm install
    call npm run quickstart
    if errorlevel 1 (
        echo.
        echo ❌ Erreur durant la configuration.
        pause
        exit /b 1
    )
)

REM Ouvre le navigateur apres 8 secondes (le temps que les serveurs demarrent)
start "" /b cmd /c "timeout /t 8 >nul && start http://localhost:3000"

echo Lancement de l'application...
echo.
echo  → Frontend : http://localhost:3000 (le navigateur s'ouvre automatiquement)
echo  → Backend  : http://localhost:4000/api
echo.
echo  Pour arreter : ferme cette fenetre ou Ctrl+C.
echo.

call npm run dev
