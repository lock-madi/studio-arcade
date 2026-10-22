# Studio Arcade

The offline arcade for the Senior Interaction Design Showcase. Each game lives in its own folder in `games/`, and `index.html` is the arcade.

## Students: start here

You submit your game by opening a pull request that adds **one folder** to `games/`.

1. **Get your game ready** with the **[Game Submission Guide](GUIDE.md)**, Steps 1 to 3: export it (built with Claude? there's a prompt to paste), make `thumbnail.png`, and write `meta.json`.
2. **Test and submit it** with the steps below. They match Steps 4 and 5 of the guide.

Stuck? The guide's Troubleshooting table covers the common problems. If the checker reports something you can't fix, paste its message into the Claude conversation where you built the game.

## Submit your game

### 1. Fork and clone (once)

1. Click **Fork** at the top right of this page, then **Create fork**.
2. Clone your fork and make a branch for your game:

   ```
   git clone https://github.com/YOUR-USERNAME/studio-arcade.git
   cd studio-arcade
   git checkout -b add-lastname-game-title
   ```

### 2. Add your game folder

Copy your finished game folder into `games/`. It must look like the classmates' folders already there (for example `games/walsh-the-catch/`):

```
games/
  okafor-astro-dodge/      lowercase-with-hyphens: lastname-game-title
    index.html             starts the game
    thumbnail.png          1280x720
    meta.json              title, name, controls, devices
    ...everything else your game needs
```

### 3. Check it and play it in the arcade

```
python3 check_games.py --write        (Windows: py check_games.py --write)
```

Fix everything marked **FAIL** and run it again until your folder has none. Then turn Wi-Fi off and start the arcade:

```
python3 -m http.server 8080           (Windows: py -m http.server 8080)
```

Open `http://localhost:8080` in Chrome, click your game's card, and play it. Esc or the Exit button returns to the menu. Add `?device=tablet` to the address to see the iPad view. Press Ctrl+C in the terminal to stop the arcade.

### 4. Commit only your folder

`--write` changed `index.html` so you could test. **Don't commit that change.** Add only your folder:

```
git checkout -- index.html
git add games/okafor-astro-dodge
git commit -m "Add Astro Dodge by Maya Okafor"
git push -u origin add-lastname-game-title
```

### 5. Open a pull request

1. On your fork's page on GitHub, click **Compare & pull request** (or **Contribute → Open pull request**).
2. Title it `Add <game title> by <your name>` and click **Create pull request**.
3. Wait about a minute for the **Arcade check** at the bottom of the pull request:
   - Green check: ready. Your instructor will review and merge it.
   - Red X: click **Details**, read the report, fix the problems, then commit and push again. The pull request updates and the check runs again automatically.

Your first pull request may say the check is waiting for approval. That's normal for a first contribution, and your instructor will start it.

## Rules

- One folder per student, only inside `games/`. Don't change `index.html`, `check_games.py` or anyone else's folder.
- No internet: every file your game uses lives in your folder.
- No single file over 100 MB (GitHub rejects it), and keep the whole folder under 100 MB.

## For the instructor

- **Review:** open a pull request, check that the Arcade check is green, then **Merge**. A workflow then adds the game to the GAMES list in `index.html` automatically, within about a minute.
- **First-time contributors:** if a student's check says it's waiting for approval, click **Approve and run workflows** on the pull request.
- **Visit day:** on the laptop, `git pull`, then `python3 -m http.server 8080` with Wi-Fi off. To refresh the game list by hand, run `python3 check_games.py --write`, or use **Actions → Update arcade game list → Run workflow**.
- **iPad:** copy the whole folder to the iPad after the final `git pull`.
