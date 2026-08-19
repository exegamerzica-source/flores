$files = Get-ChildItem -Path "C:\Users\Soubw\Documents\flores" -Include *.html,*.asp,*.json,*.js -Recurse -File
$count = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $modified = $false
    
    if ($content -match "551635130795") {
        $content = $content -replace "551635130795", "5547999835305"
        $modified = $true
    }
    
    if ($content -match "\(\s*16\s*\)\s*3513\s*-\s*0795") {
        $content = $content -replace "\(\s*16\s*\)\s*3513\s*-\s*0795", "(47) 99983-5305"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $count++
    }
}
Write-Output "Replaced WhatsApp number in $count files."
