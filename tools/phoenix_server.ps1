param(
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Prefix = "http://localhost:$Port/"

function Get-MimeType($Path) {
  $ext = [IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    ".html" { "text/html; charset=utf-8"; break }
    ".htm"  { "text/html; charset=utf-8"; break }
    ".js"   { "text/javascript; charset=utf-8"; break }
    ".mjs"  { "text/javascript; charset=utf-8"; break }
    ".css"  { "text/css; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".png"  { "image/png"; break }
    ".jpg"  { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".webp" { "image/webp"; break }
    ".gif"  { "image/gif"; break }
    ".svg"  { "image/svg+xml"; break }
    ".wav"  { "audio/wav"; break }
    ".mp3"  { "audio/mpeg"; break }
    ".glb"  { "model/gltf-binary"; break }
    ".gltf" { "model/gltf+json"; break }
    default { "application/octet-stream"; break }
  }
}

function Write-TextResponse($Response, $StatusCode, $Text) {
  $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = "text/plain; charset=utf-8"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.OutputStream.Close()
}

$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add($Prefix)

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "Cannot start local server on $Prefix" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "Try closing old Phoenix7 server windows, then run START_GAME_V3L_WINDOWS.bat again."
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host "===============================================" -ForegroundColor DarkYellow
Write-Host "  Phoenix7 local server is running" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor DarkYellow
Write-Host "Root: $Root"
Write-Host "URL:  ${Prefix}v3l.html" -ForegroundColor Green
Write-Host ""
Write-Host "Do not close this window while playing."
Write-Host "Press Ctrl+C here to stop the server."
Write-Host ""

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($urlPath)) { $urlPath = "v3l.html" }

    $urlPath = $urlPath -replace '/', [IO.Path]::DirectorySeparatorChar
    $filePath = Join-Path $Root $urlPath
    $fullPath = [IO.Path]::GetFullPath($filePath)
    $rootFull = [IO.Path]::GetFullPath($Root)

    if (-not $fullPath.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      Write-TextResponse $res 403 "Forbidden"
      continue
    }

    if (-not (Test-Path $fullPath -PathType Leaf)) {
      Write-TextResponse $res 404 "Not found: $urlPath"
      continue
    }

    $bytes = [IO.File]::ReadAllBytes($fullPath)
    $res.StatusCode = 200
    $res.ContentType = Get-MimeType $fullPath
    $res.ContentLength64 = $bytes.Length
    $res.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
    $res.Headers.Add("Access-Control-Allow-Origin", "*")
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.OutputStream.Close()

    Write-Host ("200 " + $req.Url.AbsolutePath)
  } catch {
    try {
      if ($ctx -and $ctx.Response) {
        Write-TextResponse $ctx.Response 500 $_.Exception.Message
      }
    } catch {}
    Write-Host $_.Exception.Message -ForegroundColor Red
  }
}
