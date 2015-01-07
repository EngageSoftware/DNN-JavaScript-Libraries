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

Export-ModuleMember New-Package