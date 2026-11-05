#define MyAppName "MURDILIMAX Recovery"
#define MyAppVersion "0.4.0"
#define MyAppExeName "MURDILIMAX-Recovery.exe"
[Setup]
AppId={{F3129D3B-56CB-4A41-8B0D-74D632EDA564}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher=MURDILIMAX
AppPublisherURL=https://cenaradar.online/
AppSupportURL=https://cenaradar.online/
DefaultDirName={localappdata}\Programs\MURDILIMAX Recovery
DefaultGroupName=MURDILIMAX Recovery
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=installer-output
OutputBaseFilename=MURDILIMAX-Recovery-Setup-0.4
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=assets\murdilimax.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
ArchitecturesAllowed=x64compatible
ShowLanguageDialog=yes
ChangesAssociations=no
CloseApplications=force
[Languages]
Name: "ru"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "en"; MessagesFile: "compiler:Default.isl"
[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
[Files]
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "README-v04-RU-EN.md"; DestDir: "{app}"; Flags: ignoreversion
[Icons]
Name: "{group}\MURDILIMAX Recovery"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\MURDILIMAX Recovery"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon
[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent
