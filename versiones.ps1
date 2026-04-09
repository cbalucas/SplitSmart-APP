# versiones.ps1 — Gestión de versiones SplitSmart
# Uso: .\versiones.ps1
#
# PARTE 1 → Actualiza PENDING_CHANGES.md con nuevos cambios (features, fixes, mejoras, archivos)
# PARTE 2 → Pregunta si incrementar version. Si SI, actualiza TODOS los archivos del proyecto.

# ─── Rutas ───────────────────────────────────────────────────────────────────
$pendingPath     = "PENDING_CHANGES.md"
$appJsonPath     = "app.json"
$packagePath     = "package.json"
$buildGradlePath = "android\app\build.gradle"
$changelogPath   = "CHANGELOG.md"
$profilePath     = "src\screens\ProfileScreen\index.tsx"

# ─── Helper: calcular nueva versión semver ────────────────────────────────────
function Get-BumpedVersion {
    param([string]$current, [string]$tipo)
    $p = $current -split '\.'
    $ma = [int]$p[0]; $mi = [int]$p[1]; $pa = [int]$p[2]
    switch ($tipo) {
        'patch' { $pa++ }
        'minor' { $mi++; $pa = 0 }
        'major' { $ma++; $mi = 0; $pa = 0 }
    }
    return "$ma.$mi.$pa"
}

# ─── Helper: agregar items a una sección del PENDING_CHANGES ─────────────────
function Add-ItemsToSection {
    param(
        [System.Collections.ArrayList]$lines,
        [string]$header,
        [string[]]$newItems,
        [string]$prefix = "- "
    )
    if (-not $newItems -or $newItems.Count -eq 0) { return }

    $headerIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match [regex]::Escape($header)) { $headerIdx = $i; break }
    }
    if ($headerIdx -lt 0) { return }

    $placeholderIdx = -1
    $endIdx = $lines.Count
    for ($j = $headerIdx + 1; $j -lt $lines.Count; $j++) {
        if ($lines[$j] -match '^### |^---$') { $endIdx = $j; break }
        if ($lines[$j] -match '_\(ninguna?( aún)?\)_') { $placeholderIdx = $j }
    }

    if ($placeholderIdx -ge 0) {
        $lines[$placeholderIdx] = "$prefix$($newItems[0])"
        for ($k = 1; $k -lt $newItems.Count; $k++) {
            $lines.Insert($placeholderIdx + $k, "$prefix$($newItems[$k])")
        }
    } else {
        $insertPos = $endIdx - 1
        while ($insertPos -gt $headerIdx -and $lines[$insertPos] -match '^\s*$') { $insertPos-- }
        $insertPos++
        for ($k = $newItems.Count - 1; $k -ge 0; $k--) {
            $lines.Insert($insertPos, "$prefix$($newItems[$k])")
        }
    }
}

# ─── Helper: extraer items de una sección del markdown ───────────────────────
function Get-SectionItems {
    param([string]$content, [string]$sectionTitle)
    $escaped = [regex]::Escape($sectionTitle)
    $m = [regex]::Match($content, "$escaped\s*\r?\n([\s\S]*?)(?=\r?\n###|\r?\n---|\z)")
    if (-not $m.Success) { return @() }
    return @($m.Groups[1].Value -split '\r?\n' | Where-Object { $_ -match '^\s*- ' } | ForEach-Object { $_.Trim() })
}

# ─── Helper: limpiar texto de markdown para ProfileScreen ────────────────────
function Convert-ToProfileText {
    param([string]$text)
    $t = $text -replace '^-\s*[✅✨🚀🔧⚙️]?\s*', ''       # bullet + emoji
    $t = $t -replace '\*\*([^*]+)\*\*', '$1'               # **bold**
    $t = $t -replace '`[^`]+`', ''                          # `inline code`
    $t = $t -replace '\s*\([^)]*\)\s*:.*$', ''             # (file.tsx): detalles
    $t = $t -replace '\s*:.*$', ''                          # : detalles restantes
    $t = $t -replace '\s*—\s*', ': '                        # Context — Desc → Context: Desc
    $t = $t -replace '\s+', ' '
    $t = $t.Trim()
    if ($t.Length -gt 90) { $t = $t.Substring(0, 87) + '...' }
    return $t
}

