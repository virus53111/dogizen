"""Deterministic offline tests for smooth profile refresh with 1000 rows.

The stand-in mimics only Tk Treeview methods used by the diff algorithm;
no display server or Camoufox runtime is necessary.
"""
import unittest

from profile_table import reconcile_profile_tree


class FakeTree:
    def __init__(self):
        self.items = {}
        self.order = []
        self.selected = set()
        self.calls = dict(insert=0, delete=0, move=0, update=0)

    def get_children(self, parent=""):
        assert parent == ""
        return tuple(self.order)

    def delete(self, *ids):
        self.calls["delete"] += 1
        for pid in ids:
            self.items.pop(pid)
            self.order.remove(pid)
            self.selected.discard(pid)

    def insert(self, parent, index, iid, values):
        assert parent == "" and index == "end"
        self.calls["insert"] += 1
        self.items[iid] = tuple(str(v) for v in values)
        self.order.append(iid)

    def item(self, pid, option=None, **kw):
        if option == "values":
            return self.items[pid]
        if "values" in kw:
            self.calls["update"] += 1
            self.items[pid] = tuple(str(v) for v in kw["values"])

    def index(self, pid):
        return self.order.index(pid)

    def move(self, pid, parent, index):
        assert parent == ""
        self.calls["move"] += 1
        self.order.remove(pid)
        self.order.insert(index, pid)


class ProfileTableTests(unittest.TestCase):
    @staticmethod
    def rows(count):
        return [(f"profile-{n:04}", (f"Project {n}", "Group A",
                 "", "No proxy", "native", "Stopped")) for n in range(count)]

    def test_1000_profile_refresh_does_no_tree_mutation(self):
        tree = FakeTree()
        rows = self.rows(1000)
        reconcile_profile_tree(tree, rows)
        tree.selected = {"profile-0799", "profile-0950"}
        initial = tree.calls.copy()
        for _ in range(10):
            counts = reconcile_profile_tree(tree, rows)
            self.assertEqual(counts, dict(inserted=0, deleted=0, updated=0, moved=0))
        self.assertEqual(tree.calls, initial)
        self.assertEqual(tree.selected, {"profile-0799", "profile-0950"})

    def test_one_status_change_updates_one_row_without_selection_loss(self):
        tree = FakeTree()
        rows = self.rows(500)
        reconcile_profile_tree(tree, rows)
        tree.selected.add("profile-0240")
        edited = list(rows)
        edited[239] = ("profile-0239", ("Project 239", "Group A", "",
                                       "No proxy", "native", "Running"))
        counts = reconcile_profile_tree(tree, edited)
        self.assertEqual(counts, dict(inserted=0, deleted=0, updated=1, moved=0))
        self.assertIn("profile-0240", tree.selected)
        self.assertEqual(tree.items["profile-0239"][-1], "Running")

    def test_filter_only_removes_filtered_out_rows(self):
        tree = FakeTree()
        rows = self.rows(200)
        reconcile_profile_tree(tree, rows)
        tree.selected.update({"profile-0010", "profile-0120"})
        filtered = rows[:80]
        counts = reconcile_profile_tree(tree, filtered)
        self.assertEqual(counts["deleted"], 120)
        self.assertEqual(counts["inserted"], 0)
        self.assertEqual(counts["updated"], 0)
        self.assertEqual(counts["moved"], 0)
        self.assertEqual(tree.selected, {"profile-0010"})
        self.assertEqual(tree.order, [pid for pid, _ in filtered])

    def test_reorder_and_insert_preserve_values(self):
        tree = FakeTree()
        reconcile_profile_tree(tree, self.rows(5))
        desired = [self.rows(5)[2], self.rows(5)[0],
                   ("profile-new", ("Added", "", "", "", "", "Stopped")),
                   self.rows(5)[4]]
        counts = reconcile_profile_tree(tree, desired)
        self.assertEqual(tree.order, [pid for pid, _ in desired])
        self.assertEqual(counts["deleted"], 2)
        self.assertEqual(counts["inserted"], 1)
        self.assertGreaterEqual(counts["moved"], 1)

    def test_duplicate_identifiers_rejected_before_any_change(self):
        tree = FakeTree()
        reconcile_profile_tree(tree, self.rows(3))
        initial = tree.calls.copy()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            reconcile_profile_tree(tree, [self.rows(3)[0], self.rows(3)[0]])
        self.assertEqual(tree.calls, initial)
        self.assertEqual(tree.order, [pid for pid, _ in self.rows(3)])

    def test_invalid_id_rejected(self):
        tree = FakeTree()
        with self.assertRaisesRegex(ValueError, "Invalid"):
            reconcile_profile_tree(tree, [(None, ("x",))])
        self.assertFalse(tree.items)


if __name__ == "__main__":
    unittest.main()
