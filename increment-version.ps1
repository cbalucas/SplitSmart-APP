# Script para incrementar versión de SplitSmart
# Uso: .\increment-version.ps1 [major|minor|patch]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('major','minor','patch')]
    [string]$type = 'patch'
)

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 INCREMENTAR VERSIÓN DE SPLITSMART" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# Leer versión actual de app.json
$appJsonPath = "app.json"
$appJson = Get-Content $appJsonPath | ConvertFrom-Json

$currentVersion = $appJson.expo.version
$currentVersionCode = $appJson.expo.android.versionCode

Write-Host "📱 Versión actual:" -ForegroundColor Yellow
Write-Host "  versionName: $currentVersion" -ForegroundColor White
Write-Host "  versionCode: $currentVersionCode`n" -ForegroundColor White

# Parsear versión
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Incrementar según tipo
switch ($type) {
    'major' {
        $major++
        $minor = 0
        $patch = 0
    }
    'minor' {
        $minor++
        $patch = 0
    }
    'patch' {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
$newVersionCode = $currentVersionCode + 1

Write-Host "🆕 Nueva versión:" -ForegroundColor Green
Write-Host "  versionName: $newVersion" -ForegroundColor White
Write-Host "  versionCode: $newVersionCode`n" -ForegroundColor White

# Actualizar app.json
$appJson.expo.version = $newVersion
$appJson.expo.android.versionCode = $newVersionCode
$appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath

Write-Host "✅ app.json actualizado" -ForegroundColor Green

# Actualizar build.gradle
$buildGradlePath = "android\app\build.gradle"
$buildGradle = Get-Content $buildGradlePath -Raw

$buildGradle = $buildGradle -replace "versionCode \d+", "versionCode $newVersionCode"
$buildGradle = $buildGradle -replace 'versionName "[^"]+"', "versionName `"$newVersion`""

Set-Content $buildGradlePath $buildGradle

Write-Host "✅ build.gradle actualizado" -ForegroundColor Green

Write-Host "`n📋 Cambios realizados:" -ForegroundColor Yellow
Write-Host "  Tipo de incremento: $type" -ForegroundColor White
Write-Host "  $currentVersion → $newVersion" -ForegroundColor Cyan
Write-Host "  versionCode $currentVersionCode → $newVersionCode" -ForegroundColor Cyan

Write-Host "`n🚀 Para generar el APK ejecuta:" -ForegroundColor Yellow
Write-Host "  cd android" -ForegroundColor White
Write-Host "  .\gradlew.bat assembleRelease`n" -ForegroundColor White

Write-Host "📦 El APK se llamará: SplitSmart-v$newVersion-release.apk`n" -ForegroundColor Green