# ─── Leer versión actual ──────────────────────────────────────────────────────
$appJson = Get-Content $appJsonPath | ConvertFrom-Json
$curVer  = $appJson.expo.version
$curCode = $appJson.expo.android.versionCode

# ═════════════════════════════════════════════════════════════════════════════
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GESTION DE VERSIONES — SplitSmart" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n  Version actual : v$curVer  (versionCode: $curCode)`n" -ForegroundColor Yellow

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 1 — REVISAR PENDING_CHANGES.md  (Git + Copilot)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "════ PASO 1: Revisión de cambios pendientes ════`n" -ForegroundColor Magenta

# — Resumen de git ────────────────────────────────────────────────────────────
$gitAvail = $null -ne (Get-Command git -ErrorAction SilentlyContinue)
if ($gitAvail) {
    Write-Host "📋 Últimos commits:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray
    git log --oneline -15 2>$null | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""

    $gitStat = git diff --stat HEAD 2>$null
    if (-not $gitStat) { $gitStat = git status --short 2>$null }
    if ($gitStat) {
        Write-Host "📁 Archivos con cambios:" -ForegroundColor Cyan
        $gitStat | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        Write-Host ""
    }
} else {
    Write-Host "  (git no disponible en este entorno)`n" -ForegroundColor DarkGray
}

# — Estado actual de PENDING_CHANGES ─────────────────────────────────────────
Write-Host "📄 PENDING_CHANGES.md actual:" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray
Get-Content $pendingPath | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "─────────────────────────────────────────`n" -ForegroundColor DarkGray

# — Instrucción para Copilot ──────────────────────────────────────────────────
Write-Host "  💡 Abrí Copilot Chat en VS Code y pedile:" -ForegroundColor Cyan
Write-Host "     Analizá el git log y actualizá PENDING_CHANGES.md" -ForegroundColor White
Write-Host "     con features, fixes y mejoras de esta sesión." -ForegroundColor White
Write-Host "     Copilot editará el archivo directamente.`n" -ForegroundColor White

Read-Host "  → Presioná Enter cuando PENDING_CHANGES.md esté listo"
Write-Host ""

# — Mostrar PENDING_CHANGES actualizado ───────────────────────────────────────
Write-Host "📄 PENDING_CHANGES.md (actualizado):" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray
Get-Content $pendingPath | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host "─────────────────────────────────────────`n" -ForegroundColor DarkGray

