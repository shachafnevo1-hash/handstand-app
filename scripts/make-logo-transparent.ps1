Add-Type -AssemblyName System.Drawing

$src = "C:\Users\shach\cloude app\assets\handstand-logo.png"
$dst = "C:\Users\shach\cloude app\assets\handstand-logo.png"

$original = [System.Drawing.Bitmap]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap $original.Width, $original.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($original, 0, 0, $original.Width, $original.Height)
$g.Dispose()
$original.Dispose()

# Lock the bitmap for fast pixel access
$rect = New-Object System.Drawing.Rectangle 0, 0, $bmp.Width, $bmp.Height
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ptr = $data.Scan0
$bytes = $bmp.Width * $bmp.Height * 4
$buffer = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($ptr, $buffer, 0, $bytes)

# For each pixel, if it's dark (near black), make it transparent
for ($i = 0; $i -lt $bytes; $i += 4) {
  $b = $buffer[$i]
  $gC = $buffer[$i + 1]
  $r = $buffer[$i + 2]
  # Dark pixels become transparent; keep bright (lime) pixels
  $brightness = $r + $gC + $b
  if ($brightness -lt 120) {
    # Fully transparent
    $buffer[$i + 3] = 0
  } elseif ($brightness -lt 240) {
    # Partial fade on anti-aliased edges so they blend smoothly
    $alpha = [Math]::Min(255, [int](($brightness - 120) * 2.1))
    $buffer[$i + 3] = [byte]$alpha
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($buffer, 0, $ptr, $bytes)
$bmp.UnlockBits($data)

$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Transparent logo saved to assets/handstand-logo.png"
