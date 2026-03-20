# Caliber Demo GIF — ~7 seconds
# Before/after score in a tight loop

Output assets/demo.gif

Set Shell "bash"
Set FontSize 16
Set Width 750
Set Height 280
Set Padding 12
Set TypingSpeed 30ms
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set WindowBarSize 40
Set BorderRadius 8
Set Framerate 24
Set PlaybackSpeed 1.8
Set LoopOffset 75%

Hide
Type "export CALIBER_SKIP_UPDATE_CHECK=1 && cd /tmp/caliber-demo-repo && git checkout before-init -q && clear"
Enter
Sleep 2s
Show

Sleep 300ms

# Before: 47/100
Type "caliber score | head -5"
Enter
Sleep 4s
Sleep 1.5s

# Switch + After: 94/100
Hide
Type "git checkout after-init -q && clear"
Enter
Sleep 1s
Show
Type "caliber score | head -5"
Enter
Sleep 4s
Sleep 1.5s