# — ¿Agregar items manualmente? ───────────────────────────────────────────────
$modPending = (Read-Host "¿Querés agregar algo manualmente? (S/N)").Trim()
if ($modPending -match '^[Ss]') {
    $newFeatures = [System.Collections.ArrayList]@()
    $newFixes    = [System.Collections.ArrayList]@()
    $newMejoras  = [System.Collections.ArrayList]@()
    $newArchivos = [System.Collections.ArrayList]@()

    Write-Host "`nNuevas FUNCIONALIDADES — Enter vacío para continuar:" -ForegroundColor Cyan
    do {
        $item = (Read-Host "  Feature").Trim()
        if ($item -ne '') { [void]$newFeatures.Add("✨ $item") }
    } while ($item -ne '')

    Write-Host "`nCORRECCIONES de bugs — Enter vacío para continuar:" -ForegroundColor Cyan
    do {
        $item = (Read-Host "  Fix").Trim()
        if ($item -ne '') { [void]$newFixes.Add("✅ $item") }
    } while ($item -ne '')

    Write-Host "`nMEJORAS — Enter vacío para continuar:" -ForegroundColor Cyan
    do {
        $item = (Read-Host "  Mejora").Trim()
        if ($item -ne '') { [void]$newMejoras.Add($item) }
    } while ($item -ne '')

    Write-Host "`nARCHIVOS modificados — Enter vacío para continuar:" -ForegroundColor Cyan
    do {
        $item = (Read-Host "  Archivo").Trim()
        if ($item -ne '') { [void]$newArchivos.Add("``$item``") }
    } while ($item -ne '')

    $totalNew = $newFeatures.Count + $newFixes.Count + $newMejoras.Count + $newArchivos.Count
    if ($totalNew -gt 0) {
        $pendingLines = [System.Collections.ArrayList]@(Get-Content $pendingPath)

        Add-ItemsToSection -lines $pendingLines -header '### 🚀 Nuevas Funcionalidades' -newItems $newFeatures.ToArray()
        Add-ItemsToSection -lines $pendingLines -header '### 🔧 Correcciones de Bugs'   -newItems $newFixes.ToArray()
        Add-ItemsToSection -lines $pendingLines -header '### ✨ Mejoras'                -newItems $newMejoras.ToArray()
        Add-ItemsToSection -lines $pendingLines -header '### 📁 Archivos Modificados'   -newItems $newArchivos.ToArray()

        $pendingLines | Set-Content $pendingPath -Encoding UTF8
        Write-Host "`n✅ PENDING_CHANGES.md actualizado con $totalNew nuevo(s) item(s).`n" -ForegroundColor Green
    } else {
        Write-Host "`n  No se agregaron items nuevos.`n" -ForegroundColor Gray
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 2 — INCREMENTAR VERSIÓN
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "════ PASO 2: Incrementar version ════`n" -ForegroundColor Magenta

$respuesta = (Read-Host "¿Incrementar la version v$curVer ahora? (S/N)").Trim()
if ($respuesta -notmatch '^[Ss]') {
    Write-Host "`nVersion NO incrementada. PENDING_CHANGES queda listo para el proximo build.`n" -ForegroundColor Yellow
    exit 0
}

# Elegir tipo de incremento
Write-Host "`nTipo de incremento:" -ForegroundColor Yellow
Write-Host "  [1] patch  v$curVer → v$(Get-BumpedVersion $curVer 'patch')" -ForegroundColor White
Write-Host "  [2] minor  v$curVer → v$(Get-BumpedVersion $curVer 'minor')" -ForegroundColor White
Write-Host "  [3] major  v$curVer → v$(Get-BumpedVersion $curVer 'major')" -ForegroundColor White
do {
    $tipoInput = (Read-Host "`nElige [1/2/3]").Trim()
} while ($tipoInput -notmatch '^[123]$')

$tipoMap = @{ '1' = 'patch'; '2' = 'minor'; '3' = 'major' }
$tipo    = $tipoMap[$tipoInput]
$newVer  = Get-BumpedVersion $curVer $tipo
$newCode = $curCode + 1

$now            = Get-Date
$fechaChangelog = $now.ToString("yyyy-MM-dd")
$meses          = @('Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic')
$fechaProfile   = "$($now.Day) $($meses[$now.Month - 1]) $($now.Year)"

Write-Host "`n  v$curVer (build $curCode)  ──→  v$newVer (build $newCode)" -ForegroundColor Green
Write-Host "  Fecha: $fechaChangelog`n" -ForegroundColor Gray

# ─── 1. app.json ─────────────────────────────────────────────────────────────
Write-Host "⚙️  Actualizando app.json..." -ForegroundColor Yellow
$raw = Get-Content $appJsonPath -Raw
$raw = $raw -replace '"version"\s*:\s*"[0-9.]+"',      "`"version`": `"$newVer`""
$raw = $raw -replace '"versionCode"\s*:\s*\d+',         "`"versionCode`": $newCode"
Set-Content $appJsonPath $raw -NoNewline
Write-Host "  ✅ app.json: version=$newVer, versionCode=$newCode" -ForegroundColor Green

# ─── 2. package.json ─────────────────────────────────────────────────────────
Write-Host "⚙️  Actualizando package.json..." -ForegroundColor Yellow
$raw = Get-Content $packagePath -Raw
$raw = $raw -replace '"version"\s*:\s*"[0-9.]+"',      "`"version`": `"$newVer`""
Set-Content $packagePath $raw -NoNewline
Write-Host "  ✅ package.json: version=$newVer" -ForegroundColor Green

# ─── 3. android/app/build.gradle ─────────────────────────────────────────────
Write-Host "⚙️  Actualizando build.gradle..." -ForegroundColor Yellow
$raw = Get-Content $buildGradlePath -Raw
$raw = $raw -replace 'versionCode \d+',          "versionCode $newCode"
$raw = $raw -replace 'versionName "[0-9.]+"',    "versionName `"$newVer`""
Set-Content $buildGradlePath $raw -NoNewline
Write-Host "  ✅ build.gradle: versionCode=$newCode, versionName=$newVer" -ForegroundColor Green

# ─── 4. CHANGELOG.md ─────────────────────────────────────────────────────────
Write-Host "⚙️  Actualizando CHANGELOG.md..." -ForegroundColor Yellow

$pendingRaw = Get-Content $pendingPath -Raw -Encoding UTF8
$clFeatures = Get-SectionItems $pendingRaw '### 🚀 Nuevas Funcionalidades'
$clFixes    = Get-SectionItems $pendingRaw '### 🔧 Correcciones de Bugs'
$clMejoras  = Get-SectionItems $pendingRaw '### ✨ Mejoras'

$clFeatText   = if ($clFeatures.Count -gt 0) { ($clFeatures -join "`n") } else { "_(ninguna)_" }
$clFixText    = if ($clFixes.Count    -gt 0) { ($clFixes    -join "`n") } else { "_(ninguna)_" }

$newSection  = "## [$newVer] - $fechaChangelog`n`n"
$newSection += "### 🚀 Nuevas Funcionalidades`n$clFeatText`n`n"
$newSection += "### 🔧 Correcciones de Bugs`n$clFixText`n"
if ($clMejoras.Count -gt 0) {
    $newSection += "`n### ✨ Mejoras`n$($clMejoras -join "`n")`n"
}
$newSection += "`n### 🔢 Versiones`n"
$newSection += "- **versionCode**: $curCode → $newCode`n"
$newSection += "- **versionName**: `"$curVer`" → `"$newVer`"`n`n---`n`n"

$changelogRaw = Get-Content $changelogPath -Raw -Encoding UTF8
$changelogRaw = [regex]::Replace($changelogRaw, '(# Changelog[^\n]*\n)', "`$1`n$newSection")
Set-Content $changelogPath $changelogRaw -NoNewline -Encoding UTF8
Write-Host "  ✅ CHANGELOG.md: seccion v$newVer insertada" -ForegroundColor Green

# ─── 5. ProfileScreen/index.tsx ──────────────────────────────────────────────
Write-Host "⚙️  Actualizando ProfileScreen..." -ForegroundColor Yellow
$profileContent = Get-Content $profilePath -Raw -Encoding UTF8

# — Items limpios para el bloque de versión en ProfileScreen —
$pfFeatures = @($clFeatures | ForEach-Object { Convert-ToProfileText $_ } | Where-Object { $_ -ne '' })
$pfFixes    = @($clFixes    | ForEach-Object { Convert-ToProfileText $_ } | Where-Object { $_ -ne '' })
$pfMejoras  = @($clMejoras  | ForEach-Object { Convert-ToProfileText $_ } | Where-Object { $_ -ne '' })

# — Construir el contenido del versionContent para el nuevo bloque —
$vcontent = ""
if ($pfFeatures.Count -gt 0) {
    $vcontent += "                    <View style={styles.changelogSection}>`n"
    $vcontent += "                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>`n"
    foreach ($item in $pfFeatures) {
        $vcontent += "                      <Text style={styles.changelogItem}>• $item</Text>`n"
    }
    $vcontent += "                    </View>`n"
}
if ($pfFixes.Count -gt 0) {
    $vcontent += "                    <View style={styles.changelogSection}>`n"
    $vcontent += "                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>`n"
    foreach ($item in $pfFixes) {
        $vcontent += "                      <Text style={styles.changelogItem}>• $item</Text>`n"
    }
    $vcontent += "                    </View>`n"
}
if ($pfMejoras.Count -gt 0) {
    $vcontent += "                    <View style={styles.changelogSection}>`n"
    $vcontent += "                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>`n"
    foreach ($item in $pfMejoras) {
        $vcontent += "                      <Text style={styles.changelogItem}>• $item</Text>`n"
    }
    $vcontent += "                    </View>`n"
}
if ($vcontent -eq "") {
    $vcontent  = "                    <View style={styles.changelogSection}>`n"
    $vcontent += "                      <Text style={styles.changelogItem}>• Mejoras internas y correcciones</Text>`n"
    $vcontent += "                    </View>`n"
}

# — Construir el nuevo bloque completo de versión actual —
$newBlock  = "              {/* Versión $newVer - Versión Actual */}`n"
$newBlock += "              <TouchableOpacity `n"
$newBlock += "                style={[styles.versionBlock, styles.currentVersionBlock]} `n"
$newBlock += "                onPress={() => toggleVersionExpanded('$newVer')}`n"
$newBlock += "                activeOpacity={0.7}`n"
$newBlock += "              >`n"
$newBlock += "                <View style={styles.versionHeader}>`n"
$newBlock += "                  <Text style={[styles.versionNumber, styles.currentVersionNumber]}>v$newVer (Actual)</Text>`n"
$newBlock += "                  <Text style={[styles.versionDate, styles.currentVersionDate]}>$fechaProfile</Text>`n"
$newBlock += "                  <MaterialCommunityIcons `n"
$newBlock += "                    name={expandedVersions.has('$newVer') ? 'chevron-up' : 'chevron-down'} `n"
$newBlock += "                    size={24} `n"
$newBlock += "                    color={theme.colors.primary} `n"
$newBlock += "                  />`n"
$newBlock += "                </View>`n"
$newBlock += "                {expandedVersions.has('$newVer') && (`n"
$newBlock += "                  <View style={styles.versionContent}>`n"
$newBlock += $vcontent
$newBlock += "                  </View>`n"
$newBlock += "                )}`n"
$newBlock += "              </TouchableOpacity>`n`n"

# — a) Demote bloque de versión anterior: quitar estilos current* y "(Actual)" —
$profileContent = $profileContent -replace '\[styles\.versionBlock, styles\.currentVersionBlock\]', '[styles.versionBlock]'
$profileContent = $profileContent -replace '\[styles\.versionNumber, styles\.currentVersionNumber\]', '[styles.versionNumber]'
$profileContent = $profileContent -replace '\[styles\.versionDate, styles\.currentVersionDate\]', '[styles.versionDate]'
$profileContent = $profileContent -replace "v$([regex]::Escape($curVer)) \(Actual\)", "v$curVer"

# — b) Insertar nuevo bloque ANTES del comentario de la versión anterior —
# Búsqueda con regex para tolerar texto adicional después del número de versión
$markerRegex = [regex]::Escape("{/* Versión $curVer")
$markerMatch = [regex]::Match($profileContent, $markerRegex)
if ($markerMatch.Success) {
    $idx = $markerMatch.Index
    $profileContent = $profileContent.Substring(0, $idx) + $newBlock + $profileContent.Substring($idx)
    Write-Host "    → Nuevo bloque v$newVer insertado en el changelog modal" -ForegroundColor DarkGray
} else {
    Write-Host "    ⚠️  No se encontro el marcador '{/* Version $curVer' en ProfileScreen." -ForegroundColor Yellow
    Write-Host "       Insertar el bloque manualmente." -ForegroundColor Yellow
}

# — c) Badge de versión —
$profileContent = $profileContent -replace "versionBadgeText}>v$([regex]::Escape($curVer))</Text>", "versionBadgeText}>v$newVer</Text>"

# — d) About title: SplitSmart vX.X.X —
$profileContent = $profileContent -replace "SplitSmart v$([regex]::Escape($curVer))", "SplitSmart v$newVer"

# — e) Version spec: ...version')}:</Text> X.X.X —
$profileContent = $profileContent -replace "(profile\.about\.version'\)}:</Text> )$([regex]::Escape($curVer))", "`${1}$newVer"

Set-Content $profilePath $profileContent -NoNewline -Encoding UTF8
Write-Host "  ✅ ProfileScreen actualizado (badge, modal, about title, version spec)" -ForegroundColor Green

# ─── 6. Reset PENDING_CHANGES.md ─────────────────────────────────────────────
Write-Host "⚙️  Reseteando PENDING_CHANGES.md..." -ForegroundColor Yellow
$nextPatch    = Get-BumpedVersion $newVer 'patch'
$pendingReset = @"
# Cambios Pendientes de Registrar — SplitSmart

> **Propósito:** Bitácora de trabajo en curso entre sesiones de chat.
> Registrar aquí TODOS los cambios realizados antes de generar un nuevo APK/AAB.
> Una vez generado el build, mover el contenido a ``CHANGELOG.md`` y vaciar este archivo.

---

## 🗂️ Versión en desarrollo: v$nextPatch

> Cambios realizados después del build de v$newVer

### 🚀 Nuevas Funcionalidades

_(ninguna aún)_

### 🔧 Correcciones de Bugs

_(ninguna aún)_

### ✨ Mejoras

_(ninguna aún)_

### 📁 Archivos Modificados

_(ninguno aún)_

---

## 📋 Instrucciones de uso

1. **Al inicio de cada sesión**: leer este archivo para retomar el contexto
2. **Durante la sesión**: agregar cada cambio realizado en la sección correspondiente
3. **Al generar el build**: copiar el contenido a ``CHANGELOG.md`` y limpiar este archivo
4. **Incrementar versión**: ejecutar ``.\versiones.ps1``
"@
Set-Content $pendingPath $pendingReset -Encoding UTF8
Write-Host "  ✅ PENDING_CHANGES.md reseteado para v$nextPatch" -ForegroundColor Green

# ─── Resumen final ────────────────────────────────────────────────────────────
Write-Host "`n════ RESUMEN ════════════════════════════" -ForegroundColor Cyan
Write-Host "  Version     : v$curVer → v$newVer" -ForegroundColor White
Write-Host "  versionCode : $curCode → $newCode" -ForegroundColor White
Write-Host "  Fecha       : $fechaChangelog`n" -ForegroundColor White
Write-Host "  Archivos actualizados:" -ForegroundColor Yellow
Write-Host "    ✅ app.json" -ForegroundColor White
Write-Host "    ✅ package.json" -ForegroundColor White
Write-Host "    ✅ android/app/build.gradle" -ForegroundColor White
Write-Host "    ✅ CHANGELOG.md" -ForegroundColor White
Write-Host "    ✅ src/screens/ProfileScreen/index.tsx" -ForegroundColor White
Write-Host "    ✅ PENDING_CHANGES.md (reseteado → v$nextPatch)`n" -ForegroundColor White
Write-Host "  Proximos pasos:" -ForegroundColor Cyan
Write-Host "    → Verificar el nuevo bloque en ProfileScreen visualmente" -ForegroundColor White
Write-Host "    → Ejecutar .\build-all.ps1 -APK -AAB -Copia cuando estes listo`n" -ForegroundColor White
