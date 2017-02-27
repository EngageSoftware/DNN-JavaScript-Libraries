param ($name)
Remove-Module JsLibraryPackaging -ErrorAction:SilentlyContinue
Import-Module .\JsLibraryPackaging.psm1
New-BowerLibrary $name