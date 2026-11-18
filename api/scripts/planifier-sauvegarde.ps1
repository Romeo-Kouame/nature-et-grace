# Planifie une sauvegarde automatique de la base locale, chaque jour à 21 h (Planificateur de tâches Windows).
# À lancer une seule fois : clic droit sur ce fichier > « Exécuter avec PowerShell ».
# Pour annuler : schtasks /Delete /TN "NatureEtGrace-Sauvegarde" /F
#
# La sauvegarde (npm run db:backup) garde les 14 dernières copies dans api\backups\ et écrit son journal
# dans api\backups\sauvegarde-auto.log. L'ordinateur doit être allumé et la session ouverte à 21 h ;
# sinon, la tâche se lance au prochain démarrage (option « dès que possible »).

$api = Split-Path -Parent $PSScriptRoot
$log = Join-Path $api 'backups\sauvegarde-auto.log'
New-Item -ItemType Directory -Force (Join-Path $api 'backups') | Out-Null

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c cd /d `"$api`" && npm run db:backup >> `"$log`" 2>&1"
$trigger = New-ScheduledTaskTrigger -Daily -At '21:00'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName 'NatureEtGrace-Sauvegarde' -Action $action -Trigger $trigger -Settings $settings `
  -Description 'Sauvegarde quotidienne de la base Nature & Grâce (npm run db:backup)' -Force | Out-Null

Write-Host 'Sauvegarde planifiée chaque jour à 21 h. Test immédiat…'
Start-ScheduledTask -TaskName 'NatureEtGrace-Sauvegarde'
Start-Sleep -Seconds 20
if (Test-Path $log) { Get-Content $log -Tail 3 } else { Write-Host "Pas encore de journal : vérifiez $log dans une minute." }
Read-Host 'Appuyez sur Entrée pour fermer'
