# Script para generar APK de SplitSmart
# Uso: .\build-apk.ps1

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 GENERAR APK DE SPLITSMART" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# Leer versión actual
$appJson = Get-Content "app.json" | ConvertFrom-Json
$version = $appJson.expo.version
$versionCode = $appJson.expo.android.versionCode

Write-Host "📱 Generando APK versión:" -ForegroundColor Yellow
Write-Host "  versionName: $version" -ForegroundColor White
Write-Host "  versionCode: $versionCode`n" -ForegroundColor White

# Cambiar a directorio android
Push-Location android

Write-Host "⏱️  Esto tomará 3-5 minutos...`n" -ForegroundColor Gray

# Ejecutar build
.\gradlew.bat assembleRelease --no-daemon

if ($LASTEXITCODE -eq 0) {
    Pop-Location
    
    Write-Host "`n✅ ¡APK generado exitosamente!`n" -ForegroundColor Green
    
    # Buscar el APK generado
    $apkPath = Get-ChildItem -Path "android\app\build\outputs\apk\release" -Filter "*.apk" | Select-Object -First 1
    
    if ($apkPath) {
        $size = [math]::Round($apkPath.Length / 1MB, 2)
        Write-Host "📦 APK generado:" -ForegroundColor Yellow
        Write-Host "  Archivo: $($apkPath.Name)" -ForegroundColor White
        Write-Host "  Ubicación: $($apkPath.FullName)" -ForegroundColor White
        Write-Host "  Tamaño: $size MB" -ForegroundColor White
        Write-Host "  Versión: v$version (build $versionCode)`n" -ForegroundColor White
        
        Write-Host "📲 Siguiente paso:" -ForegroundColor Cyan
        Write-Host "  1. Transfiere el APK a tu dispositivo Android" -ForegroundColor White
        Write-Host "  2. Instala el APK" -ForegroundColor White
        Write-Host "  3. Prueba la aplicación`n" -ForegroundColor White
    }
} else {
    Pop-Location
    Write-Host "`n❌ Error al generar el APK" -ForegroundColor Red
    Write-Host "Revisa los logs arriba para más detalles`n" -ForegroundColor Yellow
}
