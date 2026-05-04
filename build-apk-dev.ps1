# Script para generar APK de DEV (flavor staging) de SplitSmart
# La app DEV tiene packageId com.cbalucas.splitsmart.staging → no pisa la producción
# El ícono tiene fondo azul para distinguirla visualmente
#
# Uso:
#   .\build-apk-dev.ps1          -> Genera APK DEV
#   .\build-apk-dev.ps1 -Copia   -> Genera APK DEV + copia de backup en Dropbox
param(
    [switch]$Copia
)

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BUILD DE SPLITSMART  ·  DEV / STAGING" -ForegroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# ─── Leer versión actual desde app.json ──────────────────────────────────────
$appJson     = Get-Content "app.json" | ConvertFrom-Json
$version     = $appJson.expo.version
$versionCode = $appJson.expo.android.versionCode

Write-Host "Version de la app:" -ForegroundColor Yellow
Write-Host "  versionName : $version-dev" -ForegroundColor White
Write-Host "  versionCode : $versionCode" -ForegroundColor White
Write-Host "  packageId   : com.cbalucas.splitsmart.staging`n" -ForegroundColor White

# ─── Ruta de backup (Dropbox) ────────────────────────────────────────────────
$copiaDirAPK = "C:\Users\cbalu\Dropbox\VsCode\SplitSmart APK"

# ─── Sincronizar android/app/build.gradle con app.json ───────────────────────
Write-Host "⚙️  Sincronizando build.gradle..." -ForegroundColor Yellow
$buildGradlePath = "android\app\build.gradle"
$buildGradle     = Get-Content $buildGradlePath -Raw
$buildGradle     = $buildGradle -replace 'versionCode \d+',      "versionCode $versionCode"
$buildGradle     = $buildGradle -replace 'versionName "[^"]*"',  "versionName `"$version`""
Set-Content $buildGradlePath $buildGradle -NoNewline
Write-Host "✅ build.gradle actualizado: versionCode=$versionCode, versionName=$version`n" -ForegroundColor Green

# ─── Timestamp para el nombre del archivo ────────────────────────────────────
$now   = Get-Date
$fecha = $now.ToString("ddMMyyyy")
$hora  = $now.ToString("HHmm")

# ─── Limpiar cache de CMake (evita 'unknown target' al cambiar de flavor) ────
Write-Host "🧹 Limpiando cache de CMake..." -ForegroundColor Yellow
$cxxDir = "android\app\.cxx"
if (Test-Path $cxxDir) {
    Remove-Item -Recurse -Force $cxxDir
    Write-Host "   .cxx eliminado`n" -ForegroundColor DarkGray
} else {
    Write-Host "   (no habia cache previo)`n" -ForegroundColor DarkGray
}

# ─── Build APK staging release ───────────────────────────────────────────────
Write-Host "Construyendo APK de DEV (staging release)..." -ForegroundColor Yellow
Write-Host "Esto puede tardar 3-5 minutos.`n" -ForegroundColor Gray

Push-Location android
.\gradlew.bat clean assembleStagingRelease --no-daemon
$apkOk = ($LASTEXITCODE -eq 0)
Pop-Location

# ─── Resultado ───────────────────────────────────────────────────────────────
if ($apkOk) {
    $apkDir  = "android\app\build\outputs\apk\staging\release"
    $apkFile = Get-ChildItem -Path $apkDir -Filter "*.apk" -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($apkFile) {
        $apkName = "DEV_SplitSmart_v${version}_${fecha}_${hora}.apk"
        $apkDest = Join-Path $apkFile.DirectoryName $apkName
        Copy-Item $apkFile.FullName $apkDest
        $sizeMB = [math]::Round((Get-Item $apkDest).Length / 1MB, 2)

        Write-Host "`n════ APK DEV GENERADO EXITOSAMENTE ════" -ForegroundColor Blue
        Write-Host "  Archivo   : $apkName" -ForegroundColor White
        Write-Host "  Ubicacion : $apkDest" -ForegroundColor White
        Write-Host "  Tamano    : $sizeMB MB" -ForegroundColor White
        Write-Host "  Version   : v$version-dev (build $versionCode)" -ForegroundColor White
        Write-Host "  PackageId : com.cbalucas.splitsmart.staging`n" -ForegroundColor White

        if ($Copia) {
            if (-not (Test-Path $copiaDirAPK)) { New-Item -ItemType Directory -Path $copiaDirAPK | Out-Null }
            $copiaAPK = Join-Path $copiaDirAPK $apkName
            Copy-Item $apkDest $copiaAPK
            Write-Host "  Copia APK guardada en : $copiaAPK`n" -ForegroundColor DarkCyan
        }

        Write-Host "Proximos pasos para instalar el APK DEV:" -ForegroundColor Cyan
        Write-Host "  1. La app DEV convive con la produccion (diferente packageId)" -ForegroundColor White
        Write-Host "  2. Icono con fondo azul para distinguirla visualmente" -ForegroundColor White
        Write-Host "  3. Transfiere el APK a tu dispositivo Android e instala`n" -ForegroundColor White

    } else {
        Write-Host "`nBuild exitoso pero no se encontro el archivo .apk." -ForegroundColor Red
        Write-Host "Busca manualmente en: $apkDir`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nError al generar el APK DEV." -ForegroundColor Red
    Write-Host "Causas comunes:" -ForegroundColor Cyan
    Write-Host "  - Falta ejecutar 'expo prebuild --platform android' si hay cambios en app.json" -ForegroundColor White
    Write-Host "  - Dependencias de Node no instaladas (ejecuta 'npm install')`n" -ForegroundColor White
}
