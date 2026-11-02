"""Windows Tk GUI smoke for Murdilimax's own neon visual card editor."""
from __future__ import annotations
import tempfile
import tkinter as tk
from unittest.mock import patch
from pathlib import Path
from store import Store
from visual_studio_ui import FlowEditor
from visual_workflows import list_flows

def main():
    with tempfile.TemporaryDirectory() as temp:
        store = Store(Path(temp) / "local")
        profile = store.add_profile("Design QA")
        root = tk.Tk()
        root.withdraw()
        saved = []
        try:
            editor = FlowEditor(root, store, [profile["id"]],
                                on_saved=lambda plan: saved.append(plan))
            editor.window.update()
            with patch("visual_studio_ui.simpledialog.askstring",
                       return_value="#ready"), patch(
                       "visual_studio_ui.simpledialog.askinteger",
                       return_value=7):
                assert editor._ask_step("wait_visible") == {
                    "kind": "wait_visible", "selector": "#ready", "seconds": 7}
            editor.steps = [
                {"kind": "wait", "seconds": 1},
                {"kind": "open", "url": "https://example.org"}]
            editor.redraw()
            editor.move(0, 1)
            assert editor.steps[0]["kind"] == "open"
            editor.name.delete(0, tk.END)
            editor.name.insert(0, "My Own Neon Flow")
            editor.save()
            assert len(saved) == 1
            assert list_flows(store)[0]["name"] == "My Own Neon Flow"
            assert list_flows(store)[0]["steps"][0]["kind"] == "open"
        finally:
            root.destroy()
    print("PASS: original Neon Flow Studio card canvas, reorder and persistence")

if __name__ == "__main__":
    main()
