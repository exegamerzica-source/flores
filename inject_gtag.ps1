$tag = @"
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18270028632"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18270028632');
</script>
"@

$files = Get-ChildItem -Path "C:\Users\Soubw\Documents\flores" -Include *.html,*.asp -Recurse -File

$count = 0
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    if ($content -notmatch "AW-18270028632") {
        $content = $content -ireplace "</head>", "`n$tag`n</head>"
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $count++
    }
}
Write-Output "Injected gtag into $count files."
