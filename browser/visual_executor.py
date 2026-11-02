"""Serial visual flow executor for opt-in browser actions.

Never performs actions on unrelated profiles. A failed action stops the flow,
but previous navigation or clicks cannot be rolled back. Work is synchronous;
desktop GUI must run it on a background thread.
"""
from __future__ import annotations

import threading

from visual_workflows import validated_flow
from visual_ipc import submit_visual_step


def run_visual_flow(store, flow, *, cancel=None, notify=None,
                    verify=None, alive=None, dispatch=None):
    from engine import pid_alive, verify_commercial_access
    from navigation_commands import _active_session
    from launch_guard import launch_pending
    plan = validated_flow(flow)
    cancel = cancel if cancel is not None else threading.Event()
    verify = verify if verify is not None else verify_commercial_access
    alive = alive if alive is not None else pid_alive
    dispatch = dispatch if dispatch is not None else submit_visual_step
    # Preflight *all* profiles and live entitlement before touching pages.
    for profile in plan["profile_ids"]:
        folder, _session = _active_session(store, profile, alive=alive)
        if launch_pending(folder) or (folder / ".cookie-maintenance").exists() or (
                folder / ".addon-maintenance").exists():
            raise RuntimeError("Selected profile is still starting or under maintenance")
        verify(store, profile)
    done = 0
    for i, step in enumerate(plan["steps"]):
        if cancel.is_set():
            return {"state": "cancelled", "actions": done}
        if notify:
            notify(i + 1, len(plan["steps"]))
        if step["kind"] == "wait":
            if cancel.wait(step["seconds"]):
                return {"state": "cancelled", "actions": done}
            continue
        for profile in plan["profile_ids"]:
            if cancel.is_set():
                return {"state": "cancelled", "actions": done}
            # Dispatcher re-checks both entitlement and live child PID/token.
            dispatch(store, profile, step, verify=verify, alive=alive, cancel=cancel)
            done += 1
    return {"state": "completed", "actions": done}
