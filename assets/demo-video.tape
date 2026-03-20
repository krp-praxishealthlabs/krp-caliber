# Caliber Demo Video — ~20 seconds
# Score before → score after → show what was generated

Output assets/demo.mp4

Set Shell "bash"
Set FontSize 16
Set Width 750
Set Height 350
Set Padding 12
Set TypingSpeed 30ms
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set WindowBarSize 40
Set BorderRadius 8
Set Framerate 30
Set PlaybackSpeed 1.6

Hide
Type "export CALIBER_SKIP_UPDATE_CHECK=1 && cd /tmp/caliber-demo-repo && git checkout before-init -q && clear"
Enter
Sleep 2s
Show

Sleep 300ms

# ── Before: 47/100 ────────────────────────────────
Type "caliber score | head -5"
Enter
Sleep 5s
Sleep 2s

# ── After: 94/100 ─────────────────────────────────
Hide
Type "git checkout after-init -q && clear"
Enter
Sleep 1s
Show
Type "caliber score | head -5"
Enter
Sleep 5s
Sleep 2s

# ── What was generated ────────────────────────────
Type "ls CLAUDE.md AGENTS.md .claude/skills/ .cursor/rules/"
Enter
Sleep 4s
Sleep 3s
