Set oWS = CreateObject("WScript.Shell")
strCurDir = oWS.CurrentDirectory
sDesktop = oWS.SpecialFolders("Desktop")

' Atalho na pasta local
sLinkFileLocal = strCurDir & "\Imersão Modo Carreira - EA FC.lnk"
Set oLinkLocal = oWS.CreateShortcut(sLinkFileLocal)
oLinkLocal.TargetPath = strCurDir & "\INICIAR_VAULT.bat"
oLinkLocal.WorkingDirectory = strCurDir
oLinkLocal.IconLocation = strCurDir & "\siga_logo.ico, 0"
oLinkLocal.Description = "Imersão Modo Carreira - EA FC"
oLinkLocal.Save

' Atalho na Área de Trabalho (Desktop)
sLinkFileDesk = sDesktop & "\Imersão Modo Carreira - EA FC.lnk"
Set oLinkDesk = oWS.CreateShortcut(sLinkFileDesk)
oLinkDesk.TargetPath = strCurDir & "\INICIAR_VAULT.bat"
oLinkDesk.WorkingDirectory = strCurDir
oLinkDesk.IconLocation = strCurDir & "\siga_logo.ico, 0"
oLinkDesk.Description = "Imersão Modo Carreira - EA FC"
oLinkDesk.Save

WScript.Echo "Atalhos criados com sucesso na pasta e no Desktop!"

