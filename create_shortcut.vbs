Set oWS = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strCurDir = fso.GetParentFolderName(WScript.ScriptFullName)

If WScript.Arguments.Count > 0 Then
    arg0 = WScript.Arguments(0)
    If fso.FolderExists(arg0) Then
        strCurDir = arg0
    End If
End If

If Right(strCurDir, 1) = "\" Then
    strCurDir = Left(strCurDir, Len(strCurDir) - 1)
End If

sDesktop = oWS.SpecialFolders("Desktop")

' 1. Criar Atalho na Area de Trabalho (Desktop)
sLinkFileDesk = sDesktop & "\Imersao Modo Carreira - EA FC.lnk"
Set oLinkDesk = oWS.CreateShortcut(sLinkFileDesk)
oLinkDesk.TargetPath = strCurDir & "\INICIAR_VAULT.bat"
oLinkDesk.WorkingDirectory = strCurDir
oLinkDesk.IconLocation = strCurDir & "\siga_logo.ico, 0"
oLinkDesk.Description = "Imersao Modo Carreira - EA FC"
oLinkDesk.Save

' 2. Criar Atalho dentro da pasta local
sLinkFileLocal = strCurDir & "\Imersao Modo Carreira - EA FC.lnk"
Set oLinkLocal = oWS.CreateShortcut(sLinkFileLocal)
oLinkLocal.TargetPath = strCurDir & "\INICIAR_VAULT.bat"
oLinkLocal.WorkingDirectory = strCurDir
oLinkLocal.IconLocation = strCurDir & "\siga_logo.ico, 0"
oLinkLocal.Description = "Imersao Modo Carreira - EA FC"
oLinkLocal.Save

WScript.Echo "Atalhos criados com sucesso na pasta e no Desktop!"
