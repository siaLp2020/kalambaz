param()

$ErrorActionPreference = 'Stop'

# Build the compact twelve-color gallery from real photographs already stored
# in the project. Each color receives four different PNG frames, and the
# normal gallery builder turns those frames into the animated WebP used by the
# game.
$repoRoot = Split-Path -Parent $PSScriptRoot
$publicRoot = Join-Path $repoRoot 'public'
$manifestPath = Join-Path $repoRoot 'src/gallery-manifest.json'
$galleryRoot = Join-Path $publicRoot 'images/gallery/3'
$animatedRoot = Join-Path $publicRoot 'images/gallery-animated/3'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'

Add-Type -AssemblyName System.Drawing
if (-not (Test-Path -LiteralPath $chrome)) { throw "Chrome was not found at $chrome" }

$sourceSets = [ordered]@{
  red = @('/images/gallery/2/strawberry-1.jpg', '/images/gallery/2/strawberry-2.jpg', '/images/gallery/2/strawberry-3.jpg', '/images/gallery/2/strawberry-4.jpg')
  blue = @('/images/gallery/2/blueberry-1.jpg', '/images/gallery/2/blueberry-2.jpg', '/images/gallery/2/blueberry-3.jpg', '/images/gallery/2/blueberry-4.jpg')
  yellow = @('/images/gallery/2/banana-1.jpg', '/images/gallery/2/banana-2.jpg', '/images/gallery/2/banana-3.jpg', '/images/gallery/2/banana-4.jpg')
  green = @('/images/gallery/2/lime-1.jpg', '/images/gallery/2/lime-2.jpg', '/images/gallery/2/lime-3.jpg', '/images/gallery/2/lime-4.jpg')
  orange = @('/images/gallery/2/orange-1.jpg', '/images/gallery/2/orange-2.jpg', '/images/gallery/2/orange-3.jpg', '/images/gallery/2/orange-4.jpg')
  purple = @('/images/gallery/2/plum-1.jpg', '/images/gallery/2/plum-2.jpg', '/images/gallery/2/plum-3.jpg', '/images/gallery/2/plum-4.jpg')
  pink = @('/images/gallery/2/lychee-1.jpg', '/images/gallery/2/lychee-2.jpg', '/images/gallery/2/lychee-3.jpg', '/images/gallery/2/lychee-4.jpg')
  black = @('/images/gallery/2/blackberry-1.jpg', '/images/gallery/2/blackberry-2.jpg', '/images/gallery/2/blackberry-3.jpg', '/images/gallery/2/blackberry-4.jpg')
  white = @('/images/gallery/2/coconut-1.jpg', '/images/gallery/2/coconut-2.jpg', '/images/gallery/2/coconut-3.jpg', '/images/gallery/2/coconut-4.jpg')
  brown = @('/images/gallery/2/durian-1.jpg', '/images/gallery/2/durian-2.jpg', '/images/gallery/2/durian-3.jpg', '/images/gallery/2/durian-4.jpg')
  gray = @('/images/animals/elephant.webp', '/images/animals/cat.webp', '/images/animals/hippo.webp', '/images/animals/whale.webp')
  cyan = @('/images/animals/dolphin.webp', '/images/animals/peacock.webp', '/images/gallery/2/grape-2.jpg', '/images/gallery/2/blueberry-2.jpg')
}

New-Item -ItemType Directory -Force -Path $galleryRoot, $animatedRoot | Out-Null
$keepPng = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$keepWebp = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

function Convert-ToPng([string]$source, [string]$destination) {
  $image = [Drawing.Image]::FromFile($source)
  try {
    $bitmap = [Drawing.Bitmap]::new($image.Width, $image.Height)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.DrawImageUnscaled($image, 0, 0)
      $bitmap.Save($destination, [Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  } finally {
    $image.Dispose()
  }
}

function Convert-WebpToPng([string]$source, [string]$destination, [int]$index) {
  $tempRoot = Join-Path $repoRoot '.gallery-build/color-source'
  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
  $token = [Guid]::NewGuid().ToString('N')
  $htmlPath = Join-Path $tempRoot "$token.html"
  $profile = Join-Path $tempRoot "$token-profile"
  $fileUri = 'file:///' + ([IO.Path]::GetFullPath($source).Replace('\', '/'))
  $html = "<!doctype html><meta charset='utf-8'><style>html,body{margin:0;overflow:hidden;background:white}img{display:block;width:360px;height:270px;object-fit:cover}</style><img src='$fileUri' alt=''>"
  [IO.File]::WriteAllText($htmlPath, $html, [Text.UTF8Encoding]::new($false))
  $args = @('--headless=new', '--disable-gpu', '--no-sandbox', '--disable-extensions', '--disable-sync', '--password-store=basic', '--hide-scrollbars', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=250', '--window-size=360,270', "--user-data-dir=$profile", "--screenshot=$destination", "file:///$(([IO.Path]::GetFullPath($htmlPath).Replace('\', '/')))")
  $stderrPath = Join-Path $tempRoot "$token.stderr.log"
  $stdoutPath = Join-Path $tempRoot "$token.stdout.log"
  Start-Process -FilePath $chrome -ArgumentList $args -WindowStyle Hidden -Wait -RedirectStandardError $stderrPath -RedirectStandardOutput $stdoutPath | Out-Null
  Remove-Item -LiteralPath $stderrPath, $stdoutPath -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $htmlPath -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $profile -Recurse -Force -ErrorAction SilentlyContinue
  if (-not (Test-Path -LiteralPath $destination)) { throw "Chrome failed for WebP source $source frame $($index + 1)" }
}

foreach ($entry in $sourceSets.GetEnumerator()) {
  $color = $entry.Key
  $sources = @($entry.Value)
  for ($index = 0; $index -lt 4; $index++) {
    $sourceRelative = [string]$sources[$index]
    $source = Join-Path $publicRoot $sourceRelative.TrimStart('/')
    $destination = Join-Path $galleryRoot ("{0}-{1}.png" -f $color, ($index + 1))
    if ($sourceRelative.ToLowerInvariant().EndsWith('.webp')) {
      Convert-WebpToPng $source $destination $index
    } else {
      Convert-ToPng $source $destination
    }
    [void]$keepPng.Add((Split-Path -Leaf $destination))
  }
  [void]$keepWebp.Add("$color.webp")
}

# Remove the old, unused color assets so category 3 contains exactly the
# twelve selected colors.
Get-ChildItem -LiteralPath $galleryRoot -File | Where-Object { -not $keepPng.Contains($_.Name) } | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
Get-ChildItem -LiteralPath $animatedRoot -File | Where-Object { -not $keepWebp.Contains($_.Name) } | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

$manifest = Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath | ConvertFrom-Json
$category = [ordered]@{}
foreach ($entry in $sourceSets.GetEnumerator()) {
  $images = @()
  $sources = @()
  for ($index = 1; $index -le 4; $index++) {
    $images += "/images/gallery/3/$($entry.Key)-$index.png"
    $sources += [ordered]@{ source = "real local photo reused from $($entry.Value[$index - 1])" }
  }
  $category[$entry.Key] = [ordered]@{
    images = $images
    sources = $sources
    query = "$($entry.Key) color real photo"
  }
}
$manifest.'3' = [pscustomobject]$category
$json = $manifest | ConvertTo-Json -Depth 30
[IO.File]::WriteAllText($manifestPath, $json + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
Write-Host "Built $($sourceSets.Count) colors with four PNG photos each"
