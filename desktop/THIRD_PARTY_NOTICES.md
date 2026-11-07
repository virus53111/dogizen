# Third-party recovery engine

The MURDILIMAX Windows installer includes **Halim Recovery**, a separate open-source
Windows data recovery application built unmodified from its public source tree.

- Upstream: https://github.com/htoklu/halim-recovery
- Author: Halim Toklu
- Copyright (c) 2026 Halim Toklu
- License: MIT (full text installed at `third-party/HALIM-LICENSE.txt`)
- Pinned upstream source commit: `3b5d66d8537432f54b76489e717387f9da198635`
- Halim Recovery 0.5.1, shipped under its own application name and identity.

Halim Recovery is invoked by the explicit “Advanced recovery (Halim Recovery · MIT)”
button. It is not represented as MURDILIMAX-original code. The two applications
are independent processes. This allows users to run the upstream NTFS/FAT32/exFAT
quick-scanning and deeper format-carving workflow in a separate tested interface.

Original README and source are available at the pinned upstream commit. Users
can also run the tools independently. Neither program can recover SSD data
already discarded by TRIM or sectors overwritten since deletion.
