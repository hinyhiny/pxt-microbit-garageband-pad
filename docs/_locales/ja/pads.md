# パッド

パッドは本体で押さえられる 4 か所のことです。パッドは「クリック」ではなく、
**押さえている間ずっと鳴り続けます**。だからボタンの箱ではなく楽器のように弾けます。

```
        本体の表側

        ╔═══════════════════╗
        ║  ┌───┐    ┌───┐   ║
        ║  │ A │    │ B │   ║
        ║  └───┘    └───┘   ║
        ║        ◆          ║
        ╚═══════════════════╝

        ◆ = ロゴ（金色のタッチマーク、micro:bit V2 のみ）
        A+B = A と B の同時押し
```

```
   押す                                離す
    │                                  │
  ──┼──────────────────────────────────┼──────> 時間
    │                                  │
  音符を鳴らす（強さは「パッドの音の強さ」）  音符を止める
    │                                  │
    └────── この間ずっと鳴り続ける ──────┘
```

本体は **10 ミリ秒ごと**に見ているので、押した瞬間に鳴ります。楽器として弾けるのは
この速さのおかげです。

下のブロックで音符か和音を割り当ててください。割り当てるまでは、押しても何も
送られません。

## パッドに音符を割り当てる

押している間、その音符を鳴らし続けます。離すと止まります。

```sig
gbpad.bindPad(MidiPad.A, 60)
```

**パラメータ**

* **pad**: 割り当てるパッド（`Aボタン` / `Bボタン` / `A+B` / `ロゴ`）
* **note**: MIDI ノート番号（0〜127。60 が真ん中のド）

```blocks
gbpad.bindPad(MidiPad.A, gbpad.note(NoteName.C, 4))
gbpad.bindPad(MidiPad.B, gbpad.note(NoteName.E, 4))
gbpad.bindPad(MidiPad.AB, gbpad.note(NoteName.G, 4))
```

## パッドに和音を割り当てる

押している間、その和音を鳴らし続けます。離すと止まります。

```sig
gbpad.bindPadChord(MidiPad.A, 60, Chord.Major)
```

**パラメータ**

* **pad**: 割り当てるパッド
* **root**: 和音の根音の MIDI ノート番号（0〜127）
* **chord**: 和音の種類（`メジャー` / `マイナー` / `セブンス` / `サスフォー` / `パワーコード` / `オクターブ`）

| 和音 | 根音からの音 |
| --- | --- |
| `メジャー` | 0, 4, 7 |
| `マイナー` | 0, 3, 7 |
| `セブンス` | 0, 4, 7, 10 |
| `サスフォー` | 0, 5, 7 |
| `パワーコード` | 0, 7 |
| `オクターブ` | 0, 12 |

```blocks
gbpad.bindPadChord(MidiPad.A, gbpad.note(NoteName.C, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.B, gbpad.note(NoteName.G, 3), Chord.Major)
gbpad.bindPadChord(MidiPad.AB, gbpad.note(NoteName.A, 3), Chord.Minor)
```

この 3 つはハ長調の I–V–vi 進行です。膨大な数の曲がこの 3 つの和音でできています。

## パッドが押されたとき / 離されたとき

パッドが押されたとき、離されたときに実行する処理を登録します。音符の割り当てとは
別なので、**音を鳴らしながら別のことも同時に**できます。

```sig
gbpad.onPadPressed(MidiPad.A, () => {
})
```

**パラメータ**

* **pad**: 監視するパッド
* **handler**: 押されたとき / 離されたときに実行する処理

```blocks
gbpad.onPadPressed(MidiPad.Logo, () => {
    gbpad.shiftOctave(1)
})
gbpad.onPadReleased(MidiPad.Logo, () => {
    gbpad.shiftOctave(-1)
})
```

## パッドが押されているか調べる

そのパッドが今押されているかどうかを返します。

```sig
let down = gbpad.padIsPressed(MidiPad.A)
```

**パラメータ**

* **pad**: 調べるパッド

## パッドのオクターブをずらす

割り当ててある音を、まとめてオクターブ単位で上下させます。割り当て自体は変わらないので、
「-1 ずらす」のあとに「1 ずらす」で元に戻ります。

```sig
gbpad.shiftOctave(1)
```

**パラメータ**

* **octaves**: ずらすオクターブ数（-4〜4）

ずらすのはパッドを押した瞬間なので、演奏の途中で変えても安全です。

## パッドのオクターブを元に戻す

オクターブのずれを最初の位置に戻します。

```sig
gbpad.resetOctave()
```

**パラメータ**

* なし

## パッドの割り当てを全部消す

すべてのパッドから音符と和音の割り当てを消し、鳴っている音も止めます。

```sig
gbpad.clearPads()
```

**パラメータ**

* なし

## 関連項目

* [準備のブロック](./setup)
* [音符のブロック](./notes)
* [複数台を同時に使う](./classroom)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
