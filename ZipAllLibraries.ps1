Import-Module .\New-Package.psm1
rmdir .\_InstallPackages -Recurse -Force
mkdir .\_InstallPackages | Out-Null
New-Package -Recurse