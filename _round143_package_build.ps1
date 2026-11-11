$root='C:\Users\lenovo\Documents\ChatGPT\各种的\_ghpages'
$oldStage=Join-Path $root '_release_staging_2026-11-11_Build107_r1'
$stage=Join-Path $root '_release_staging_2026-11-11_Build108_r1'
if(Test-Path -LiteralPath $stage){ Remove-Item -LiteralPath $stage -Recurse -Force }
Copy-Item -LiteralPath $oldStage -Destination $stage -Recurse
Get-ChildItem -LiteralPath $stage -File -Filter '*.apk' | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
$apkName='BS小手机_3.97_Build108.apk'
Copy-Item -LiteralPath (Join-Path $root 'BS小手机.apk') -Destination (Join-Path $stage $apkName) -Force
Copy-Item -LiteralPath (Join-Path $root 'version.json') -Destination (Join-Path $stage 'version.json') -Force
Copy-Item -LiteralPath (Join-Path $root 'manifest.webmanifest') -Destination (Join-Path $stage 'manifest.webmanifest') -Force
foreach($rel in @('index.html','sw.js','version.json','manifest.webmanifest','icon-192.png','icon-512.png')) {
  Copy-Item -LiteralPath (Join-Path $root $rel) -Destination (Join-Path $stage ('assets\public\'+$rel)) -Force
}
$apkHash=(Get-FileHash -LiteralPath (Join-Path $stage $apkName) -Algorithm SHA256).Hash
$manifest=[ordered]@{format='BS小手机发布归档';archiveVersion=1;version='3.97';versionCode=108;buildNumber=108;releasedAt='2026-11-11';apk=$apkName;apkSha256=$apkHash;includesApiKey=$false;scope='APK + web assets + data archive format';webAssets='assets/public'}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $stage 'manifest.json') -Encoding UTF8
$files=Get-ChildItem -LiteralPath $stage -Recurse -File | Where-Object { $_.Name -ne 'checksums.json' } | Sort-Object FullName
$map=[ordered]@{}
foreach($f in $files) {
  $rel=$f.FullName.Substring($stage.Length+1).Replace('\','/')
  $map[$rel]=(Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash
}
$checks=[ordered]@{algorithm='SHA-256';files=$map}
$checks | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $stage 'checksums.json') -Encoding UTF8
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=Join-Path $root 'BS小手机_3.97_Build108_release.zip'
if(Test-Path -LiteralPath $zip){ Remove-Item -LiteralPath $zip -Force }
$fs=[IO.File]::Open($zip,[IO.FileMode]::Create)
$archive=New-Object IO.Compression.ZipArchive($fs,[IO.Compression.ZipArchiveMode]::Create)
foreach($f in (Get-ChildItem -LiteralPath $stage -Recurse -File | Sort-Object FullName)) {
  $rel=$f.FullName.Substring($stage.Length+1).Replace('\','/')
  $entry=$archive.CreateEntry($rel,[IO.Compression.CompressionLevel]::Optimal)
  $es=$entry.Open()
  $input=[IO.File]::OpenRead($f.FullName)
  $input.CopyTo($es)
  $input.Dispose()
  $es.Dispose()
}
$archive.Dispose()
$fs.Dispose()
$z=[IO.Compression.ZipFile]::OpenRead($zip)
$entries=$z.Entries | Select-Object FullName,Length
$z.Dispose()
$entries | Format-Table -AutoSize
Get-FileHash -LiteralPath $zip -Algorithm SHA256
"ENTRY_COUNT=$($entries.Count)"
"BACKSLASH_ENTRIES=$(($entries | Where-Object { $_.FullName.Contains([char]92) }).Count)"


