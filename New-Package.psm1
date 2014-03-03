Set-StrictMode -Version:Latest
Import-Module PSCX -RequiredVersion 3.1.0.0

function New-Package(
    $directory = '.', 
    [switch]$recurse, 
    $outputPath = 'InstallPackages')
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
        $subDirectories = ls $directory -Directory | ? { $_.FullName -ne $outputPath.Path }
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
        ls $directory | Write-Zip -FlattenPaths -OutputPath (Join-Path $outputPath $zipName)
    }
}

Export-ModuleMember New-Package