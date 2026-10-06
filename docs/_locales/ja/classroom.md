# 教室

同じ見た目の micro:bit が 1 つの教室に 30 台あると、見分けがつきません。ところが
1 台ずつが持っている 5 文字を使えば区別できます。この 2 つのブロックがその 5 文字を
取り出します。

```
   iPad の Bluetooth MIDI デバイス一覧に出る名前

        BBC micro:bit [zapuv]
                       └──┬──┘
                          └────── これが「デバイスID」

   ただし、プロジェクトの設定が

        Bluetooth -> 「ペアリング不要」

   になっているときだけ。なっていないと、教室中のどのボタンも
   同じ名前で見えてしまいます:

        BBC micro:bit          <- 自分のも、となりのも
```

ID はチップのシリアル番号から作られるので **変更できません**。書き込み直しても
変わりません。

## デバイスID

この micro:bit が名乗っている 5 文字（例: `zapuv`）。

```sig
let id = gbpad.deviceId()
```

**パラメータ**

* なし

```blocks
basic.forever(() => {
    basic.showString(gbpad.deviceId())
})
```

高度なブロックの `制御 → デバイス名` と同じ値です。小文字で返り、Bluetooth の名前の
[ ] の中身と 1 文字も違わない文字列になっています。

**シミュレータでは**チップのシリアル番号が無いので、このブロックは仮の値 `simul` を
返します。本物の ID は実機にしかありません。

## デバイスIDを表示

その 5 文字を LED に流します。

```sig
gbpad.showDeviceId()
```

**パラメータ**

* なし

```blocks
gbpad.start(1, 1)
gbpad.showDeviceId()
```

「はじめに」に置いてください。生徒は自分の LED に出た 5 文字を読み、GarageBand の
一覧から同じ名前を探すだけです。教室全員をつなぐいちばん速い手順です。

## どのボタンが誰のものか

```
   本体に出る文字        GarageBand の一覧
   ┌────────────────┐
   │  z a p u v     │  --->    BBC micro:bit [zapuv]   <- これを選ぶ
   └────────────────┘          BBC micro:bit [kofem]
                               BBC micro:bit [xebit]
```

ID は 5⁵ = **3125 通り**しかありません。教室に 30 台あると、2 台が同じ ID になる確率は
およそ **13%** です（15 台なら約 3%）。

同じ ID が 2 つ見えたときは、どちらにつないでも構いません。まず片方につないで本体を
見てください。接続したときに ✓ が出るのは **自分の本体**なので、違う台に出たら
切断してもう片方につなぎます。

## 関連項目

* [準備のブロック](./setup)
* [パッドのブロック](./pads)
* [パッドコントローラーの説明（README）](https://github.com/hinyhiny/pxt-microbit-garageband-pad/blob/main/README.ja.md)

```package
garageband-pad=github:hinyhiny/pxt-microbit-garageband-pad
```
