# GarageBand Pad — Bluetooth MIDI pad controller for micro:bit V2

**English** | [日本語](README.ja.md)

Hold the buttons on a **micro:bit V2** and **GarageBand on an iPad** plays — over Bluetooth Low Energy (BLE) MIDI.
Only MIDI messages ("start this note / stop it") travel over Bluetooth; the sound itself is generated on the iPad.
No USB cable, no audio cable.

```
micro:bit V2 ──(BLE MIDI: note on / note off / pitch bend)──> iPad ──> GarageBand
```

## What it does

| Feature | Description |
| --- | --- |
| 4 pads | A / B / A+B / logo (touch). Sounds while held: press = note on, release = note off |
| Chord pads | Assign major / minor / 7th / sus4 / power / octave to a single pad |
| Octave shift | Move every assigned note by whole octaves, switchable while you play |
| Tilt pitch bend | Tilt the board left/right to bend the pitch (±2 semitones) |
| Tilt modulation | Tilt to add vibrato (CC1) |
| RTTTL player | Play a whole song from a one-line ringtone string (e.g. Ode to Joy), with a tempo (bpm) control |
| Connection display | Check mark on the LED when the iPad connects, cross when it drops |
| Utilities | Sustain, all notes off, channel volume, pad velocity |

## Requirements

- **micro:bit V2 required** (uses logo touch and the V2 BLE stack)
- Microsoft MakeCode for micro:bit (makecode.microbit.org)
- GarageBand on iPad / iPhone (a version that supports Bluetooth MIDI devices)

