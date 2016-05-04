Import-Module .\JsLibraryPackaging.psm1
rmdir .\_InstallPackages -Recurse -Force -ErrorAction SilentlyContinue
mkdir .\_InstallPackages | Out-Null
New-Package -Recurse