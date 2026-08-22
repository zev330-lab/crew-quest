# Crew Quest — working state as of 2026-08-22

A two-device scavenger hunt for a 9-year-old commander and a 6-year-old field
agent who cannot read. **Both halves are built, tested, installed and live.**

---

## What exists and where

| Piece | Location | State |
|---|---|---|
| Phone app (commander) | `~/dev/crew-quest/index.html` | Live at https://zev330-lab.github.io/crew-quest/ |
| Watch app (field agent) | `~/dev/parker-watch-apps/Apps/CrewQuest` | Installed on both watches |
| Phone repo | `github.com/zev330-lab/crew-quest` | pushed, clean |
| Watch repo | `github.com/zev330-lab/parker-watch-apps` | pushed, clean |

Both repos were clean and fully pushed at closeout.

---

## The design, and why it is shaped this way

**One cadence, repeated nine times.** The commander presses a button and says
"go". The field agent's watch speaks his instruction aloud. He either *confirms*
or *reads her three digits*. She types it in. The next destination or challenge
opens.

**Codes travel one direction only — agent to commander.** She never reads a
number to him. Earlier versions had a two-way handshake and it was genuinely
confusing; the one-way rule reduced a six-year-old's job to *listen, then say
three numbers*.

**Nothing about the field agent's job requires reading.** Every step speaks
itself automatically on appear. This is the reason the watch exists at all.

**Neither child can advance alone.** Her phone holds no field instructions and
no plaintext codes — only one-way hashes. His watch holds no destinations she
can read. The interlock is structural, not a rule anybody has to enforce.

### The nine steps

| # | Beat | Content |
|---|---|---|
| 1 | confirm | Crew name agreement |
| 2 | code `417` | Unlocks **Wayside Country Store**, 1015 Boston Post Rd E |
| 3 | confirm | Find the oldest thing in the shop |
| 4 | code `823` | Only he may ask a grown-up the building's year |
| 5 | code `940` | Unlocks **Trombetta's Farm**, 655 Farm Rd |
| 6 | confirm | Mini golf, one score for the whole crew |
| 7 | code `372` | Ice cream nobody has had ($25) |
| 8 | code `219` | Unlocks **Apex Entertainment**, 21 Apex Dr |
| 9 | code `508` | One game, all three, same moment ($60) |

Budget $100, tracked in the phone app.

---

## Guarantees, each covered by a test

- **Codes interlock.** The watch's six codes hash to exactly what the phone
  expects. `testCodeHashesMatchThePhone` fails the build if they ever drift —
  this is the failure that would silently break the game in the field.
- **No competitive language.** `testNoCompetitiveLanguage` scans every spoken
  line. It has fired twice on real copy (`window` → `win`, "the *first* place");
  both times the wording was changed rather than the guard weakened.
- **Every step speaks.** `testEveryStepSpeaksItself` asserts spoken text exists
  and is longer than the on-screen headline.
- **Phone cannot cheat.** Verified: zero plaintext codes and zero field
  instructions in the public page source.
- **No kid names in public source.** Names are entered in-app and live only in
  that phone's `localStorage`.

Watch suite: **8/8**. Phone: full nine-step playthrough driven automatically,
including wrong-code rejection at every gate.

---

## Things that will bite you if you forget them

- **The watch app is standalone.** No `WatchConnectivity`, no network,
  `WKWatchOnly: true`, progress in `@AppStorage`. It runs with the phone off and
  survives switching the Active Watch. Verified by grep, not assumption.
- **Switching the Active Watch away from Parker's means no more updates** can be
  pushed to it until you switch back. The installed build is the shipped build.
- **Installing to a watch does NOT work via `xcodebuild -destination`.** That
  path waits for the device to "become available" and never succeeds. The
  working method — and the one the other apps in this repo used — is two steps:
  ```
  xcodebuild -destination 'generic/platform=watchOS' ... build
  xcrun devicectl device install app --device <CoreDevice-UUID> <path>.app
  ```
  This cost most of an afternoon to rediscover. Do not retry the first path.
- **Apple Watch Series 6 and 7 are 2.4GHz only.** If the Mac is on 5GHz the
  tunnel handshake times out. Same SSID is not the same radio.
- **A watch on its charger is a locked watch.** Wrist detection is what keeps it
  unlocked, so installs need it worn.
- **Xcode's SDK must be ≥ the watch's watchOS.** Xcode 26.2 could not talk to
  watchOS 26.3/26.5; Xcode 26.6 (watchOS 26.5 SDK) could.

### Device reference

```
Series 6  CoreDevice BE241748-5B26-5E73-90CD-F4651F531802  (Parker's)
Series 7  CoreDevice B314257A-DD79-5C22-9545-85A26ED0ECC0  (Dad's)
Team DU52C58N97 · bundle com.zevgt.crewquest
```

---

## To resume

Both apps are complete. Nothing is half-finished and nothing is blocked.

**To change the game:** edit `Sources/Cards.swift` (watch) and the `M` array in
`index.html` (phone) **together** — the hash test exists to catch you if you
change one and not the other. Then rebuild, `devicectl install`, and push both
repos.

**Rebuild and install the watch:**
```
cd ~/dev/parker-watch-apps/Apps/CrewQuest
xcodegen generate                      # only if files were added or removed
xcodebuild -project CrewQuest.xcodeproj -scheme CrewQuest \
  -destination 'generic/platform=watchOS' -derivedDataPath /tmp/CQDev \
  -allowProvisioningUpdates build
xcrun devicectl device install app \
  --device BE241748-5B26-5E73-90CD-F4651F531802 \
  /tmp/CQDev/Build/Products/Debug-watchos/CrewQuest.app
```

**Phone:** edit `index.html`, commit, push. GitHub Pages serves it in ~60s.

---

## Not touched by this project

The `parker-watch-apps` repo also contains HeroGarage, Omnitrix, ParkersHeart,
PowerUp and RightNow, plus a `rescue WIP` merge from another lane. This work
rebased cleanly on top of that with **zero overlapping files**. None of those
apps were read, modified, or reasoned about here.
