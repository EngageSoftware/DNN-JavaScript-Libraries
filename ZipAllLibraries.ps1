Remove-Item .\_InstallPackages -Recurse -Force -ErrorAction SilentlyContinue
mkdir .\_InstallPackages | Out-Null
yarn
yarn package
