"""Windows Tk GUI smoke for Murdilimax's own neon visual card editor."""
from __future__ import annotations
import tempfile
import tkinter as tk
from types import SimpleNamespace
from unittest.mock import patch
from pathlib import Path
from store import Store
from visual_studio_ui import FlowEditor
from visual_workflows import list_flows

def main():
    with tempfile.TemporaryDirectory() as temp:
        store = Store(Path(temp) / "local")
        profile = store.add_profile("Design QA")
        second = store.add_profile("Target 2")
        root = tk.Tk()
        root.withdraw()
        saved = []
        try:
            editor = FlowEditor(root, store, [profile["id"]],
                                on_saved=lambda plan: saved.append(plan))
            editor.window.update()
            # Target chooser is strictly local; cancel never changes saved targets.
            for ids in ([], [profile["id"], profile["id"]],
                        ["f" * 32], [3]):
                try:
                    editor.set_target_profiles(ids)
                    assert False, "Invalid target selection accepted"
                except ValueError:
                    pass
            assert editor.profile_ids == [profile["id"]]
            chooser_window = editor.choose_profiles()
            chooser = next(
                item for child in chooser_window.winfo_children()
                for item in child.winfo_children()
                if isinstance(item, tk.Listbox))
            chooser.selection_set(1)
            apply_button = next(
                item for child in chooser_window.winfo_children()
                for item in child.winfo_children()
                if isinstance(item, tk.Button)
                and item.cget("text") == "ПРИМЕНИТЬ")
            apply_button.invoke()
            assert editor.profile_ids == [profile["id"], second["id"]]
            assert editor.profile_count.cget("text") == "ПРОФИЛЕЙ: 2"
            cancelled = editor.choose_profiles()
            cancel_button = next(
                item for child in cancelled.winfo_children()
                for item in child.winfo_children()
                if isinstance(item, tk.Button)
                and item.cget("text") == "ОТМЕНА")
            cancel_button.invoke()
            assert editor.window.grab_current() == editor.window
            assert editor.profile_ids == [profile["id"], second["id"]]
            # Check native wheel dispatch without relying on CI pixel rounding.
            editor.steps = [{"kind": "wait", "seconds": 1}] * 12
            editor.redraw()
            editor.window.update()
            assert editor.canvas.yview()[1] < 1.0
            with patch.object(editor.canvas, "yview_scroll",
                              wraps=editor.canvas.yview_scroll) as scrolled:
                assert editor._scroll_flow(SimpleNamespace(num=None, delta=-120)) == "break"
                scrolled.assert_called_once_with(1, "units")
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
            assert list_flows(store)[0]["profile_ids"] == [
                profile["id"], second["id"]]

            existing = list_flows(store)[0]
            clean = FlowEditor(root, store, existing["profile_ids"], flow=existing)
            with patch("visual_studio_ui.messagebox.askyesno",
                       side_effect=AssertionError("Unmodified flow must close silently")):
                clean.request_close()
            assert not clean.window.winfo_exists()

            changed = FlowEditor(root, store, existing["profile_ids"], flow=existing)
            changed.name.delete(0, tk.END)
            changed.name.insert(0, "Unsaved title")
            with patch("visual_studio_ui.messagebox.askyesno", return_value=False) as asked:
                changed.request_close()
                asked.assert_called_once()
            assert changed.window.winfo_exists()
            with patch("visual_studio_ui.messagebox.askyesno", return_value=True):
                changed.request_close()
            assert not changed.window.winfo_exists()
            assert list_flows(store)[0]["name"] == "My Own Neon Flow"
            assert list_flows(store)[0]["profile_ids"] == [
                profile["id"], second["id"]]
        finally:
            root.destroy()
    print("PASS: original Neon Flow Studio card canvas, reorder and persistence")

if __name__ == "__main__":
    main()
