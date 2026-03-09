# Script para generar AAB de SplitSmart - Listo para Google Play Store
# Uso: .\build-aab.ps1 [-Copia]
param([switch]$Copia)

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GENERAR AAB DE SPLITSMART (Google Play)" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# ─── Leer versión actual ─────────────────────────────────────────────────────
$appJson      = Get-Content "app.json" | ConvertFrom-Json
$version      = $appJson.expo.version
$versionCode  = $appJson.expo.android.versionCode

Write-Host "Version de la app:" -ForegroundColor Yellow
Write-Host "  versionName : $version" -ForegroundColor White
Write-Host "  versionCode : $versionCode`n" -ForegroundColor White

# ─── Rutas ───────────────────────────────────────────────────────────────────
$keystoreFile     = "android\app\splitsmart-release-key.keystore"
$keyAlias         = "splitsmart-key"
$gradlePropsPath  = "android\gradle.properties"

# ─── Directorio de copia (backup) ────────────────────────────────────────────
$copiaDir = "C:\APPs\SplitSmart-APP\app_aab_apk\aab"
# ─────────────────────────────────────────────────────────────────────────────

# ─── Verificar / Crear keystore de release ───────────────────────────────────
$gradlePropsContent = Get-Content $gradlePropsPath -Raw -ErrorAction SilentlyContinue
$keystoreConfigured = $gradlePropsContent -match "MYAPP_UPLOAD_STORE_FILE"
$keystoreExists     = Test-Path $keystoreFile

if (-not $keystoreConfigured -or -not $keystoreExists) {

    Write-Host "════ CONFIGURACION DE KEYSTORE ════" -ForegroundColor Magenta
    Write-Host "No se encontro un keystore de release. Se creara uno nuevo.`n" -ForegroundColor Yellow
    Write-Host "IMPORTANTE: Guarda la contrasena en un lugar seguro." -ForegroundColor Red
    Write-Host "Si la pierdes no podras publicar actualizaciones de la app.`n" -ForegroundColor Red

    # ── Buscar keytool (PATH o rutas conocidas de Android Studio / JDK) ──────
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

    # Solicitar contraseñas
    $storePassSecure = Read-Host "Contrasena del keystore (min 6 caracteres)" -AsSecureString
    $keyPassSecure   = Read-Host "Contrasena de la clave (puede ser la misma)" -AsSecureString

    # Convertir a texto plano para keytool y gradle.properties
    $bstrStore  = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassSecure)
    $storePass  = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstrStore)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrStore)

    $bstrKey  = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassSecure)
    $keyPass  = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstrKey)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrKey)

    if ($storePass.Length -lt 6) {
        Write-Host "`nError: La contrasena debe tener al menos 6 caracteres." -ForegroundColor Red
        exit 1
    }

    Write-Host "`nGenerando keystore..." -ForegroundColor Green

    # Generar keystore con keytool
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

    # Agregar configuracion a gradle.properties
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

    # Limpiar variables sensibles
    $storePass = $null
    $keyPass   = $null

} else {
    Write-Host "Keystore de release encontrado. Continuando con la firma existente.`n" -ForegroundColor Green
}

# ─── Construir el AAB ────────────────────────────────────────────────────────
Write-Host "Construyendo Android App Bundle (.aab)..." -ForegroundColor Yellow
Write-Host "Esto puede tardar 5-10 minutos la primera vez.`n" -ForegroundColor Gray

Push-Location android
.\gradlew.bat bundleRelease --no-daemon
$buildResult = $LASTEXITCODE
Pop-Location

# ─── Resultado ───────────────────────────────────────────────────────────────
if ($buildResult -eq 0) {

    $aabSource = "android\app\build\outputs\bundle\release\app-release.aab"

    if (Test-Path $aabSource) {
        $now     = Get-Date
        $fecha   = $now.ToString("ddMMyyyy")
        $hora    = $now.ToString("HHmm")
        $newName = "SplitSmart_v${version}_${fecha}_${hora}.aab"
        $destDir = "android\app\build\outputs\bundle\release"
        $newPath = Join-Path $destDir $newName

        Copy-Item $aabSource $newPath

        $sizeMB = [math]::Round((Get-Item $newPath).Length / 1MB, 2)

        Write-Host "`n════ AAB GENERADO EXITOSAMENTE ════" -ForegroundColor Green
        Write-Host "  Archivo   : $newName" -ForegroundColor White
        Write-Host "  Ubicacion : $newPath" -ForegroundColor White
        Write-Host "  Tamano    : $sizeMB MB" -ForegroundColor White
        Write-Host "  Version   : v$version (build $versionCode)`n" -ForegroundColor White

        # Copia de backup en directorio configurado (solo si se pasa -Copia)
        if ($Copia) {
            if (-not (Test-Path $copiaDir)) {
                New-Item -ItemType Directory -Path $copiaDir | Out-Null
            }
            $copiaPath = Join-Path $copiaDir $newName
            Copy-Item $newPath $copiaPath
            Write-Host "  Copia guardada en : $copiaPath`n" -ForegroundColor DarkCyan
        }

        Write-Host "Proximos pasos para publicar en Google Play:" -ForegroundColor Cyan
        Write-Host "  1. Abre Google Play Console  -> play.google.com/console" -ForegroundColor White
        Write-Host "  2. Crea o selecciona tu app" -ForegroundColor White
        Write-Host "  3. Ve a 'Produccion' (o 'Pruebas internas' para la primera vez)" -ForegroundColor White
        Write-Host "  4. Crea nueva version y sube el archivo .aab" -ForegroundColor White
        Write-Host "  5. Completa descripcion, capturas y envia a revision`n" -ForegroundColor White

        Write-Host "RECORDATORIO: Haz un backup del archivo keystore:" -ForegroundColor Magenta
        Write-Host "  $keystoreFile`n" -ForegroundColor Yellow

    } else {
        Write-Host "`nEl build fue exitoso pero no se encontro el archivo .aab en la ruta esperada." -ForegroundColor Red
        Write-Host "Busca manualmente en: android\app\build\outputs\bundle\" -ForegroundColor Yellow
    }

} else {
    Write-Host "`nError al generar el AAB." -ForegroundColor Red
    Write-Host "Revisa los logs arriba para mas detalles." -ForegroundColor Yellow
    Write-Host "`nCausas comunes:" -ForegroundColor Cyan
    Write-Host "  - Contrasena del keystore incorrecta en gradle.properties" -ForegroundColor White
    Write-Host "  - Falta ejecutar 'expo prebuild' si hay cambios en app.json" -ForegroundColor White
    Write-Host "  - Dependencias de Node no instaladas (ejecuta 'npm install')" -ForegroundColor White
}
