Import-Module .\New-Package.psm1
rmdir .\InstallPackages -recurse -force
mkdir .\InstallPackages
New-Package -recurse