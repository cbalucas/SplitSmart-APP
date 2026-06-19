# Script unificado para generar APK y/o AAB de SplitSmart
# Uso:
#   .\build-all.ps1 -APK              -> Solo genera APK
#   .\build-all.ps1 -AAB              -> Solo genera AAB (Google Play)
#   .\build-all.ps1 -APK -AAB         -> Genera ambos
#   .\build-all.ps1 -APK -AAB -Copia  -> Genera ambos + copia de backup en Dropbox
param(
    [switch]$APK,
    [switch]$AAB,
    [switch]$Copia
)

# ─── Validar que se pasó al menos un modo ────────────────────────────────────
if (-not $APK -and -not $AAB) {
    Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  BUILD DE SPLITSMART" -ForegroundColor Green
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "`nError: Debes indicar al menos un tipo de build.`n" -ForegroundColor Red
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\build-all.ps1 -APK              # Solo genera APK" -ForegroundColor White
    Write-Host "  .\build-all.ps1 -AAB              # Solo genera AAB (Google Play)" -ForegroundColor White
    Write-Host "  .\build-all.ps1 -APK -AAB         # Genera ambos" -ForegroundColor White
    Write-Host "  .\build-all.ps1 -APK -AAB -Copia  # Genera ambos + copia de backup`n" -ForegroundColor White
    exit 1
}

$tiposBuild = @()
if ($APK) { $tiposBuild += "APK" }
if ($AAB) { $tiposBuild += "AAB" }
$tiposStr = $tiposBuild -join " + "

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BUILD DE SPLITSMART - $tiposStr" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# ─── Leer versión actual desde app.json ──────────────────────────────────────
$appJson     = Get-Content "app.json" | ConvertFrom-Json
$version     = $appJson.expo.version
$versionCode = $appJson.expo.android.versionCode

Write-Host "Version de la app:" -ForegroundColor Yellow
Write-Host "  versionName : $version" -ForegroundColor White
Write-Host "  versionCode : $versionCode`n" -ForegroundColor White

# ─── Rutas de backup (Dropbox) ───────────────────────────────────────────────
$copiaDirAPK = "C:\Users\cbalu\Dropbox\VsCode\SplitSmart APK"
$copiaDirAAB = "C:\Users\cbalu\Dropbox\VsCode\SplitSmart AAB"

# ─── Verificar / Crear keystore de release (solo para AAB) ───────────────────
if ($AAB) {
    $keystoreFile    = "android\app\splitsmart-release-key.keystore"
    $keyAlias        = "splitsmart-key"
    $gradlePropsPath = "android\gradle.properties"

    $gradlePropsContent = Get-Content $gradlePropsPath -Raw -ErrorAction SilentlyContinue
    $keystoreConfigured = $gradlePropsContent -match "MYAPP_UPLOAD_STORE_FILE"
    $keystoreExists     = Test-Path $keystoreFile

    if (-not $keystoreConfigured -or -not $keystoreExists) {

        Write-Host "════ CONFIGURACION DE KEYSTORE ════" -ForegroundColor Magenta
        Write-Host "No se encontro un keystore de release. Se creara uno nuevo.`n" -ForegroundColor Yellow
        Write-Host "IMPORTANTE: Guarda la contrasena en un lugar seguro." -ForegroundColor Red
        Write-Host "Si la pierdes no podras publicar actualizaciones de la app.`n" -ForegroundColor Red

        $keytoolCmd = Get-Command keytool -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
        if (-not $keytoolCmd) {
            $candidatos = @(
                "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
                "C:\Program Files\Android\Android Studio\jre\bin\keytool.exe",
                "$env:JAVA_HOME\bin\keytool.exe",
                "$env:ANDROID_STUDIO_HOME\jbr\bin\keytool.exe"
            )
            foreach ($c in $candidatos) {
                if (Test-Path $c) { $keytoolCmd = $c; break }
            }
        }
        if (-not $keytoolCmd) {
            Write-Host "`nError: No se encontro 'keytool'." -ForegroundColor Red
            Write-Host "Asegurate de que Android Studio este instalado." -ForegroundColor Yellow
            Write-Host "Ruta buscada: C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -ForegroundColor Gray
            exit 1
        }
        Write-Host "keytool encontrado en: $keytoolCmd`n" -ForegroundColor DarkGray

        $storePassSecure = Read-Host "Contrasena del keystore (min 6 caracteres)" -AsSecureString
        $keyPassSecure   = Read-Host "Contrasena de la clave (puede ser la misma)" -AsSecureString

        $bstrStore = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassSecure)
        $storePass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstrStore)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrStore)

        $bstrKey = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassSecure)
        $keyPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstrKey)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrKey)

        if ($storePass.Length -lt 6) {
            Write-Host "`nError: La contrasena debe tener al menos 6 caracteres." -ForegroundColor Red
            exit 1
        }

        Write-Host "`nGenerando keystore..." -ForegroundColor Green
        $dname = "CN=SplitSmart, OU=Mobile, O=cbalucas, L=Buenos Aires, ST=Buenos Aires, C=AR"
        & $keytoolCmd -genkey -v `
            -keystore $keystoreFile `
            -alias $keyAlias `
            -keyalg RSA `
            -keysize 2048 `
            -validity 10000 `
            -storepass $storePass `
            -keypass $keyPass `
            -dname $dname 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host "`nError al generar el keystore." -ForegroundColor Red
            exit 1
        }

        $signingBlock = @"

