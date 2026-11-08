# MURDIWORLD — Crystal Adventure 0.2

**Site:** https://murdilimax.com/  
**Windows installer (free alpha):** https://github.com/virus53111/dogizen/releases/download/v0.2.0/MURDIWORLD-Setup-0.2.0.exe  
**Instructions:** https://murdilimax.com/guide/

MURDIWORLD is an **experimental voxel fantasy survival game built with Luanti and VoxeLibre**, with its own Crystal Adventure mods. This is not a new game engine or a finished replacement for Minecraft. The high-fidelity art on the website is labeled as *concept art*; separate screenshots show real game graphics.

## Windows 0.2: Download and install normally

The Windows 10/11 64-bit installer includes everything needed to play offline:
- Official **Luanti 5.18.0** x64 binary, pinned by SHA-256.
- **VoxeLibre 0.92.4** complete open-source survival game with original GPL/media licenses.
- Original MURDIWORLD 0.1 world mod (crystal hunting, home, guide).
- Original 0.2 **Crystal Guardian** mod (3-stage quest, an interactive guardian encounter and a craftable victory lantern).
- Standalone **MURDIWORLD.exe** Windows GUI, self-contained .NET 8 (no separate .NET installation required).
- Inno Setup user-level installer with desktop/start-menu shortcut and post-install launch.

No Python, PowerShell, ZIP extraction or downloads on first game launch.
All game assets are staged into the final installer and validated by Windows CI before upload.
The installer is **not code-signed** yet, so Windows SmartScreen may display a warning.
Do not disable security software or trust unexpected copies of the EXE.

## How to play

1. Install MURDIWORLD-Setup-0.2.0.exe.
2. Open MURDIWORLD from the desktop; click **ИГРАТЬ**.
3. Find 5 original Azure Crystal ore blocks underground.
4. Type `/mwquest` to open the three-chapter quest and summon the Crystal Guardian in an open area.
5. Win the fight, combine the Guardian Heart + Azure Shard and place a Crystal Victory Lantern.

GUI buttons can start a local LAN server (UDP 30000) or connect to another LAN player.
There is **no publicly hosted multiplayer world** and public internet play needs additional networking.

## Saved games

Player saves live in `%LOCALAPPDATA%\MURDIWORLD\world`, separate from the installed game. The launcher creates a new world only if none exists, otherwise only updates the MURDIWORLD mods and leaves the saved map, inventories and `world.mt` unchanged. Back up the world before upgrades. Do not launch singleplayer and dedicated server simultaneously against one save.

## Continuous integration

`.github/workflows/murdiworld-windows.yml` downloads pinned original files, checks engine SHA-256, builds a standalone launcher, starts an actual Luanti Windows server with the game+mods, compiles the Inno Setup EXE, then silently **installs that EXE on Windows** and runs the installed launcher's self-test. Main-branch builds publish a GitHub pre-release only after all steps succeed.

A real two-player LAN field test and broad GPU/hardware QA are still required; we do not represent CI as proof the game works flawlessly on every PC.

## Original source and licenses

- Luanti: https://github.com/luanti-org/luanti
- VoxeLibre: https://git.minetest.land/VoxeLibre/VoxeLibre
- Both MURDIWORLD mods are in their source archives (0.1) or this repository (0.2).
- Source/license notices: `murdiworld/THIRD_PARTY_NOTICES.txt`; original game `LICENSE.txt`, `LEGAL.md`, `CREDITS.md` included.

The previous 0.1 ZIP prototype remains at https://murdilimax.com/downloads/MURDIWORLD_Prototype_0.1.zip for reproducibility; 0.2 users should use the Windows installer.

The older MURDILIMAX Recovery product remains at https://murdilimax.com/recovery/.
