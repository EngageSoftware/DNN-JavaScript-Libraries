param ($name)
Remove-Module JsLibraryPackaging -ErrorAction:SilentlyContinue
Import-Module .\JsLibraryPackaging.psm1
Update-BowerLibrary $name