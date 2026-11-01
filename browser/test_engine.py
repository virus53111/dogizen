"""Process-health regression tests (including Windows; no browser required)."""
import os
import unittest
from engine import launch_command, pid_alive

class ProcessTests(unittest.TestCase):
    def test_own_pid_is_alive_without_termination(self):
        pid = os.getpid()
        self.assertTrue(pid_alive(pid))
        # This assertion must run after pid_alive to catch destructive Windows probes.
        self.assertEqual(os.getpid(), pid)

    def test_nonexistent_pid_is_dead(self):
        self.assertFalse(pid_alive(-1))

    def test_launch_arguments_are_not_shell_commands(self):
        command = launch_command("a" * 32)
        self.assertIsInstance(command, list)
        self.assertIn("--run-profile", command)
        self.assertEqual(command[-1], "a" * 32)

if __name__ == "__main__":
    unittest.main()
