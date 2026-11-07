# MURDIWORLD — Crystal Adventure 0.1

**Public website:** https://murdilimax.com/  
**Installation guide:** https://murdilimax.com/guide/  
**Archive:** https://murdilimax.com/downloads/MURDIWORLD_Prototype_0.1.zip

MURDIWORLD 0.1 is an **experimental Lua mod and launcher configuration** for [Luanti](https://github.com/luanti-org/luanti) and the [VoxeLibre](https://content.luanti.org/packages/Wuzzy/mineclone2/) survival game. It is NOT a new independent game engine, and it does not run in a browser.

The downloadable source ZIP includes the Windows launcher scripts, `bootstrap.ps1`, Lua source (`world-template/worldmods/mw_core/init.lua`), texture files, configuration, Russian instructions and copyright notices. The ZIP is 19,641 bytes (original game binaries are NOT included). First run downloads the official engine and VoxeLibre from their upstream sites. Windows 10/11 x64 is the initial target; real-world Windows launch is not yet field-verified.

## Safety and trust

- Lua game mod and launcher are downloadable for inspection; no passwords, payments or telemetry in this prototype.
- Luanti is pinned to version `5.18.0`; the PowerShell launcher verifies SHA-256 of the official engine ZIP.
- VoxeLibre comes from official ContentDB, pinned release 39534; game licenses and credits are preserved.
- Two-player LAN setup provided with `SERVER.cmd` and `JOIN.cmd`, port UDP 30000.
- Never run the local server and singleplayer client simultaneously against one save directory.
- Data is saved locally in `save/murdiworld`. Backups with `BACKUP.cmd`.

**Published ZIP SHA-256:** `f3fbd194049b6bf9db681aac60da726f2fbc1c61ba87458efb871cdd3e6d93b2`

## Upstream attribution

Luanti's and VoxeLibre's own developers retain their copyrights and trademarks. VoxeLibre code is GPL-3.0-or-later and media has additional license terms. The original MURDIWORLD addition and scripts are distributed under the terms included in the ZIP; see `THIRD-PARTY-NOTICES.txt`. This project is not affiliated with Minecraft, Mojang, Microsoft, or Roblox.

The old MURDILIMAX Recovery site remains at https://murdilimax.com/recovery/.
