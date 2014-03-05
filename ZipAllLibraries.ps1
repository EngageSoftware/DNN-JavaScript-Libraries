Import-Module .\New-Package.psm1
rmdir .\InstallPackages -Recurse -Force
mkdir .\InstallPackages | Out-Null
New-Package -Recurse