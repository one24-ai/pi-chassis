# Git workflows

Slash commands for the git chores you do every day. None of them needs you to explain anything to the model: they read the repository themselves, and where a message helps, the model drafts it from the diff in a one-off request that never enters your conversation. You always see the draft in an editor before anything happens.

| Command | What it does |
|---|---|
| `/commit [message]` | Commits what is staged. With nothing staged it lists the files (the first 15, then "and N more"), asks, then stages everything (`git add -A`); if you then cancel the editor or leave the message empty, the staging area is put back as it was. With no message the model drafts one from the staged diff and your recent commit subjects; you edit or accept it. A message you type is used as is |
| `/push` | Pushes the current branch to the remote branch of the same name and says exactly where ("Push 2 commits on feat to origin/feat?"), publishing it with that upstream the first time. A branch started from `origin/main` is pushed to `origin/feat`, never to `main`. Asks first. Refuses when the branch is behind its remote branch. An upstream deleted on the remote counts as not published |
| `/merge [branch\|abort]` | Merges a branch (picked from a list if you give none) into the current one. Asks first. Refuses with uncommitted changes. On conflicts it lists the files and stops; `/merge abort` restores the tree |
| `/pr [base] [--draft]` | Pushes if needed (asking), drafts the title and description from the commits and the diff against the base, lets you edit them (the first line is the title), then opens the request. The base defaults to the remote's default branch. The push step names the exact target branch |
| `/git [status\|on\|off]` | A menu of the above, the branch, upstream, ahead/behind and change counts, or the off switch |

It is plain git and works with any remote. `/pr` uses the forge's own CLI, so it works with any host that CLI is signed in to: [`gh`](https://cli.github.com) for GitHub and GitHub Enterprise, [`glab`](https://gitlab.com/gitlab-org/cli) for GitLab. Run `gh auth login` (or `glab auth login`) once.

Safe by construction: git runs with argument lists, never through a shell, with no terminal of its own, so a password, ssh passphrase or gpg prompt cannot draw over pi's screen: it fails at once with a hint to sign in first (credential helper, ssh-agent or gpg-agent) and you try again; output from git, hooks and `gh` is stripped of escape sequences before it is shown; nothing force-pushes, skips hooks (`--no-verify`) or resets hard; a failing hook or push shows git's own output and leaves the repository as git left it; and everything that publishes or merges asks first. The model is the one you have selected. If it can't answer, you write the message yourself. `/git off` switches all of these commands off and `/git on` restores them. The choice is saved in `chassis.json` and applies to every running session at once. Like any slash command they are listed in the command palette (`ctrl+p`). They need the interactive UI, because they ask before they change anything; in print or JSON mode they say so on stderr and do nothing.

## Diff view

`/diff` (or `ctrl+x d`) opens a full-size panel with the changed files on the left and the selected file's diff on the right.

The diff has line numbers and tinted added and removed lines. The list has staged, unstaged and untracked files together, each with git's two-letter code; `tab` (or a click on the tab) switches to the branch against its base, found the way `/pr` finds it: the remote's default branch (`develop` and `trunk` work too), else `main` or `master`, preferring the remote's copy because a local one can be stale. The tab names the base (`Branch vs origin/main`). Git settings such as `diff.noprefix`, `diff.mnemonicPrefix` and `diff.external` do not affect it, and files with Windows line endings show cleanly. `j`/`k` move, `enter` opens the diff pane, `]`/`[` jump between hunks, `ctrl+d`/`ctrl+u` page, `>`/`<` scroll sideways, `r` reloads, `esc` closes; the mouse clicks files and tabs and scrolls with the wheel. Below 100 columns the list and the diff take turns. Git is read when the panel opens and on `r`, never on a timer. `/widgets disable diff` switches it off.

For extensions that show their own diff there, see the [diff view API](diff-api.md).
