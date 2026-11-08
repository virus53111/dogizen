#define AppName "MURDIWORLD Crystal Adventure"
#define AppVersion "0.2.0"
#define PublisherName "MURDIWORLD"
#define AppExe "MURDIWORLD.exe"
[Setup]
AppId={{A9F76FC2-82D3-4C85-975B-2341C2F9647A}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#PublisherName}
AppPublisherURL=https://murdilimax.com/
AppSupportURL=https://murdilimax.com/guide/
DefaultDirName={localappdata}\Programs\MURDIWORLD
DefaultGroupName=MURDIWORLD
PrivilegesRequired=lowest
OutputDir=..\_mwbuild\dist
OutputBaseFilename=MURDIWORLD-Setup-0.2.0
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
UninstallDisplayName=MURDIWORLD Crystal Adventure 0.2
DisableProgramGroupPage=yes
DisableDirPage=yes
SetupLogging=yes
CloseApplications=yes
RestartApplications=no
[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"
[Files]
Source: "..\_mwbuild\stage\MURDIWORLD.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\_mwbuild\stage\engine\*"; DestDir: "{app}\engine"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\_mwbuild\stage\world-template\*"; DestDir: "{app}\world-template"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\_mwbuild\stage\config\*"; DestDir: "{app}\config"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\_mwbuild\stage\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "THIRD_PARTY_NOTICES.txt"; DestDir: "{app}"; Flags: ignoreversion
[Icons]
Name: "{group}\MURDIWORLD"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\MURDIWORLD"; Filename: "{app}\{#AppExe}"
[Run]
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchProgram,MURDIWORLD}"; Flags: nowait postinstall skipifsilent
