"""Opt-in visual Flow execution in serial or bounded parallel profile mode.

Actions never cross profile sessions. Parallel mode dispatches each *step*
to selected live profiles concurrently and waits for all acknowledgements
before proceeding. It does not mirror raw mouse/keyboard input. Cancellation
or a failure stops future steps; side effects already applied cannot roll back.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
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
    targets = plan["profile_ids"]
    parallel = plan["execution_mode"] == "parallel" and len(targets) > 1

    # Preflight every selected profile and server entitlement before any actions.
    for profile in targets:
        folder, _session = _active_session(store, profile, alive=alive)
        if launch_pending(folder) or (folder / ".cookie-maintenance").exists() or (
                folder / ".addon-maintenance").exists():
            raise RuntimeError("Selected profile is still starting or under maintenance")
        verify(store, profile)

    done = 0

    def execute_one(profile, step):
        if cancel.is_set():
            return False
        # The dispatcher checks entitlement and exact live PID/session again.
        dispatch(store, profile, step, verify=verify, alive=alive, cancel=cancel)
        return True

    def execute_steps(pool):
        nonlocal done
        for i, step in enumerate(plan["steps"]):
            if cancel.is_set():
                return {"state": "cancelled", "actions": done}
            if notify:
                notify(i + 1, len(plan["steps"]))
            if step["kind"] == "wait":
                if cancel.wait(step["seconds"]):
                    return {"state": "cancelled", "actions": done}
                continue
            if pool is None:
                for profile in targets:
                    if cancel.is_set():
                        return {"state": "cancelled", "actions": done}
                    if execute_one(profile, step):
                        done += 1
                continue

            # All selected profiles receive the same validated step. The next
            # step cannot start until every dispatched action is acknowledged.
            futures = [pool.submit(execute_one, profile, step) for profile in targets]
            failure = None
            for future in as_completed(futures):
                try:
                    if future.result():
                        done += 1
                except Exception as exc:
                    if failure is None:
                        failure = exc
                    cancel.set()  # Stop waiting peers and all future steps.
            if failure is not None:
                raise failure
            if cancel.is_set():
                return {"state": "cancelled", "actions": done}
        return {"state": "completed", "actions": done}

    if not parallel:
        return execute_steps(None)
    with ThreadPoolExecutor(max_workers=len(targets),
                            thread_name_prefix="murdilimax-flow") as pool:
        return execute_steps(pool)