# ── Firma de release para Google Play Store (NO subir a git) ──────────────────
MYAPP_UPLOAD_STORE_FILE=splitsmart-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=$keyAlias
MYAPP_UPLOAD_STORE_PASSWORD=$storePass
MYAPP_UPLOAD_KEY_PASSWORD=$keyPass
"@
        Add-Content -Path $gradlePropsPath -Value $signingBlock
        Write-Host "`nKeystore creado y configurado correctamente." -ForegroundColor Green
        Write-Host "Archivo: $keystoreFile`n" -ForegroundColor White

        $storePass = $null
        $keyPass   = $null

    } else {
        Write-Host "Keystore de release encontrado. Continuando con la firma existente.`n" -ForegroundColor Green
    }
}

# ─── Sincronizar android/app/build.gradle con app.json ───────────────────────
Write-Host "⚙️  Sincronizando build.gradle..." -ForegroundColor Yellow
$buildGradlePath = "android\app\build.gradle"
$buildGradle     = Get-Content $buildGradlePath -Raw
$buildGradle     = $buildGradle -replace 'versionCode \d+',      "versionCode $versionCode"
$buildGradle     = $buildGradle -replace 'versionName "[^"]*"',  "versionName `"$version`""
Set-Content $buildGradlePath $buildGradle -NoNewline
Write-Host "✅ build.gradle actualizado: versionCode=$versionCode, versionName=$version`n" -ForegroundColor Green

# ─── Timestamp compartido para los nombres de archivo ────────────────────────
$now   = Get-Date
$fecha = $now.ToString("ddMMyyyy")
$hora  = $now.ToString("HHmm")

Push-Location android

# ─── Build AAB ───────────────────────────────────────────────────────────────
$aabOk = $false
if ($AAB) {
    Write-Host "Construyendo Android App Bundle (.aab)..." -ForegroundColor Yellow
    Write-Host "Esto puede tardar 5-10 minutos la primera vez.`n" -ForegroundColor Gray
    .\gradlew.bat bundleProductionRelease --no-daemon
    $aabOk = ($LASTEXITCODE -eq 0)
}

# ─── Build APK ───────────────────────────────────────────────────────────────
$apkOk = $false
if ($APK) {
    Write-Host "Construyendo APK de release..." -ForegroundColor Yellow
    Write-Host "Esto puede tardar 3-5 minutos.`n" -ForegroundColor Gray
    .\gradlew.bat assembleRelease --no-daemon
    $apkOk = ($LASTEXITCODE -eq 0)
}

Pop-Location

