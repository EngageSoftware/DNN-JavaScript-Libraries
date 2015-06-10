Set-StrictMode -Version:Latest
#Import-Module PSCX -RequiredVersion 3.2.0.0
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

function New-Package(
    $directory = '.', 
    [switch]$recurse, 
    $outputPath = '_InstallPackages')
{
    if ($directory -is [string]) {
        $directory = Resolve-Path $directory
    } elseif ($directory -is [System.IO.DirectoryInfo]){
        $directory = Resolve-Path $directory.FullName
    }
    #Write-Host ('directory is ' + $directory.Path)

    if ($outputPath -is [string]) {
        $outputPath = Resolve-Path $outputPath
    } elseif ($outputPath -is [System.IO.DirectoryInfo]) {
        $outputPath = Resolve-Path $outputPath.FullName        
    }
    #Write-Host ('output path is ' + $outputPath.Path)

    $zipThisDirectory = -not $recurse
    if ($recurse) {
        $subDirectories = ls $directory -Directory | ? { $_.FullName -ne $outputPath.Path -and $_.Name -notmatch '^_' }
        if (@($subDirectories).Length -gt 0) {
            foreach ($subDirectory in $subDirectories) {
                New-Package $subDirectory -recurse -outputPath $outputPath
            }
        } else {
            $zipThisDirectory = $true
        }
    }

    if ($zipThisDirectory) {
        #Write-Host ('zipping ' + $directory.Path)
        $zipName = (Split-Path $directory.Path -Leaf) + '.zip'
        [System.IO.Compression.ZipFile]::CreateFromDirectory($directory, (Join-Path $outputPath $zipName), [System.IO.Compression.CompressionLevel]::Optimal, $false)
    }
}

function New-BowerLibrary ($name) {
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

    $versionedFolder = New-JavaScriptLibrary $name $version $fileName

    $filePaths = @($paths | ? { -not (Test-Path $_ -PathType Container) })
    if ($filePaths.Count -eq 0) {
        $jsPaths | % { cp $_.FullName $versionedFolder }
    } else {
        $filePaths | % { cp $_ $versionedFolder }
    }

    if (@(Get-Member -InputObject $packageInfo | ? { $_.Name -eq 'dependencies' }).Count -gt 0) {
        Write-Warning 'Package has dependencies'; Write-Warning $packageInfo.dependencies
    }
}

function New-JavaScriptLibrary ($name, $version, $jsFileName) {
    $versionedFolder = "$($name)_$version"
    mkdir $versionedFolder
  
    $manifestFile = "$versionedFolder\$name.dnn"
    cp _template\library.dnn $manifestFile
    $changesFile = "$versionedFolder\CHANGES.htm"
    cp _template\CHANGES.htm $changesFile
    $licenseFile = "$versionedFolder\LICENSE.htm"
    cp _template\LICENSE.htm $licenseFile

    ReplaceTokens $manifestFile $name $version $jsFileName
    ReplaceTokens $changesFile $name $version $jsFileName
    ReplaceTokens $licenseFile $name $version $jsFileName

    notepad $manifestFile
    notepad $changesFile
    notepad $licenseFile

    return $versionedFolder
}

 function ReplaceTokens($file, $name, $version, $fileName) {
     (Get-Content $file) | 
        % { $_ -replace '\[name\]', $name -replace '\[version\]', $version -replace '\[file\]', $fileName } | 
        Set-Content $file
 }

Export-ModuleMember New-JavaScriptLibrary
Export-ModuleMember New-BowerLibrary
Export-ModuleMember New-Package