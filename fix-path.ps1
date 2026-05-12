$machineEnv = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = ($machineEnv -split ';' | Where-Object { $_ -notmatch 'nvm4w' }) -join ';'
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
Write-Host "✅ PATH do sistema atualizado com sucesso!"
Write-Host "Removido: C:\nvm4w\nodejs"
Write-Host ""
Write-Host "Agora execute novamente o start-sistema.bat"
Read-Host "Pressione Enter para fechar"