# ─── Resultado AAB ───────────────────────────────────────────────────────────
if ($AAB) {
    if ($aabOk) {
        $aabSource = "android\app\build\outputs\bundle\productionRelease\app-production-release.aab"
        if (Test-Path $aabSource) {
            $aabName   = "SplitSmart_v${version}_${fecha}_${hora}.aab"
            $aabDestDir = "android\app\build\outputs\bundle\productionRelease"
            $aabDest   = Join-Path $aabDestDir $aabName
            Copy-Item $aabSource $aabDest
            $sizeMB = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)

            Write-Host "`n════ AAB GENERADO EXITOSAMENTE ════" -ForegroundColor Green
            Write-Host "  Archivo   : $aabName" -ForegroundColor White
            Write-Host "  Ubicacion : $aabDest" -ForegroundColor White
            Write-Host "  Tamano    : $sizeMB MB" -ForegroundColor White
            Write-Host "  Version   : v$version (build $versionCode)`n" -ForegroundColor White

            if ($Copia) {
                if (-not (Test-Path $copiaDirAAB)) { New-Item -ItemType Directory -Path $copiaDirAAB | Out-Null }
                $copiaAAB = Join-Path $copiaDirAAB $aabName
                Copy-Item $aabDest $copiaAAB
                Write-Host "  Copia AAB guardada en : $copiaAAB`n" -ForegroundColor DarkCyan
            }

            Write-Host "Proximos pasos para publicar en Google Play:" -ForegroundColor Cyan
            Write-Host "  1. Abre Google Play Console -> play.google.com/console" -ForegroundColor White
            Write-Host "  2. Ve a 'Produccion' y crea nueva version" -ForegroundColor White
            Write-Host "  3. Sube el archivo .aab y envia a revision`n" -ForegroundColor White

            Write-Host "RECORDATORIO: Haz un backup del keystore:" -ForegroundColor Magenta
            Write-Host "  android\app\splitsmart-release-key.keystore`n" -ForegroundColor Yellow

            # ─── Actualizar latest-version.json y push a GitHub ──────────────
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkCyan
            Write-Host "  Actualizar latest-version.json en GitHub" -ForegroundColor Cyan
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkCyan
            $versionJsonPath = "latest-version.json"
            $versionJson = Get-Content $versionJsonPath | ConvertFrom-Json
            $versionJson.version = $version
            $versionJson | ConvertTo-Json -Depth 10 | Set-Content $versionJsonPath -Encoding UTF8
            Write-Host "  latest-version.json actualizado a v$version" -ForegroundColor Green

            $gitCheck = git status --porcelain $versionJsonPath 2>&1
            if ($gitCheck) {
                git add $versionJsonPath
                git commit -m "chore: bump latest-version.json to v$version"
                git push
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  GitHub actualizado correctamente (v$version)`n" -ForegroundColor Green
                } else {
                    Write-Host "  AVISO: git push fallo. Ejecutalo manualmente antes de publicar en Play Store.`n" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  (ya estaba en v$version, sin cambios para commitear)`n" -ForegroundColor DarkGray
            }
            # ─────────────────────────────────────────────────────────────────

        } else {
            Write-Host "`nBuild AAB exitoso pero no se encontro el archivo en la ruta esperada." -ForegroundColor Red
            Write-Host "Busca manualmente en: android\app\build\outputs\bundle\productionRelease\`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`nError al generar el AAB." -ForegroundColor Red
        Write-Host "Causas comunes:" -ForegroundColor Cyan
        Write-Host "  - Contrasena del keystore incorrecta en gradle.properties" -ForegroundColor White
        Write-Host "  - Falta ejecutar 'expo prebuild' si hay cambios en app.json" -ForegroundColor White
        Write-Host "  - Dependencias de Node no instaladas (ejecuta 'npm install')`n" -ForegroundColor White
    }
}

# ─── Resultado APK ───────────────────────────────────────────────────────────
if ($APK) {
    if ($apkOk) {
        $apkFile = Get-ChildItem -Path "android\app\build\outputs\apk\production\release" -Filter "*.apk" | Select-Object -First 1
        if ($apkFile) {
            $apkName = "SplitSmart_v${version}_${fecha}_${hora}.apk"
            $apkDest = Join-Path $apkFile.DirectoryName $apkName
            Copy-Item $apkFile.FullName $apkDest
            $sizeMB = [math]::Round((Get-Item $apkDest).Length / 1MB, 2)

            Write-Host "`n════ APK GENERADO EXITOSAMENTE ════" -ForegroundColor Green
            Write-Host "  Archivo   : $apkName" -ForegroundColor White
            Write-Host "  Ubicacion : $apkDest" -ForegroundColor White
            Write-Host "  Tamano    : $sizeMB MB" -ForegroundColor White
            Write-Host "  Version   : v$version (build $versionCode)`n" -ForegroundColor White

            if ($Copia) {
                if (-not (Test-Path $copiaDirAPK)) { New-Item -ItemType Directory -Path $copiaDirAPK | Out-Null }
                $copiaAPK = Join-Path $copiaDirAPK $apkName
                Copy-Item $apkDest $copiaAPK
                Write-Host "  Copia APK guardada en : $copiaAPK`n" -ForegroundColor DarkCyan
            }

            Write-Host "Proximos pasos para instalar el APK:" -ForegroundColor Cyan
            Write-Host "  1. Transfiere el APK a tu dispositivo Android" -ForegroundColor White
            Write-Host "  2. Instala habilitando 'Fuentes desconocidas' si es necesario`n" -ForegroundColor White

        } else {
            Write-Host "`nBuild APK exitoso pero no se encontro el archivo .apk." -ForegroundColor Red
            Write-Host "Busca manualmente en: android\app\build\outputs\apk\production\release\`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`nError al generar el APK." -ForegroundColor Red
        Write-Host "Revisa los logs arriba para mas detalles.`n" -ForegroundColor Yellow
    }
}
