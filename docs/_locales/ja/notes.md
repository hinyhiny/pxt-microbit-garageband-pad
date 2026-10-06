# 音符

パッドを使わずに、音符や和音を直接鳴らすブロックです。いちばん素直に iPad を
鳴らせるので、Bluetooth がつながっているかの確認にも便利です。

MIDI の音符はただの番号で、その番号が高さを決めます。「音符 %name オクターブ %octave」
がその計算をしてくれます。

```
   ...  57   58   59 | 60   61   62   63   64   65   66   67 | 68  ...
        A3   A#3  B3 | C4   C#4  D4   D#4  E4   F4   F#4  G4 | G#4
                     └──────┬──────┘
                       middle C = 60  (octave 4)
```

* 「音符 ド オクターブ 4」は (4 + 1) × 12 + 0 = **60**（真ん中のド）
* 「音符 ラ オクターブ 4」は (4 + 1) × 12 + 9 = **69**（440 Hz）
* 「音符 ド オクターブ 5」は (5 + 1) × 12 + 0 = **72**（1 オクターブ上）

## 音名とオクターブから番号を作る

音名とオクターブから MIDI ノート番号を作ります。プログラムの中の数字を読みやすく
するのに使います。

```sig
let n = gbpad.note(NoteName.C, 4)
```

**パラメータ**

* **name**: 音名（`ド (C)` / `ド# (C#)` / `レ (D)` / `レ# (D#)` / `ミ (E)` / `ファ (F)` / `ファ# (F#)` / `ソ (G)` / `ソ# (G#)` / `ラ (A)` / `ラ# (A#)` / `シ (B)`）
* **octave**: オクターブ（0〜8。4 が真ん中のドのオクターブ）

```blocks
gbpad.bindPad(MidiPad.A, gbpad.note(NoteName.C, 4))
```

## 音符を鳴らす / 止める

音符を鳴らし始めます。止めるまで鳴り続けます。**自動では止まりません**。対応する
「音符を止める」を呼ばないと、「すべての音を止める」か iPad の切断まで鳴り続けます。

```sig
gbpad.noteOn(60, 100)
```

**パラメータ**

* **note**: MIDI ノート番号（0〜127）
* **velocity**: 音の強さ（1〜127）

```sig
gbpad.noteOff(60)
```

**パラメータ**

* **note**: MIDI ノート番号（0〜127）

```blocks
gbpad.noteOn(gbpad.note(NoteName.C, 4), 100)
basic.pause(1000)
gbpad.noteOff(gbpad.note(NoteName.C, 4))
```

## 音符を鳴らす（長さを指定）

音符を一定時間鳴らしてから止めます。鳴らしっぱなしにする事故が起きません。
**このブロックは待ちます**（鳴り終わるまで次に進みません）。

```sig
gbpad.playNote(60, 500)
```

**パラメータ**

* **note**: MIDI ノート番号（0〜127）
* **duration**: 鳴らす長さ（ミリ秒）

## 和音を鳴らす

和音を一定時間鳴らしてから止めます。**このブロックは待ちます**。

```sig
gbpad.playChord(60, Chord.Major, 500)
```

**パラメータ**

* **root**: 和音の根音の MIDI ノート番号（0〜127）
* **chord**: `メジャー` / `マイナー` / `セブンス` / `サスフォー` / `パワーコード` / `オクターブ`
* **duration**: 鳴らす長さ（ミリ秒）

```blocks
gbpad.playChord(gbpad.note(NoteName.C, 3), Chord.Major, 500)
gbpad.playChord(gbpad.note(NoteName.G, 3), Chord.Major, 500)
gbpad.playChord(gbpad.note(NoteName.A, 3), Chord.Minor, 1000)
```

## 関連項目

* [パッドのブロック](./pads)
* [RTTTL のブロック](./rtttl)
* [表現とその他のブロック](./expression)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
