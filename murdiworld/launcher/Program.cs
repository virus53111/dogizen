using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.IO.Compression;
using System.Net;
using System.Windows.Forms;

namespace Murdiworld;

internal static class Program
{
    private static readonly string Install = AppContext.BaseDirectory;
    private static readonly string Data = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MURDIWORLD");
    private static readonly string World = Path.Combine(Data, "world");
    private static readonly string Engine = Path.Combine(Install, "engine", "bin", "luanti.exe");
    private static readonly string Game = Path.Combine(Install, "engine", "games", "mineclone2", "game.conf");
    private static readonly string Template = Path.Combine(Install, "world-template");
    private static readonly string Config = Path.Combine(Install, "config");
    private static Process? running;
    private static Form? window;
    private static Label? status;
    private static Button? playButton;
    private static Button? serverButton;

    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Length > 0 && args[0] == "--self-test")
        {
            try
            {
                CheckInstallation();
                var t = Path.Combine(Path.GetTempPath(), "mw-health-" + Guid.NewGuid().ToString("N"));
                try
                {
                    CopyDirectory(Template, Path.Combine(t, "world"), false);
                    if (!File.Exists(Path.Combine(t, "world", "world.mt"))) return 2;
                    if (!File.Exists(Path.Combine(t, "world", "worldmods", "mw_core", "init.lua"))) return 3;
                    if (!File.Exists(Path.Combine(t, "world", "worldmods", "mw_adventure", "init.lua"))) return 4;
                }
                finally { if (Directory.Exists(t)) Directory.Delete(t, true); }
                return 0;
            }
            catch { return 1; }
        }
        ApplicationConfiguration.Initialize();
        try { Application.Run(CreateWindow()); }
        catch (Exception ex)
        {
            MessageBox.Show("Ошибка MURDIWORLD:\n" + ex.Message,
                "MURDIWORLD", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
        return 0;
    }

    private static void CheckInstallation()
    {
        if (!File.Exists(Engine))
            throw new IOException("Отсутствует игровой движок Luanti. Установи MURDIWORLD заново с официального сайта.");
        if (!File.Exists(Game))
            throw new IOException("Не найдены игровые файлы VoxeLibre. Установи полную версию игры.");
        if (!File.Exists(Path.Combine(Template, "world.mt")))
            throw new IOException("Нет шаблона мира MURDIWORLD. Переустанови игру.");
        if (!File.Exists(Path.Combine(Template, "worldmods", "mw_core", "init.lua")) ||
            !File.Exists(Path.Combine(Template, "worldmods", "mw_adventure", "init.lua")))
            throw new IOException("Игровые задания не установлены. Переустанови MURDIWORLD.");
        if (!File.Exists(Path.Combine(Config, "solo.conf")) ||
            !File.Exists(Path.Combine(Config, "server.conf")))
            throw new IOException("Конфигурация игры не найдена. Переустанови MURDIWORLD.");
    }

    private static void CopyDirectory(string from, string to, bool overwrite)
    {
        Directory.CreateDirectory(to);
        foreach (string sub in Directory.EnumerateDirectories(from))
            CopyDirectory(sub, Path.Combine(to, Path.GetFileName(sub)), overwrite);
        foreach (string file in Directory.EnumerateFiles(from))
        {
            string dest = Path.Combine(to, Path.GetFileName(file));
            File.Copy(file, dest, overwrite);
        }
    }

    private static void PrepareWorld()
    {
        CheckInstallation();
        Directory.CreateDirectory(Data);
        if (!File.Exists(Path.Combine(World, "world.mt")))
        {
            if (Directory.Exists(World) && Directory.EnumerateFileSystemEntries(World).Any())
                throw new IOException("Найден неполный мир. Игровые данные сохранены без изменений: " + World);
            CopyDirectory(Template, World, false);
        }
        else
        {
            // Never overwrite the saved terrain DB, inventories, player DB or world.mt.
            string mods = Path.Combine(Template, "worldmods");
            foreach (string mod in Directory.EnumerateDirectories(mods))
                CopyDirectory(mod, Path.Combine(World, "worldmods", Path.GetFileName(mod)), true);
        }
    }

    private static void RunGame(string mode, string? host = null, string? playerName = null)
    {
        try
        {
            if (running != null && !running.HasExited)
            {
                MessageBox.Show("Игра или локальный сервер уже запущены. Закрой их перед новым запуском.",
                    "MURDIWORLD", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            PrepareWorld();
            var psi = new ProcessStartInfo(Engine)
            {
                WorkingDirectory = Path.GetDirectoryName(Engine)!,
                UseShellExecute = false
            };
            if (mode == "server")
            {
                psi.ArgumentList.Add("--server");
                psi.ArgumentList.Add("--world");
                psi.ArgumentList.Add(World);
                psi.ArgumentList.Add("--config");
                psi.ArgumentList.Add(Path.Combine(Config, "server.conf"));
            }
            else if (mode == "join")
            {
                psi.ArgumentList.Add("--address");
                psi.ArgumentList.Add(host!);
                psi.ArgumentList.Add("--port");
                psi.ArgumentList.Add("30000");
                psi.ArgumentList.Add("--name");
                psi.ArgumentList.Add(playerName!);
                psi.ArgumentList.Add("--config");
                psi.ArgumentList.Add(Path.Combine(Config, "solo.conf"));
            }
            else
            {
                psi.ArgumentList.Add("--go");
                psi.ArgumentList.Add("--world");
                psi.ArgumentList.Add(World);
                psi.ArgumentList.Add("--config");
                psi.ArgumentList.Add(Path.Combine(Config, "solo.conf"));
            }
            running = Process.Start(psi) ?? throw new IOException("Luanti не запустился.");
            running.EnableRaisingEvents = true;
            SetStatus(mode == "server" ? "Локальный сервер запущен · UDP 30000" :
                mode == "join" ? "Подключаемся к серверу..." : "Игра запущена. Приятного приключения!");
            if (playButton != null) playButton.Enabled = false;
            if (serverButton != null) serverButton.Enabled = false;
            running.Exited += (_, _) =>
            {
                try
                {
                    if (window is { IsDisposed: false })
                        window.BeginInvoke((Action)(() =>
                        {
                            SetStatus("Готово к игре · мир сохранён в AppData");
                            if (playButton != null) playButton.Enabled = true;
                            if (serverButton != null) serverButton.Enabled = true;
                        }));
                }
                catch (InvalidOperationException) { }
            };
        }
        catch (Exception ex)
        {
            SetStatus("Не удалось запустить игру");
            MessageBox.Show(ex.Message, "MURDIWORLD — ошибка запуска",
                MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private static void SetStatus(string message)
    {
        if (status != null) status.Text = message;
    }

    private static Button AddButton(Control parent, string text, int top, Color color, EventHandler click)
    {
        var b = new Button
        {
            Text = text,
            Bounds = new Rectangle(36, top, 432, 49),
            FlatStyle = FlatStyle.Flat,
            BackColor = color,
            ForeColor = Color.FromArgb(16, 27, 34),
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            Cursor = Cursors.Hand,
            TabStop = true
        };
        b.FlatAppearance.BorderSize = 0;
        b.Click += click;
        parent.Controls.Add(b);
        return b;
    }

    private static Form CreateWindow()
    {
        var form = new Form
        {
            Text = "MURDIWORLD — Crystal Adventure 0.2",
            ClientSize = new Size(504, 590),
            FormBorderStyle = FormBorderStyle.FixedSingle,
            MaximizeBox = false,
            StartPosition = FormStartPosition.CenterScreen,
            BackColor = Color.FromArgb(11, 22, 31),
            ForeColor = Color.White,
            AutoScaleMode = AutoScaleMode.Font
        };
        window = form;
        form.Paint += (_, e) =>
        {
            using var brush = new LinearGradientBrush(form.ClientRectangle,
                Color.FromArgb(15, 34, 45), Color.FromArgb(8, 20, 33),
                LinearGradientMode.Vertical);
            e.Graphics.FillRectangle(brush, form.ClientRectangle);
        };
        var logo = Path.Combine(Install, "assets", "MURDIWORLD-logo.png");
        if (File.Exists(logo))
        {
            var image = new PictureBox
            {
                Bounds = new Rectangle(36, 20, 432, 156),
                SizeMode = PictureBoxSizeMode.Zoom,
                Image = Image.FromFile(logo)
            };
            form.Controls.Add(image);
        }
        var h = new Label
        {
            Text = "CRYSTAL ADVENTURE",
            Bounds = new Rectangle(36, 178, 432, 34),
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            ForeColor = Color.FromArgb(198, 248, 131)
        };
        form.Controls.Add(h);
        var sub = new Label
        {
            Text = "Исследуй мир · Найди кристаллы · Победи стража",
            Bounds = new Rectangle(18, 211, 468, 36),
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 10),
            ForeColor = Color.FromArgb(191, 208, 210)
        };
        form.Controls.Add(sub);
        playButton = AddButton(form, "▶  ИГРАТЬ", 263, Color.FromArgb(191, 241, 114), (_, _) => RunGame("play"));
        serverButton = AddButton(form, "⌂  СОЗДАТЬ ЛОКАЛЬНЫЙ СЕРВЕР", 324, Color.FromArgb(136, 212, 236),
            (_, _) => RunGame("server"));
        AddButton(form, "⇄  ПОДКЛЮЧИТЬСЯ К ДРУГУ", 385,
            Color.FromArgb(192, 169, 251), (_, _) => ShowJoin());
        AddButton(form, "▣  ПАПКА СОХРАНЕНИЙ", 446, Color.FromArgb(162, 182, 187),
            (_, _) =>
            {
                Directory.CreateDirectory(Data);
                Process.Start(new ProcessStartInfo("explorer.exe")
                { UseShellExecute = true, ArgumentList = { Data } });
            });
        status = new Label
        {
            Bounds = new Rectangle(36, 510, 432, 34),
            Text = "Версия 0.2 · Работает без Интернета после установки",
            ForeColor = Color.FromArgb(175, 198, 199),
            Font = new Font("Segoe UI", 9),
            TextAlign = ContentAlignment.MiddleCenter
        };
        form.Controls.Add(status);
        var help = new LinkLabel
        {
            Text = "murdilimax.com/guide/  ·  помощь и управление",
            Bounds = new Rectangle(36, 545, 432, 27),
            TextAlign = ContentAlignment.MiddleCenter,
            LinkColor = Color.FromArgb(144, 225, 244),
            ActiveLinkColor = Color.White
        };
        help.LinkClicked += (_, _) => Process.Start(new ProcessStartInfo(
            "https://murdilimax.com/guide/") { UseShellExecute = true });
        form.Controls.Add(help);
        return form;
    }

    private static void ShowJoin()
    {
        var dialog = new Form
        {
            Text = "MURDIWORLD — подключение",
            ClientSize = new Size(390, 230),
            StartPosition = FormStartPosition.CenterParent,
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            MinimizeBox = false,
            BackColor = Color.FromArgb(18, 34, 47),
            ForeColor = Color.White
        };
        dialog.Controls.Add(new Label { Text = "Адрес сервера (например 192.168.1.20):",
            Location = new Point(18, 17), AutoSize = true });
        var address = new TextBox { Bounds = new Rectangle(18, 46, 352, 29),
            Text = "127.0.0.1" };
        dialog.Controls.Add(address);
        dialog.Controls.Add(new Label { Text = "Имя игрока (латиница):",
            Location = new Point(18, 92), AutoSize = true });
        var name = new TextBox { Bounds = new Rectangle(18, 121, 352, 29), Text = "Explorer" };
        dialog.Controls.Add(name);
        var connect = new Button { Text = "ПОДКЛЮЧИТЬСЯ", Bounds = new Rectangle(18, 169, 352, 41),
            BackColor = Color.FromArgb(194, 239, 123), FlatStyle = FlatStyle.Flat,
            ForeColor = Color.FromArgb(12, 30, 20), Font = new Font("Segoe UI", 10, FontStyle.Bold) };
        connect.FlatAppearance.BorderSize = 0;
        connect.Click += (_, _) =>
        {
            var host = address.Text.Trim();
            var player = name.Text.Trim();
            if (host.Length == 0 || host.Length > 253 ||
                host.Any(c => !(char.IsAsciiLetterOrDigit(c) || c is '.' or '-' or ':')) ||
                !System.Text.RegularExpressions.Regex.IsMatch(player, @"^[A-Za-z][A-Za-z0-9_]{2,19}$"))
            {
                MessageBox.Show("Проверь адрес и имя игрока (3–20 латинских символов).",
                    "MURDIWORLD", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            dialog.Close();
            RunGame("join", host, player);
        };
        dialog.Controls.Add(connect);
        dialog.ShowDialog(window);
    }
}
