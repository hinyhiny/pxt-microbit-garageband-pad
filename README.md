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
| Connection display | Check mark on the LED when the iPad connects, cross when it drops |
| Utilities | Sustain, all notes off, channel volume, pad velocity |

## Requirements

- **micro:bit V2 required** (uses logo touch and the V2 BLE stack)
- Microsoft MakeCode for micro:bit (makecode.microbit.org)
- GarageBand on iPad / iPhone (a version that supports Bluetooth MIDI devices)

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

### 3. Connect from the iPad

1. Boot the micro:bit **normally** (do not leave it on the PAIRING MODE screen — there the MIDI UUID is not advertised and it cannot be found)
2. Open GarageBand and create a **Software Instrument track**
3. Settings (gear) → Advanced → Bluetooth MIDI Devices
4. Tap `BBC micro:bit` → turn Connect on
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

### Expression

| Block | Description |
| --- | --- |
| `tilt pitch bend [on]` | Bend the pitch by tilting left and right |
| `tilt modulation [on]` | Add modulation (vibrato) by tilting |

### Utility

| Block | Description |
| --- | --- |
| `sustain [on]` | Sustain pedal (CC64) |
| `all notes off` | Stop everything and reset the pad state |

## Example program

Turns A / B / A+B into the I–V–vi chords of C major, and shifts everything up one octave while the logo is held.

```typescript
// MIDI channel 1, instrument 1 (Acoustic Grand Piano)
gbpad.start(1, 1)

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
| The micro:bit does not appear in GarageBand's "Bluetooth MIDI Devices" | Check the board is **not stuck on the PAIRING MODE screen** (press reset). Turn on "No Pairing Required" in Project Settings. Forget the old entry on the iPad |
| Connect flips back to **Not connected** straight away (the micro:bit shows ✓ then ✕) | Follow [Disconnects immediately after connecting](#disconnects-immediately-after-connecting) below |
| After connecting, the LED goes back to "S" or shows a sad face and freezes | The board **reset or crashed**. That is a power/firmware problem, not software (try USB power, use a fresh battery) |
| Connected, but no sound | Check that a **Software Instrument track is selected** in GarageBand. Some instruments need record-enable (the red button). Check `midi channel` is 1 |
| Sound cuts out or lags | Avoid 2.4 GHz congestion (stay away from Wi-Fi routers). Keep the iPad and micro:bit close together |
| A note keeps ringing | Call the `all notes off` block. Everything is stopped automatically on disconnect |
| Updated the extension but nothing changed | Remove the extension, import the same URL again, and **flash a fresh .hex** (the firmware has to be re-flashed) |

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

## Files

```
.
├── pxt.json                     # MakeCode package definition (dependencies, file list)
├── garageband-pad.ts            # Block implementation (the body of this package)
├── tests.ts                     # Sample / test file (not compiled when imported)
├── icon.png                     # Extension icon
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
