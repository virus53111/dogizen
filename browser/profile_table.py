"""Incremental tree rendering for large local Murdilimax profile tables.

Only mutate Treeview rows whose identity, values or order changed. A periodic
status refresh with no changes performs ZERO insert/delete/move/update calls.
This module never edits stored profiles, cookie data, proxies or licensing.
"""
from __future__ import annotations


def reconcile_profile_tree(tree, rows):
    """Synchronize Treeview with [(id, values)] preserving stable selection.

    Rows are staged and duplicate-checked before touching the widget. A
    refresh with identical rows is a no-op. Stale selections are dropped
    automatically by Tk when a filtered-out row disappears.
    Returns a dictionary with changed operation counts for diagnostics.
    """
    desired = list(rows)
    ids = [pid for pid, _ in desired]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate profile identifier in the visible table")
    if not all(isinstance(pid, str) and pid for pid in ids):
        raise ValueError("Invalid profile identifier in the visible table")

    old = tuple(tree.get_children(""))
    target_set = set(ids)
    removed = [pid for pid in old if pid not in target_set]
    counts = {"inserted": 0, "deleted": 0, "updated": 0, "moved": 0}
    if removed:
        tree.delete(*removed)
        counts["deleted"] += len(removed)

    existing = set(old) - set(removed)
    for pid, values in desired:
        rendered = tuple(str(value) for value in values)
        if pid not in existing:
            tree.insert("", "end", iid=pid, values=rendered)
            existing.add(pid)
            counts["inserted"] += 1
        elif tuple(str(v) for v in tree.item(pid, "values")) != rendered:
            tree.item(pid, values=rendered)
            counts["updated"] += 1

    # The order check avoids all expensive moves during unchanged refreshes.
    if tuple(tree.get_children("")) != tuple(ids):
        for index, pid in enumerate(ids):
            if tree.index(pid) != index:
                tree.move(pid, "", index)
                counts["moved"] += 1
    return counts
