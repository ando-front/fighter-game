import subprocess, sys

# フォント探索
import os
font_candidates = [
    '/Library/Fonts/Arial Unicode.ttf',
    '/System/Library/Fonts/Supplemental/Arial Unicode MS.ttf',
    '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc',
    '/System/Library/Fonts/Hiragino Sans GB.ttc',
]
font_path = None
for f in font_candidates:
    if os.path.exists(f):
        font_path = f
        break

print(f"Font: {font_path}")

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

if font_path and '.ttc' not in font_path:
    pdfmetrics.registerFont(TTFont('JP', font_path))
    F = 'JP'
else:
    F = 'Helvetica'

out = 'docs/電子工作実装設計書.pdf'
doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=18*mm, bottomMargin=18*mm)

def ps(size=9, color=colors.black, align=TA_LEFT, indent=0):
    return ParagraphStyle('x', fontName=F, fontSize=size, textColor=color, alignment=align, leading=size*1.5, spaceAfter=3, leftIndent=indent)

def h1(t): return Paragraph(t, ps(20, colors.HexColor('#1a1a2e'), TA_CENTER))
def h2(t): return Paragraph(t, ps(13, colors.HexColor('#0f3460')))
def h3(t): return Paragraph(t, ps(10, colors.HexColor('#16213e')))
def p(t): return Paragraph(t, ps(9))
def pi(t): return Paragraph(t, ps(9, indent=8))
def sp(n=6): return Spacer(1, n)
def hr(): return HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=4, spaceBefore=4)

def tbl(data, widths=None):
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('FONTNAME',(0,0),(-1,-1),F),('FONTSIZE',(0,0),(-1,-1),8),
        ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#cccccc')),
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#0f3460')),
        ('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f0f4f8')]),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('PADDING',(0,0),(-1,-1),4),
    ]))
    return t

def code(lines):
    text = '<br/>'.join(l.replace(' ','&nbsp;').replace('<','&lt;').replace('>','&gt;') for l in lines)
    return Paragraph(text, ParagraphStyle('c', fontName=F, fontSize=7.5, backColor=colors.HexColor('#f4f4f4'), leftIndent=4, leading=11, spaceAfter=6, spaceBefore=4))

