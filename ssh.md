Yes, VSCode works exactly the same with keys — actually better: no password prompt at all. Each of you (you + 3 sons) does this on your own laptop:

Step 1 — generate a key (in PowerShell on Windows, or Terminal on Mac — same command):


ssh-keygen -t ed25519
Press Enter at every question. This creates a key in ~/.ssh/id_ed25519.

Step 2 — send me the public key. Run:


cat ~/.ssh/id_ed25519.pub     # Mac/Linux
type $HOME\.ssh\id_ed25519.pub   # Windows PowerShell
It prints one line starting with ssh-ed25519 AAAA.... Paste all 4 lines here in the chat (the .pub file is safe to share — never share the file without .pub).

Step 3 — VSCode setup (nothing, basically). VSCode Remote-SSH automatically uses ~/.ssh/id_ed25519. If you want it explicit, each person's ~/.ssh/config looks like:


Host gym-server
    HostName 159.195.136.212
    Port 2222
    User root
    IdentityFile ~/.ssh/id_ed25519


    ================
    this while logged in to the server)
When a son sends you his public key line (the output of ssh-keygen -t ed25519 + cat ~/.ssh/id_ed25519.pub on his laptop — one line starting with ssh-ed25519 AAAA...), you append it:

    echo 'ssh-ed25519 AAAA...his-whole-key-line... son1@his-laptop' >> /root/.ssh/authorized_keys


Use >> (append), never > — a single > would overwrite the file and delete everyone's keys, including yours.
Keep the key in quotes and on one line — if it wraps or gets split when copy-pasting, it won't work.
Or, if you prefer editing visually, just open it in your VSCode window (it's a normal text file) and paste the new key on its own line.