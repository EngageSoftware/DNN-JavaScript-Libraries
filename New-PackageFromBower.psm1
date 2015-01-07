 function New-PackageFromBower ($name) {
    bower install $name
    if ($name -match '#') {
        $split = $name.Split('#')
        $name = $split[0]
        $version = $split[1]
    }

    $packageInfo = (Get-Content .\_bower_components\$name\.bower.json) -join "`n" | ConvertFrom-Json
    if (@(Get-Member -InputObject $packageInfo | ? { $_.Name -eq 'version' }).Count -gt 0) {
        $version = $packageInfo.version
    }

    $allPaths = (bower list --paths --json) -join "`n" | ConvertFrom-Json
    $paths = @($allPaths.$name)
    $jsPaths = @($paths | ? { $_ -match '\.js$' })

    if ($jsPaths.Count -eq 0) {
        $jsPaths = @(ls $paths *.js -Recurse)
    }
    if ($jsPaths.Count -gt 1) {
        Write-Warning 'Package contains multiple JS files, only the first will be listed in the package'
    } 

    $jsFile = $jsPaths[0]
    $fileName = Split-Path $jsFile -Leaf

   
    $versionedFolder = "$($name)_$version"
    mkdir $versionedFolder

    $filePaths = @($paths | ? { -not (Test-Path $_ -PathType Container) })
    if ($filePaths.Count -eq 0) {
        $jsPaths | % { cp $_.FullName $versionedFolder }
    } else {
        $filePaths | % { cp $_ $versionedFolder }
    }
    
    $manifestFile = "$versionedFolder\$name.dnn"
    cp _template\library.dnn $manifestFile
    $changesFile = "$versionedFolder\CHANGES.htm"
    cp _template\CHANGES.htm $changesFile
    $licenseFile = "$versionedFolder\LICENSE.htm"
    cp _template\LICENSE.htm $licenseFile

    ReplaceTokens $manifestFile $name $version $fileName
    ReplaceTokens $changesFile $name $version $fileName
    ReplaceTokens $licenseFile $name $version $fileName

    notepad $manifestFile
    notepad $changesFile
    notepad $licenseFile
    
    if (@(Get-Member -InputObject $packageInfo | ? { $_.Name -eq 'dependencies' }).Count -gt 0) {
        Write-Warning 'Package has dependencies'; Write-Warning $packageInfo.dependencies
    }
 }

 function ReplaceTokens($file, $name, $version, $fileName) {
     (Get-Content $file) | 
        % { $_ -replace '\[name\]', $name -replace '\[version\]', $version -replace '\[file\]', $fileName } | 
        Set-Content $file
 }

 Export-ModuleMember New-PackageFromBower