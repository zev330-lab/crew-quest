# Crew Quest — working state as of 2026-08-22 (evening: DAY-TWO tape)

A two-device scavenger hunt for a 9-year-old commander and a 6-year-old field
agent who cannot read. **Both halves are built and tested. The phone is live.
The watch build is staged — the Series 6 still carries DAY ONE until it is
reinstalled (needs the watch worn + unlocked; see "To resume").**

Day one (2026-08-22) was never played. Day two is a whole-day tape for
Sunday 2026-08-23: breakfast through a finale, with home time in the middle.

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

### The fifteen beats (tape version 2)

| # | Beat | Content |
|---|---|---|
| 1 | confirm | Crew name agreement |
| 2 | code `352` | Breakfast clue (round, hole in the middle) → **Bagels**, Main Street Bagel Factory, 51 Main St, Hudson |
| 3 | confirm | Everybody picks a bagel for somebody else |
| 4 | code `618` | Unlocks **Mommy's house** (no address — "the crew knows the way"): collect the commander's real phone, report to Elvis |
| 5 | confirm | Elvis: one kind thing each, teach him a word |
| 6 | code `274` | Unlocks **The Riverwalk** — Assabet River Rail Trail, Lincoln St & Highland St, Marlborough (free; rain fallback in the brief) |
| 7 | confirm | Each finds one thing the other two missed |
| 8 | code `593` | Unlocks **Trombetta's Farm**, 655 Farm Rd ($30) |
| 9 | confirm | Mini golf, one score for the crew |
| 10 | code `186` | Unlocks **Base camp** (home, no address): crew lunch |
| 11 | confirm | Lunch then 30 min quiet time, then one thing together |
| 12 | code `725` | Unlocks **Wayside Country Store**, 1015 Boston Post Rd E ($15) |
| 13 | confirm | Oldest thing in the shop |
| 14 | code `831` | Unlocks **Apex Entertainment**, 21 Apex Dr |
| 15 | code `469` | One game, all three, same moment ($60) |

Budget **$150**, tracked in the phone app (`BUDGET` constant). Letters spell
BEST DAY TOGETHER. Day one's six codes (417/823/940/372/219/508) are rejected.

**Phone transfer.** The commander's real phone is at Mommy's (beat 4), so the
morning runs on the driver's phone. The panel "Moving to another phone?" at the
bottom of the page takes a step number: every earlier step is marked done and
its destinations unseal; the chosen step still needs the watch. Type 5 on her
phone at Mommy's house.

**Watch progress reset.** `Step.tapeVersion` (now 2) is stored in
`@AppStorage("tapeVersion")`; on launch a mismatch resets `stepIndex` to 0, so
a reinstalled watch cannot open mid-day. Bump it every time the tape changes.

---|---|---|
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

Watch suite: **10/10** (adds the tape-version bump and the giveaway-clue guard).
Phone: full fifteen-step playthrough driven automatically in a real browser,
including wrong-code AND day-one-code rejection at every gate, address-less
stops, and the phone-transfer control.

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

**ONE thing is pending: install the day-two build on Parker's Series 6.** The
build at `/tmp/CQDev/Build/Products/Debug-watchos/CrewQuest.app` succeeded on
2026-08-22 22:27; the install timed out because the watch was not worn/unlocked
(`Network.NWError error 60` right after "Enabling developer disk image
services" is that signature). If `/tmp/CQDev` is gone, rebuild with the command
below — it is ~1 minute. Verify afterwards with
`xcrun devicectl device info apps --device BE241748-5B26-5E73-90CD-F4651F531802 | grep -i crewquest`
and, on the watch, that the first screen says AGREE TO THE CREW (not a mid-day step).

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