MakeCode asks **"Download for V2 only"** when you download. That is normal for this extension — see [Download for V2 only](#download-for-v2-only).

## Installation

### 1. Import the extension

1. Open [makecode.microbit.org](https://makecode.microbit.org) and create a new project
2. **Make sure the board is set to micro:bit V2** (bottom toolbar, or Project Settings)
   - On V1 the extension is rejected with error 929
3. Gear icon (Settings) → Extensions → **Import Extension**
4. Paste this URL and confirm:

   ```
   https://github.com/hinyhiny/pxt-microbit-garageband-pad
   ```

5. The **GarageBand Pad** category appears in the block list — done

### 2. Set Bluetooth to "No Pairing Required" (**mandatory**)

Gear icon (Settings) → **Project Settings** → **Bluetooth** → **"No Pairing Required: anyone can connect over Bluetooth"**.

**This setting is compiled into the .hex. Changing the setting alone does nothing — after changing it you must click Download and re-flash the board.**

#### Why it is mandatory

MakeCode's default is **"JustWorks pairing"**. In that mode the BLE MIDI characteristic gets a flag meaning **"reading requires authentication"**, because the native implementation in `bluetooth-midi` says:

```cpp
uint16_t props = microbit_propREAD | microbit_propWRITE | microbit_propWRITE_WITHOUT | microbit_propNOTIFY;
#if !CONFIG_ENABLED(MICROBIT_BLE_OPEN)   // <- when pairing is required
    props |= microbit_propREADAUTH;      // <- require authentication to read
#endif
```

iPad's CoreMIDI connects, discovers services, and then reads this characteristic. Authentication has not happened yet, so the board answers with **an ATT error (Insufficient Authentication)** — and **iOS drops the link immediately for safety**. That is exactly what "connects and instantly disconnects" is.

With "No Pairing Required" the board enables `MICROBIT_BLE_OPEN`, the authentication requirement goes away, and **the PAIRING MODE screen never appears either**.

#### The same setting also decides the Bluetooth name

The micro:bit runtime builds the advertised name like this (`codal-microbit-v2`, `source/bluetooth/MicroBitBLEManager.cpp`):

```cpp
gapName = MICROBIT_BLE_MODEL;                        // "BBC micro:bit"
if (enableBonding || !CONFIG_ENABLED(MICROBIT_BLE_WHITELIST)) {
    gapName = gapName + " [" + deviceName + "]";     // <- the board's own 5 letters
}
```

`MICROBIT_BLE_OPEN` forces `MICROBIT_BLE_WHITELIST` to `0` (`inc/MicroBitConfig.h`), and `MicroBitConfig` passes `microbit_friendly_name()` as `deviceName`. So:

| Project setting | Advertised name |
| --- | --- |
| **No Pairing Required** (`MICROBIT_BLE_OPEN`) | `BBC micro:bit [zapuv]` — **unique per board** |
| JustWorks pairing (default) | `BBC micro:bit` — **identical on every board** |

In other words, the mandatory setting above is also what makes the boards in a classroom distinguishable. See [Using many micro:bits at once](#using-many-microbits-at-once-classroom).

### 3. Connect from the iPad

1. Boot the micro:bit **normally** (do not leave it on the PAIRING MODE screen — there the MIDI UUID is not advertised and it cannot be found)
2. Open GarageBand and create a **Software Instrument track**
3. Settings (gear) → Advanced → Bluetooth MIDI Devices
4. Tap `BBC micro:bit [xxxxx]` (`xxxxx` = the five letters your board shows) → turn Connect on
5. A ✓ on the micro:bit means you are connected

If it will not connect, tap Edit → Forget on the iPad, reset the micro:bit, and try again.

## Blocks

### Setup

| Block | Description |
| --- | --- |
| `start GarageBand Pad channel [1] instrument [1]` | Pick the channel and instrument and start the pads; shows the Bluetooth state on the LED |
| `set MIDI channel [1]` | MIDI channel used by every other block (1–16) |
| `set instrument [1]` | Instrument (General MIDI 1–128) |
| `set pad velocity [100]` | How loud the pads play |
| `set channel volume [100]` | Channel volume (CC7) |
| `on Bluetooth connected` | Runs when a device connects |
| `on Bluetooth disconnected` | Runs when the device disconnects |
| `Bluetooth connected` | Whether a device is connected right now (boolean) |

### Pads

| Block | Description |
| --- | --- |
| `bind pad [A] to note [60]` | Play that note for as long as the pad is held; stops on release |
| `bind pad [A] to chord [60] [major]` | Play that chord for as long as the pad is held |
| `on pad [A] pressed` / `on pad [A] released` | Run code on press / release (independent of the note binding) |
| `pad [A] is pressed` | Whether the pad is held right now |
| `shift pad octave by [1]` / `reset pad octave` | Move every assigned note by whole octaves |
| `unbind all pads` | Remove all bindings and stop every note |

### Notes

| Block | Description |
| --- | --- |
| `note [C] octave [4]` | Build a MIDI note number from a note name and an octave |
| `note on [60] velocity [100]` / `note off [60]` | Start / stop a single note |
| `play note [60] for [500] ms` | Play a note for a while, then stop it |
| `play chord [60] [major] for [500] ms` | Play a chord for a while, then stop it |

### RTTTL (ringtones)

RTTTL ("Ring Tone Text Transfer Language") is the ringtone format old mobile phones used. A whole tune is a single line of text, and it is played through Bluetooth MIDI, so it comes out of GarageBand with whatever instrument and channel you picked.

| Block | Description |
| --- | --- |
| `play RTTTL [tune]` | Play a tune and wait until it has finished |
| `set RTTTL tempo to [120] (bpm)` | Force one tempo on every tune (`0` = keep each tune's own tempo) |
| `stop RTTTL` | Cut a tune short — the note that is sounding stops at once |

A tune is written like this:

```
Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d
 |  |   |   |     |
 |  |   |   |     +-- the notes, separated by commas
 |  |   |   +-------- b = the tempo in beats per minute (smaller = slower)
 |  |   +------------ o = the octave used when a note does not say
 |  +---------------- d = the note length used when a note does not say
 +------------------- the name (may be left out)
```

A note is `length + letter + sharp + octave + dot`. So `8e` is an eighth-note E, `8c#5` is a C sharp, `4a.` is a dotted quarter-note A and `p` is a rest. The length is a fraction of a whole note, so `4` is a quarter and `8` is an eighth.

Tune collections are easy to find on the web — search for `rtttl` plus a song title. Paste the line into the block.

Tunes picked up from the web rarely agree on a tempo, so `set RTTTL tempo` overrides all of them at once instead of making you edit every `b=`: `120` plays everything at 120 beats per minute, `60` at half that speed and `240` at twice the speed. `0` means "no override" — each tune keeps the tempo written inside it, which is what happens if you never use the block. Values above 400 are clamped. The setting is remembered, so one `set RTTTL tempo to [90] (bpm)` in `on start` is enough — handy when a class needs everything a little slower.

Only one tune plays at a time. Starting a tune cuts off whatever was playing, so pressing the same pad twice **restarts** the tune instead of laying two copies of it on top of each other — which is what you want when a class is taking turns hammering the pad. `stop RTTTL` silences the note that is sounding straight away, rather than letting it ring out to the end of its length.

### Expression

| Block | Description |
| --- | --- |
| `tilt pitch bend [on]` | Bend the pitch by tilting left and right |
| `tilt modulation [on]` | Add modulation (vibrato) by tilting |

### Utility

| Block | Description |
| --- | --- |
| `sustain [on]` | Sustain pedal (CC64) |
| `all notes off` | Stop everything (including a tune) and reset the pad state |

### Classroom

| Block | Description |
| --- | --- |
| `device ID` | The five letters this micro:bit uses in its Bluetooth name (same value as the advanced `control → device name` block) |
| `show device ID` | Scroll those five letters across the LED display |

## Example program

Turns A / B / A+B into the I–V–vi chords of C major, and shifts everything up one octave while the logo is held.

```typescript
// MIDI channel 1, instrument 1 (Acoustic Grand Piano)
gbpad.start(1, 1)

// Scroll this board's device ID (e.g. "zapuv") so students can find
// "BBC micro:bit [zapuv]" in the Bluetooth MIDI device list.
gbpad.showDeviceId()

// Three chord pads (C major / G major / A minor)
gbpad.bindPadChord(MidiPad.A, gbpad.note(NoteName.C, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.B, gbpad.note(NoteName.G, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.AB, gbpad.note(NoteName.A, 3), Chord.Minor)

// Pitch bend by tilt (±2 semitones)
gbpad.tiltPitchBend(OnOff.On)

// Hold the logo to shift up one octave
gbpad.onPadPressed(MidiPad.Logo, () => gbpad.shiftOctave(1))
gbpad.onPadReleased(MidiPad.Logo, () => gbpad.shiftOctave(-1))

// Show the connection state
gbpad.onConnected(() => basic.showIcon(IconNames.Happy))
gbpad.onDisconnected(() => basic.showIcon(IconNames.Sad))
```

### Playing drums

MIDI channel 10 is the drum channel. Combine the pads with the `midi play drum` block from the MIDI category.

```typescript
gbpad.onPadPressed(MidiPad.A, () => midi.playDrum(DrumSound.AcousticBassDrum))
gbpad.onPadPressed(MidiPad.B, () => midi.playDrum(DrumSound.AcousticSnare))
gbpad.onPadPressed(MidiPad.AB, () => midi.playDrum(DrumSound.ClosedHiHat))
```

(`DrumSound` and `playDrum` come from the pxt-midi package. Drums are always sent on MIDI channel 10.)

### Playing a whole tune

`play RTTTL` waits until the tune is over, so `on start` and `forever` are the natural places for it. To start a tune **from a pad**, wrap it in the built-in `run in background` block from the Control category — otherwise the pad poller stops for as long as the tune lasts and the other pads go dead.

```typescript
const TUNE = "Ode:d=4,o=5,b=125:8e,8e,8f,8g,8g,8f,8e,8d,8c,8c,8d,8e,8e.,8d,4d"

// Play every tune at 90 bpm, whatever tempo it asks for.
// gbpad.setRtttlTempo(0) would hand control back to each tune.
gbpad.setRtttlTempo(90)

gbpad.onPadPressed(MidiPad.Logo, () => {
    control.inBackground(() => gbpad.playRtttl(TUNE))
})
gbpad.onPadPressed(MidiPad.A, () => gbpad.stopRtttl())
```

Three knobs are worth knowing:

- **Tempo** is the `b=` number in the tune. Smaller is slower, which is what you want when a class is following along. `set RTTTL tempo` overrides it with a `bpm` number without touching the tune, and `0` hands control back to the tune.
- **Pitch** is the `o=` number (and any per-note octave). If a tune sits too high for the instrument you picked, drop the octave.
- **One tune only** — `set RTTTL tempo` is a single global setting. To play one tune at a different tempo and leave the rest as written, either put a `set RTTTL tempo` call in front of that one `play RTTTL`, or edit the `b=` inside the tune's text.

## Using many micro:bits at once (classroom)

Every micro:bit makes up a **five letter ID from its chip serial number**, and that ID is what shows up in brackets in the Bluetooth name. A micro:bit cannot be renamed — the name is fixed in the runtime — but this ID is unique enough to tell the boards in one room apart.

### Setup

1. Flash **every** board with the **"No Pairing Required"** project setting (see [step 2](#2-set-bluetooth-to-no-pairing-required-mandatory)). Without it every board advertises the plain name `BBC micro:bit` and nobody can tell them apart.
2. Put `show device ID` in `on start` so each student sees their own ID:

   ```typescript
   gbpad.start(1, 1)
   gbpad.showDeviceId()      // scrolls e.g. "zapuv"
   ```

3. The student boots their board, reads the five letters off the LED, and looks for **`BBC micro:bit [zapuv]`** in GarageBand's Bluetooth MIDI device list (gear → Advanced → Bluetooth MIDI Devices).

### Good to know

- **There are only 5⁵ = 3125 IDs.** With 30 boards in one room there is about a **13%** chance that two of them share an ID (with 15 boards, about 3%). If two candidates appear, connect to one of them and check the LED: **✓ on your own board means you picked the right one.** If not, disconnect and try the other. The built-in ✓ / ✕ icons are the tie-breaker.
- The ID comes from the chip, so it never changes, and it survives re-flashing.
- The LED shows the ID in lower case, exactly as it appears in the Bluetooth name.
- **In the MakeCode simulator** there is no chip serial number, so `device ID` returns the placeholder `simul` / `show device ID` scrolls `simul`. The real ID only exists on the board.
- iOS remembers devices by address. If you change the Bluetooth setting or hand a board to another student, clear the old entry: GarageBand → Bluetooth MIDI Devices → Edit → delete, and iPad Settings → Bluetooth → forget the micro:bit.

## Hardware notes

- **The A+B pad is not physically independent.** Pressing A and B together makes all three of A, B and A+B report "pressed". That is simply because the micro:bit has only the A and B buttons, and there is deliberately no cancellation logic. If you use A+B as a chord pad, design the A and B handlers with that in mind.
- **Logo touch is V2 only.** On V1, `MidiPad.Logo` always reads as "not pressed" (the code checks the board version so V1 will not crash).
- Pads are detected by polling every 10 ms. Polling is used instead of `input.onButtonPressed` (which fires on release, i.e. a click) so that "sound only while held" works exactly.
- MIDI messages are not sent while Bluetooth is down (the transport checks the connection first). On disconnect every note is stopped automatically so nothing is left ringing.

## How it works and what it depends on

This package only contains the **pad, connection and expression logic**. Sending BLE MIDI is delegated to battle-tested packages.

| Dependency | Role |
| --- | --- |
| `github:RBilsland/pxt-bluetooth-midi` | Advertises the BLE MIDI GATT service (`03B80E5A-EDE8-4B33-A751-6CE34EC4C700`) and sends MIDI messages as notifications. **micro:bit V2 (CODAL) support** |
| `github:microsoft/pxt-midi#v2.1.11` | Builds the MIDI messages (note on/off, chords, CC, pitch bend) |

> **Why a fork?**
> The official `microsoft/pxt-bluetooth-midi` v2.0.13 is written against the nRF51 (micro:bit V1) mbed BLE API (`ble/BLE.h`, `GattService`, `ble.gattServer()`). The micro:bit V2 is an nRF52833 running CODAL, whose BLE API is completely different, so **it does not compile for V2**. MakeCode detects this and reports error 929 ("extension not compatible with this board"), disabling the package. The RBilsland fork added a CODAL `MicroBitBLEService`-based implementation from v2.0.14 onward and fixes advertising, the GATT handshake and the pairing settings for V2 (as of v2.0.25).

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| MakeCode shows **error 929** and the extension cannot be added | Check the board is **V2**. It cannot be added to a V1 project |
| Downloading asks whether to **"Download for V2 only"** | Expected, and the right answer. The V1 half cannot fit the Bluetooth stack — see [Download for V2 only](#download-for-v2-only) |
| It used to work, now GarageBand cannot connect at all (often just after a re-flash) | **Power-cycle the board first**: unplug the USB cable, take the battery out, wait a few seconds, then power up again. Flashing leaves the Bluetooth stack in a stale state often enough that a power cycle — rather than the reset button — is the first thing to try. Nothing in the extension can cause this: the MIDI service starts on its own at power-up |
| The micro:bit does not appear in GarageBand's "Bluetooth MIDI Devices" | Check the board is **not stuck on the PAIRING MODE screen** (press reset). Turn on "No Pairing Required" in Project Settings. Forget the old entry on the iPad |
| The list shows plain `BBC micro:bit` with **no `[xxxxx]` suffix** | The **"No Pairing Required" setting is not active** on that board. That is the quickest way to check it: with the setting on, the name always carries the board's five letters. Fix it or every board in the room looks identical — and the sudden-disconnect problem is still there too |
| The **iPad cannot send the program** to the board over Bluetooth any more | The board's stored Bluetooth state is wedged. Flash a fresh .hex over USB from a computer, and the factory reset program if that is not enough — see [The iPad can no longer send the program over Bluetooth](#the-ipad-can-no-longer-send-the-program-over-bluetooth) |
| Connect flips back to **Not connected** straight away (the micro:bit shows ✓ then ✕) | Follow [Disconnects immediately after connecting](#disconnects-immediately-after-connecting) below |
| After connecting, the LED goes back to "S" or shows a sad face and freezes | The board **reset or crashed**. That is a power/firmware problem, not software (try USB power, use a fresh battery) |
| Connected, but no sound | Check that a **Software Instrument track is selected** in GarageBand. Some instruments need record-enable (the red button). Check `midi channel` is 1 |
| Sound cuts out or lags | Avoid 2.4 GHz congestion (stay away from Wi-Fi routers). Keep the iPad and micro:bit close together |
| A note keeps ringing | Call the `all notes off` block. Everything is stopped automatically on disconnect |
| Updated the extension but nothing changed | Remove the extension, import the same URL again, and **flash a fresh .hex** (the firmware has to be re-flashed) |
| No picture appears next to the extension in the editor | **Expected, for now.** MakeCode shows the `icon.png` from the repository root, but only for extensions on the approved list — there is no `pxt.json` setting for it (`icon` there is for built-in packages only). The file is already the required size (300×200), so it will appear by itself if this extension is ever submitted for approval |

### Download for V2 only

MakeCode normally hands you a **universal .hex**: one file holding both a V1 and a V2 image, so it works on either board. That means the program has to fit on **both**, and the V1 has far less room than the V2:

| Variant | Usable flash |
| --- | --- |
| micro:bit V1 (`mbdal`) | 242,688 bytes |
| micro:bit V2 (`mbcodal`) | 471,040 bytes |

A Bluetooth MIDI stack does not fit in 242,688 bytes, so the V1 half cannot be built. MakeCode says as much — *"your program is too large to fit on a micro:bit V1"* — and offers **Download for V2 only**. Take it: the file it produces holds the V2 image only, which is what you want here and is smaller than a universal .hex.

- This is how the editor behaves, **not a problem with your program**. Any Bluetooth MIDI project on a micro:bit shows it, and there is no way to make the V1 half fit.
- Plug the micro:bit V2 in and use the normal **Download** button (WebUSB one-click flash) and the prompt does not appear: MakeCode can see it is talking to a V2 and rebuilds V2-only on its own.
- A V2-only .hex will **not run on a V1**, and a V1 fails silently — no error code, nothing on the display. Fine when every board in the room is a V2; worth remembering if one is not.

### Disconnects immediately after connecting

Symptom: GarageBand shows **Connecting** → the micro:bit shows ✓ → about half a second later it goes back to **Not connected** and the micro:bit shows ✕.

**The prime suspect is the pairing setting.** As described in [Set Bluetooth to "No Pairing Required"](#2-set-bluetooth-to-no-pairing-required-mandatory), while the project is on `JustWorks pairing` the read of the characteristic right after connecting returns an ATT authentication error, and **iOS drops the link**.

Do all of these, in this order (skipping any one of them brings the problem back).

1. **MakeCode**: Project Settings → Bluetooth → **No Pairing Required** → **download a fresh .hex and re-flash**
2. **micro:bit**: press **reset** without holding A/B (to leave the PAIRING MODE screen)
3. **iPad Bluetooth settings**: tap ⓘ next to "BBC micro:bit" → **Forget This Device** (a stale pairing key makes iOS use it, fail, and disconnect immediately)
4. **GarageBand**: Settings (gear) → Advanced → Bluetooth MIDI Devices → **Edit → remove the device** (clears the leftover "offline" entry)
5. Turn iPad Bluetooth **off → on** (or reboot the iPad)
6. Move the micro:bit and iPad **close together** (within 30 cm) and press Connect again

#### If that does not fix it

Find out whether the problem is the "BLE transport / settings" or "this package (gbpad)".
Paste the program below into a **new project that imports only `https://github.com/RBilsland/pxt-bluetooth-midi`** (do **not** add gbpad), set "No Pairing Required", and flash it.

```typescript
let linkUp = false

bluetooth.onBluetoothConnected(function () {
    linkUp = true
    basic.showIcon(IconNames.Yes)     // stays on screen - do not clear it
})

bluetooth.onBluetoothDisconnected(function () {
    linkUp = false
    basic.showIcon(IconNames.No)
})

input.onButtonPressed(Button.A, function () {
    basic.showIcon(linkUp ? IconNames.Yes : IconNames.No)
})

input.onButtonPressed(Button.B, function () {
    midi.channel(1).noteOn(60, 100)
    basic.pause(300)
    midi.channel(1).noteOff(60)
})

basic.showString("S")   // "S" = the program is running
```

- **Still disconnects** → the cause is the transport layer (`RBilsland/pxt-bluetooth-midi` v2.0.25) or the project settings. gbpad is not involved
- **Does not disconnect** → the problem is in gbpad; please report the symptoms

Reading the LED tells you a lot.

| What you see | What it means |
| --- | --- |
| After the disconnect, "S" appears again | The micro:bit reset or crashed |
| ✕ stays on the display | Normal. Only the link dropped (the iPad's doing) |
| Drops from **macOS** "Audio MIDI Setup → MIDI Studio → Bluetooth" too | A micro:bit-side problem |
| Stable on macOS, only the iPad drops | An iPad cache / pairing-key problem (do steps 3–5 thoroughly) |
| The `bluetooth-midi` version in the extension list | **Anything below v2.0.21 is old.** Remove, re-import, and re-flash |

### The iPad can no longer send the program over Bluetooth

An iPad has no cable option: code reaches the board through the micro:bit app, over Bluetooth. When that stops working, the board's stored Bluetooth state is usually the reason, and the cure is to overwrite it from a computer.

1. **Flash a fresh .hex over USB from a computer.** This is micro:bit's own advice before trying the iPad again. Flashing by dragging a .hex onto the `MICROBIT` drive also **clears all Bluetooth pairing and bonding information and any configuration** (*Reset your micro:bit*, microbit.org). Afterwards, flash this project's .hex again, so that the "No Pairing Required" setting comes back with it.
2. **If that is not enough, flash the factory reset program.** The `meet the micro:bit` program on the same microbit.org page (the old "Out of Box Experience") "acts like a factory reset" and "will also clear any Bluetooth pairing information on the micro:bit". A board that has gone deaf to Bluetooth normally comes back after this.
3. **Check that "No Pairing Required" survived.** The setting is compiled into the .hex, so the reset program wipes it. Re-flash this project's .hex and confirm that the device list shows the board's `[xxxxx]` suffix again — see [Installation step 2](#2-set-bluetooth-to-no-pairing-required-mandatory).

Two things that are easy to get wrong with the micro:bit app:

- The board has to be **in Bluetooth mode each time** code is sent: press reset three times, or hold A and B, press and release reset, and keep holding A and B until every LED lights up.
- **Weak batteries break the radio, not the display.** The board can look perfectly healthy and still refuse to transfer. Use a USB cable or fresh batteries while chasing this.

One more thing worth knowing: a V2 powers **off** when you hold reset until the light goes out (about 4 seconds). That is a cleaner power cycle than unplugging the cable, and it is the first thing to try when Bluetooth misbehaves — see the [troubleshooting table](#troubleshooting).

## Files

```
.
├── pxt.json                     # MakeCode package definition (dependencies, file list)
├── garageband-pad.ts            # Block implementation (the body of this package)
├── tests.ts                     # Sample / test file (not compiled when imported)
├── icon.png                     # Extension icon (300x200, ready for the gallery)
├── tsconfig.json
├── _locales/ja/
│   ├── garageband-pad-strings.json       # Japanese block labels
│   └── garageband-pad-jsdoc-strings.json # Japanese tooltips
├── README.md                    # This file (English)
└── README.ja.md                 # Japanese version
```

## License

MIT. The dependencies [pxt-bluetooth-midi](https://github.com/RBilsland/pxt-bluetooth-midi) (originally [microsoft/pxt-bluetooth-midi](https://github.com/microsoft/pxt-bluetooth-midi)) and [pxt-midi](https://github.com/microsoft/pxt-midi) are MIT as well.
"GarageBand" is a trademark of Apple Inc. This package is unofficial and not affiliated with Apple.
