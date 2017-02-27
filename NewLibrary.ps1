param ($name, $version, $jsFileName)
Remove-Module JsLibraryPackaging -ErrorAction:SilentlyContinue
Import-Module .\JsLibraryPackaging.psm1
New-JavaScriptLibrary $name $version $jsFileName