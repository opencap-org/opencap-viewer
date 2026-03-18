This document lists the changes to `opencap-viewer` for each version. 
When possible, we provide the GitHub issues or pull requests that are related
to the items below. If there is no issue or pull
request related to the change, then we may provide the commit.

This is not a comprehensive list of changes but rather a hand-curated collection of the more notable ones. For a comprehensive history, see the [OpenCap Viewer GitHub repo](https://github.com/stanfordnmbl/opencap-viewer).

v2.0
======
- Major responsive UI overhaul across core pages (sessions, subjects, recycle bin, connect/calibration/neutral/session flows, and dashboards) with improved mobile/tablet layouts and navigation patterns.
- Added a new session-start flow with dedicated `RecordingMode` and `DeviceCheck` pages so users can choose monocular vs multi-phone recording and same-device vs QR setup paths.
- Expanded monocular recording support across routing and page logic (`isMono` flow), including direct progression from setup to neutral/session where appropriate.
- Added configurable mobile deep-link support for the 'open in app' ios button.
- Updated QR/session connection UX with clearer app-version requirements (OpenCap app 2.0+) and better call-to-action messaging for mobile onboarding.
- Redesigned Dashboard and Analysis Dashboard interactions with collapsible sidebars, mobile overlays/floating controls, and improved empty-state handling.
- Added keyboard playback controls in the visualizer (`Space` play/pause, `ArrowLeft` previous frame, `ArrowRight` next frame) and additional mobile playback/layout refinements.

v1.0.1
======
- Added functionality to search for sessions by name or ID. (PR #436)
- Added delays to the Recording button for better user experience. (#438)
- Fixed issues with shadows not appearing at the edges of the scene. (#441)
- Show videos when an analysis failed (if videos were uploaded). (#428)