story = [
    sp(4), h1('電子工作連携 詳細実装設計書'),
    Paragraph('fighter-game x Raspberry Pi  |  2026-09-12', ps(10, colors.HexColor('#0f3460'), TA_CENTER)),
    sp(6), hr(), sp(4),
    h2('1. 概要'), sp(3),
    p('fighter-game(スマブラ風2D対戦ゲーム)にGPIOボタン・NeoPixel LED・MPU-6050加速度センサーを接続し、物理筐体体験を追加する。'),
    sp(6),
    h2('2. システムアーキテクチャ'), sp(3),
    tbl([
        ['レイヤー','コンポーネント','役割'],
        ['フロントエンド','index.html / src/*.js','ゲーム描画・WebSocket送信(イベント通知)'],
        ['ブリッジ層','hardware_server.py','WebSocketサーバー(ws://localhost:8765)・GPIO/I2C制御'],
        ['入力','タクトスイッチ x10','GPIO入力 -> xdotool キーイベント注入'],
        ['出力','NeoPixel LEDテープ','rpi_ws281x -> ゲームイベントで発光'],
        ['入力','MPU-6050 x2','I2C(smbus2) -> 傾き/振り -> 操作キー変換'],
    ], [28*mm, 45*mm, 92*mm]),
    sp(6),
    h2('3. ハードウェア詳細設計'), sp(3),
    h3('3.1 タクトスイッチ GPIO割り当て'), sp(3),
    tbl([
        ['役割','GPIO','物理Pin','接続先'],
        ['1P 左移動','17','11','GND(9)'],['1P 右移動','25','22','GND(14)'],
        ['1P ジャンプ','27','13','GND(14)'],['1P しゃがみ','22','15','GND(14)'],
        ['1P 弱攻撃','23','16','GND(20)'],['1P 横強攻撃','24','18','GND(20)'],
        ['2P 左移動','5','29','GND(25)'],['2P 右移動','6','31','GND(30)'],
        ['2P ジャンプ','13','33','GND(34)'],['2P しゃがみ','19','35','GND(34)'],
        ['2P 弱攻撃','26','37','GND(39)'],['2P 横強攻撃','21','40','GND(39)'],
    ], [35*mm, 20*mm, 20*mm, 90*mm]),
    sp(6), h3('3.2 NeoPixel'), sp(3),
    tbl([
        ['信号','ラズパイ側','部品','備考'],
        ['DATA','GPIO18(Pin12)','470Ω直列抵抗経由','PWM対応ピン必須'],
        ['VCC','5V(Pin2 or 4)','1000μFコンデンサ並列','大電流対策'],
        ['GND','GND(Pin6)','共通GND','ラズパイと共通'],
    ], [20*mm, 40*mm, 50*mm, 55*mm]),
    sp(6), h3('3.3 MPU-6050 I2C'), sp(3),
    tbl([
        ['信号','ラズパイ側','デバイス側','備考'],
        ['VCC','3.3V(Pin1)','VCC','3.3V動作'],
        ['GND','GND(Pin6)','GND','共通GND'],
        ['SDA','GPIO2/SDA(Pin3)','SDA','I2Cデータ'],
        ['SCL','GPIO3/SCL(Pin5)','SCL','I2Cクロック'],
        ['1P AD0','-','GND接続','I2Cアドレス 0x68'],
        ['2P AD0','-','3.3V接続','I2Cアドレス 0x69'],
    ], [18*mm, 38*mm, 28*mm, 81*mm]),
    sp(8),
    h2('4. ソフトウェア実装設計'), sp(3),
    h3('4.1 ファイル構成'), sp(3),
    code([
        'fighter-game/',
        '+-- src/hardware_bridge.js   新規: WebSocketクライアント',
        '+-- hardware/',
        '    +-- hardware_server.py   新規: メインサーバー(WS+GPIO+LED+IMU)',
        '    +-- gpio_controller.py   新規: ボタン入力->xdotool',
        '    +-- led_controller.py    新規: NeoPixel制御',
        '    +-- imu_controller.py    新規: MPU-6050->xdotool',
        '    +-- requirements.txt     新規: rpi-ws281x, smbus2, websockets',
    ]),
    sp(6), h3('4.2 WebSocket イベントスキーマ'), sp(3),
    tbl([
        ['方向','イベントtype','主要フィールド','用途'],
        ['JS->Server','hit','player, damage','ヒット時LED発光'],
        ['JS->Server','ko','player, stocks_left','KO時LED演出'],
        ['JS->Server','game_start','-','開始演出'],
        ['JS->Server','game_end','winner','終了演出'],
        ['JS->Server','damage_update','p1, p2','常時LED更新'],
    ], [22*mm, 32*mm, 42*mm, 69*mm]),
    sp(6), h3('4.3 src/main.js 変更箇所'), sp(3),
    tbl([
        ['場所','追加コード'],
        ['import部','import { HardwareBridge } from \'./hardware_bridge.js\';'],
        ['初期化','const hw = new HardwareBridge();'],
        ['ヒット判定','hw.send(\'hit\', {player, damage});'],
        ['KO判定','hw.send(\'ko\', {player, stocks_left});'],
        ['ゲームループ末尾','hw.send(\'damage_update\', {p1: f1.damage, p2: f2.damage});'],
    ], [40*mm, 125*mm]),
    sp(6), h3('4.4 GPIO入力変換ロジック（gpio_controller.py）'), sp(3),
    code([
        'KEY_MAP = {17:"a", 25:"d", 27:"w", 22:"s", 23:"f", 24:"g",',
        '            5:"Left", 6:"Right", 13:"Up", 19:"Down", 26:"shift", 21:"ctrl"}',
        '',
        'def poll(self):  # 10ms毎に呼び出し',
        '    for pin, key in KEY_MAP.items():',
        '        val = GPIO.input(pin)',
        '        if val != self._state[pin]:',
        '            action = "keydown" if val==GPIO.LOW else "keyup"',
        '            subprocess.Popen(["xdotool", action, "--clearmodifiers", key])',
        '            self._state[pin] = val',
    ]),
    sp(6), h3('4.5 LEDアニメーション仕様'), sp(3),
    tbl([
        ['イベント','アニメーション','持続'],
        ['hit(P1受け)','P1側30LEDが赤点滅','200ms'],
        ['hit(P2受け)','P2側30LEDが青点滅','200ms'],
        ['ko','全体虹色スクロール','1000ms'],
        ['game_start','全体グリーン->フェードアウト','800ms'],
        ['damage_update','残ストック数を先頭/末尾LEDで常時表示','常時'],
        ['アイドル','中央20LEDが白dimで呼吸','常時'],
    ], [30*mm, 88*mm, 25*mm]),
    sp(6), h3('4.6 IMU入力変換ロジック（imu_controller.py）'), sp(3),
    tbl([
        ['検出','閾値','操作','備考'],
        ['X軸傾き','±15度','左右移動','atan2(ax,az)で計算'],
        ['加速度スパイク','delta>2.0g','攻撃','前フレームとの差分'],
    ], [28*mm, 22*mm, 28*mm, 87*mm]),
    sp(8),
    h2('5. 依存ライブラリ'), sp(3),
    tbl([
        ['ライブラリ','用途','インストール'],
        ['RPi.GPIO','GPIOボタン入力','apt: python3-rpi.gpio'],
        ['rpi-ws281x','NeoPixel LED制御','pip install rpi-ws281x'],
        ['smbus2','MPU-6050 I2C読み取り','pip install smbus2'],
        ['websockets','WebSocketサーバー','pip install websockets'],
        ['xdotool','キーイベント注入','apt install xdotool'],
    ], [32*mm, 50*mm, 83*mm]),
    sp(8),
    h2('6. 起動手順'), sp(3),
    tbl([
        ['手順','コマンド','備考'],
        ['①ライブラリ','pip install -r hardware/requirements.txt','初回のみ'],
        ['②I2C確認','sudo i2cdetect -y 1','0x68/0x69表示確認'],
        ['③ゲームサーバー','python3 -m http.server 8000','バックグラウンド'],
        ['④HWサーバー','sudo python3 hardware/hardware_server.py','NeoPixelはsudo必須'],
        ['⑤ブラウザ','chromium-browser http://localhost:8000','全画面F11推奨'],
    ], [12*mm, 80*mm, 73*mm]),
    sp(8),
    h2('7. 注意事項'), sp(3),
    pi('・NeoPixelのVCCは5V必須。60LED以上の場合は外部5V電源(2A以上)を推奨。'),
    pi('・3.3V GPIO信号で動作しないNeoPixelには74HCT125でレベルシフトが必要。'),
    pi('・MPU-6050のVCCは3.3VとしI2Cバス電圧に合わせること。'),
    pi('・hardware_server.pyはsudo実行が必要(NeoPixelのDMA制御のため)。'),
    pi('・xdotoolはアクティブウィンドウへ送信するため、Chromiumが前面にある必要がある。'),
]

doc.build(story)
print(f"Done: {out}")
