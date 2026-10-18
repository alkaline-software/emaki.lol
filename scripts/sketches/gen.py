# Writes docs/_sk/*.html, the sketches on the docs pages (js/sketches.js
# answers the pointer in them). One base window, Emaki's as the app draws
# it: the sidebar, the chat with its composer, and the four panels
# at its sides. Each page's version keeps the page's own part in color and
# dims the rest (`sk-dim`, a part at a time); the frame, the lights, the
# name and the send button keep their colors on every page. Run from the
# site's root: `python3 scripts/sketches/gen.py`. Edit this, never the output.
import os, re
OUT = "docs/_sk"

# ---- strokes ----
def spark(cx, cy, r=2.5, cls="sk-spark"):
    d = 0.7 * r
    return (f'<path class="{cls}" d="M{cx} {cy-r} v{2*r} M{cx-r} {cy} h{2*r} '
            f'M{cx-d} {cy-d} l{2*d} {2*d} M{cx+d} {cy-d} l{-2*d} {2*d}"/>')
def folder(x, y, cls="sk-frame"):
    return f'<path class="{cls}" d="M{x} {y} h3 l1.5 1.5 H{x+8} V{y+6} H{x} Z"/>'
def check(x, y, cls="sk-tick"):
    return f'<path class="{cls}" d="M{x} {y} l1.6 1.6 l3.2 -3.6"/>'
def chev(x, y, cls="sk-faint"):
    return f'<path class="{cls}" d="M{x} {y-2} l2 2 l-2 2"/>'
def send(cx, cy):
    return (f'<circle class="sk-accent-fill" cx="{cx}" cy="{cy}" r="6.5"/>'
            f'<path class="sk-page" d="M{cx} {cy+3.25} v-6.5 M{cx-3.25} {cy} l3.25 -3.25 l3.25 3.25"/>')
def plus(cx, cy, cls="sk-frame"):
    return (f'<circle class="{cls}" cx="{cx}" cy="{cy}" r="4.5"/>'
            f'<path class="{cls}" d="M{cx} {cy-2.25} v4.5 M{cx-2.25} {cy} h4.5"/>')

# The chrome's buttons, as the app's icon buttons are: a square of 11 with
# its glyph, 6 wide and in the thin stroke (`.sk-glyph`), centered on the
# bar, in a frame when two stand together. A faint one is drawn and does
# nothing; a lit one is `.sk-btn` in its panel's color, filled (`on`)
# while its panel is shown.
def seg_frame(x, n=2):
    return f'<rect class="sk-edge" x="{x}" y="5" width="{n * 12 + 1}" height="13" rx="3"/>'
def glyph(kind, cx, cls):
    if kind == "files": return f'<path class="{cls}" d="M{cx-3} 9.25 h2.25 l1.1 1.1 H{cx+3} V13.75 H{cx-3} Z"/>'
    if kind == "outline": return f'<path class="{cls}" d="M{cx-3} 9.5 h6 M{cx-3} 11.5 h4 M{cx-3} 13.5 h5"/>'
    if kind == "shell": return f'<path class="{cls}" d="M{cx-3} 9.5 l2 2 l-2 2 M{cx+0.5} 13.5 h2.5"/>'
    if kind == "agent": return spark(cx, 11.5, 2.25, cls)
def square(x, kind, btn=None, go=None, off=False, on=False):
    cx = x + 5.5
    if btn is None:
        return f'<rect class="sk-faint" x="{x}" y="6" width="11" height="11" rx="2"/>' + glyph(kind, cx, "sk-faint")
    attrs = (f' data-go="{go}"' if go else '') + (' data-off' if off else '')
    cls = f'sk-btn sk-btn-{btn}' + (' on' if on else '')
    return (f'<g class="{cls}"{attrs}><rect class="sk-hit" x="{x-1}" y="1" width="13" height="21"/>'
            f'<rect class="sk-face" x="{x}" y="6" width="11" height="11" rx="2"/>' + glyph(kind, cx, "sk-glyph") + '</g>')

# ---- the window ----
MAIN_L, MAIN_R = 88, 318      # the main area, between the sidebar's edge and the frame
LP = 92                        # the left panel's x; it is 64 wide
RP = MAIN_R - 6 - 64           # the right panel's x
LEFT_ROOM, RIGHT_ROOM = 72, 74 # what the chat gives a panel at each side
PANE_W, PANE_ROOM = 54, 58     # the file's pane beside the tree, and what the chat gives it

def chrome():
    return [
        '<g class="sk-frame"><rect class="sk-window" x="0" y="0" width="320" height="220" rx="8"/><path d="M1 22 H319 M88 22 V219"/></g>',
        '<g class="sk-lights"><circle class="sk-rose" cx="13" cy="11.5" r="3.5"/><circle class="sk-ochre" cx="24" cy="11.5" r="3.5"/><circle class="sk-sage" cx="35" cy="11.5" r="3.5"/></g>',
        '<image href="../assets/emaki-icon.png" x="46" y="5" width="13" height="13"/>',
        '<text class="sk-name" x="62" y="15">Emaki</text>',
    ]
def defs():
    return ['<defs><clipPath id="sk-main"><rect x="89" y="23" width="229" height="195"/></clipPath>'
            '<clipPath id="sk-tx"><rect x="89" y="23" width="229" height="118"/></clipPath></defs>']

# A part of the window: in color when it is the page's, dimmed otherwise.
def part(name, focus, body):
    cls = "sk-part" if focus else "sk-part sk-dim"
    return [f'<g class="{cls}" data-part="{name}">'] + ['  ' + b for b in body] + ['</g>']

# A group moved by the spring: `when` names the state(s), `on` the offset
# in each, `rest` the offset at rest when it is not none.
def wrap(body, when, on, rest=None):
    attrs = f' data-when="{when}"' + (f' data-rest="{rest}"' if rest else '') + f' data-on="{on}"'
    return [f'<g{attrs}>'] + ['  ' + b for b in body] + ['</g>']

# data-when/data-on for a dict of state -> offsets, `pick` choosing which.
def mv(moves, pick):
    if not moves: return ''
    return f' data-when="{" ".join(moves)}" data-on="{"|".join(pick(v) for v in moves.values())}"'

# ---- the sidebar ----
# New Session, All Sessions and Agents, then the projects, the first open
# with its sessions under it, and the two sections at the foot. With
# `hits`, New Session, the folder and a session answer the pointer.
def sidebar(hits=False):
    if hits:
        new = '<g class="sk-btn" data-go="new"><rect class="sk-hit" x="4" y="26" width="80" height="16"/><circle class="sk-face" cx="14" cy="34" r="4.5"/><path class="sk-glyph" d="M14 32 v4 M12 34 h4"/></g>'
        fold = ('<g class="sk-btn sk-btn-ochre sk-fold" data-go="fold"><path class="sk-face" d="M11 79 h3 l1.5 1.5 H19 V85 H11 Z"/><text class="sk-lit" x="24" y="82.5">emaki</text>'
                '<path class="sk-faint" d="M62 80 l4 4 M64.5 79.5 l-1 1 M63.5 83.5 l1 -1"/><text class="sk-small" x="72" y="82.5">31</text><rect class="sk-hit" x="5" y="75" width="78" height="14"/></g>')
        row = '<rect class="sk-row" data-go="open" x="17" y="113" width="62" height="12" rx="3"/>'
    else:
        new = '<circle class="sk-frame" cx="14" cy="34" r="4.5"/><path class="sk-frame" d="M14 32 v4 M12 34 h4"/>'
        fold = (folder(11, 79, "sk-ochre-line") + '<text class="sk-lit" x="24" y="82.5">emaki</text>'
                '<path class="sk-faint" d="M62 80 l4 4 M64.5 79.5 l-1 1 M63.5 83.5 l1 -1"/><text class="sk-small" x="72" y="82.5">31</text>')
        row = ''
    return [
      '<!-- The sidebar: New Session, All Sessions and Agents, then the projects, the first open with its sessions under it, and the sections at the foot. -->',
      new, '<text class="sk-lit" x="23" y="34.5">New Session</text>',
      '<path class="sk-frame" d="M11 44 h6 v6 h-6 Z M12.5 47 h3"/><text x="23" y="47.5">All Sessions</text>',
      spark(14, 59) + '<text x="23" y="59.5">Agents</text>',
      '<text class="sk-small" x="11" y="72">Projects</text>',
      fold,
      '<g data-hide="fold">',
      '  <path class="sk-faint" d="M14.5 89 V134"/>',
      '  ' + spark(24, 95) + '<path class="sk-frame" d="M31 95 h30"/>',
      '  ' + spark(24, 107) + '<path class="sk-frame" d="M31 107 h24"/>',
      '  <rect class="sk-accent-fill" data-show="open" x="5" y="114" width="1.5" height="10" rx="0.75"/>',
      '  ' + spark(24, 119) + '<path class="sk-frame" d="M31 119 h28"/><circle class="sk-sage" cx="73" cy="119" r="1.75"/>',
      '  ' + row,
      '  <path class="sk-faint" d="M31 131 h12"/>',
      '</g>',
      '<g data-when="fold" data-on="0 -48">',
      '  ' + folder(11, 142) + '<path class="sk-frame" d="M24 145 h20"/><text class="sk-small" x="74" y="145.5">4</text>',
      '  ' + folder(11, 154) + '<path class="sk-frame" d="M24 157 h16"/><text class="sk-small" x="74" y="157.5">2</text>',
      '  <text class="sk-small" x="11" y="172">Temporary</text><text class="sk-small" x="72" y="172">10</text>',
      '</g>',
    ]

# ---- the chat ----
# Between x0 and x1: the tab on the strip, a prompt in its bubble, the
# agent's name and reply with a tool call on a card, the composer with
# its row under it, and the status row. `moves` is state -> (dx of the
# left end, dx of the right end, dy of the transcript), for the panels
# that take room and the outline's glide. With `hits` the tool call, the
# plus, the mode and the effort answer the pointer; `caret` blinks the
# caret; `rounds` draws a second round under the first for the glide.
# Returns the body and the send button, which is drawn apart and keeps
# its color on every page.
def chat(x0, x1, moves=None, hits=False, caret=False, rounds=1):
    moves = moves or {}
    cx0, cx1 = x0 + 16, x1 - 16
    u = cx1 - cx0
    TL = mv(moves, lambda v: f'{v[0]} {v[2]}')
    TR = mv(moves, lambda v: f'{v[1]} {v[2]}')
    CL = mv(moves, lambda v: f'{v[0]} 0')
    CR = mv(moves, lambda v: f'{v[1]} 0')
    grow = (' data-grow="' + "|".join(str(v[1] - v[0]) for v in moves.values()) + '"') if moves else ''
    right_in = any(v[1] < 0 for v in moves.values())
    def bubble(y, w):
        bx = cx1 - w
        return (f'<path class="sk-edge" d="M{bx+8} {y} H{cx1-8} a8 8 0 0 1 8 8 V{y+14} a8 8 0 0 1 -8 8 H{bx+8} a8 8 0 0 1 -8 -8 V{y+8} a8 8 0 0 1 0 -4 l-4 -4 Z"/>'
                f'<path class="sk-frame" d="M{bx+8} {y+11} h{w-16}"/>')
    bw = min(84, int(0.42 * u)); cw = min(120, int(0.86 * u))
    out = ['<!-- The chat: the tab on the strip, a prompt in its bubble, the agent\'s name and reply with a tool call on a card, the composer with its row of pills, and the status row under it. -->',
           '<rect class="sk-edge" x="165" y="5.5" width="76" height="12" rx="6"/>' + spark(174, 11.5, 2.5) + '<path class="sk-frame" d="M180 11.5 h30"/>',
           '<g clip-path="url(#sk-tx)">',
           f'  <g{TR}>' + bubble(40, bw) + (bubble(146, int(bw * 0.8)) if rounds > 1 else '') + '</g>']
    left = [spark(cx0 + 6, 74, 4.5) + f'<path class="sk-ink" d="M{cx0+14} 74 h18"/>' + (f'<text class="sk-small" x="{cx0+36}" y="74.5">Fable 5.1</text>' if u >= 100 else ''),
            f'<path class="sk-frame" d="M{cx0} 86 h{int(.72*u)} M{cx0} 96 h{int(.5*u)}"/>']
    closed = (f'<rect class="sk-edge" x="{cx0}" y="104" width="{cw}" height="14" rx="3"/>' + chev(cx0 + 6, 111)
              + f'<rect class="sk-badge" x="{cx0+12}" y="107.5" width="16" height="7" rx="2"/><path class="sk-frame" d="M{cx0+32} 111 h{max(10, cw-70)}"/>'
              + (f'<text class="sk-small sk-accent-text" x="{cx0+cw-28}" y="111.5">Explain</text>' if cw >= 100 else ''))
    tail = f'<path class="sk-frame" d="M{cx0} 124 h{int(.63*u)} M{cx0} 132 h{int(.36*u)}"/>'
    if hits:
        left += [f'<g data-hide="tool">{closed}</g>',
                 f'<rect class="sk-row" data-go="tool" x="{cx0}" y="104" width="{cw}" height="14" rx="3"/>',
                 f'<g data-show="tool"><rect class="sk-edge" x="{cx0}" y="104" width="{cw}" height="34" rx="3"/><path class="sk-frame" d="M{cx0+4} 110 l2 2 l2 -2"/><rect class="sk-badge" x="{cx0+12}" y="107.5" width="16" height="7" rx="2"/><path class="sk-frame" d="M{cx0+32} 111 h{cw-70}"/><path class="sk-faint" d="M{cx0} 118 H{cx0+cw} M{cx0+6} 124 h{cw-40} M{cx0+6} 129 h{cw-60}"/><path class="sk-accent" d="M{cx0+6} 134 h{cw-50}"/></g>',
                 f'<g data-when="tool" data-on="0 20">{tail}</g>']
    else:
        left += [closed, tail]
    if rounds > 1:
        left.append(spark(cx0 + 6, 180, 4.5) + f'<path class="sk-ink" d="M{cx0+14} 180 h18"/><path class="sk-frame" d="M{cx0} 192 h{int(.68*u)} M{cx0} 202 h{int(.44*u)} M{cx0} 212 h{int(.6*u)}"/>')
    out += [f'  <g{TL}>'] + ['    ' + l for l in left] + ['  </g>', '</g>']
    # the composer, and the status row under it, cut at the frame when a pane pushes them
    out.append('<g clip-path="url(#sk-main)">')
    out.append(f'<rect class="sk-edge" x="{cx0}" y="144" width="{u}" height="52" rx="7"{CL}{grow}/>')
    comp = []
    car = f'<path class="sk-ink{" sk-caret" if caret else ""}" d="M{cx0+8} 152 v9"/><path class="sk-frame" d="M{cx0+12} 156.5 h{int(.4*u)}"/>'
    if hits:
        comp += [f'<g data-show="attach"><rect class="sk-plate" x="{cx0+8}" y="149" width="62" height="14" rx="3"/><path class="sk-frame" d="M{cx0+13} 152.5 h5 l2.5 2.5 v5 h-7.5 Z"/><path class="sk-ink" d="M{cx0+25} 155 h26"/><path class="sk-faint" d="M{cx0+25} 160 h16"/></g>',
                 f'<g data-when="attach" data-on="0 14">{car}</g>',
                 '<!-- The row under the message: the plus, the mode and effort pills in the agent\'s colors, the model, and send; a pill opens its list in place. -->',
                 f'<g class="sk-btn" data-go="attach"><rect class="sk-hit" x="{cx0}" y="175" width="20" height="20"/><circle class="sk-face" cx="{cx0+10}" cy="185" r="5"/><path class="sk-glyph" d="M{cx0+10} 183 v4 M{cx0+8} 185 h4"/></g>',
                 f'<g class="sk-btn sk-btn-sage" data-go="mode"><rect class="sk-hit" x="{cx0+20}" y="175" width="44" height="20"/><rect class="sk-face" x="{cx0+22}" y="179" width="40" height="12" rx="6"/><path class="sk-glyph" d="M{cx0+28.5} 182.5 l2.5 -1.25 l2.5 1.25 v3 a2.5 2.5 0 0 1 -2.5 2.25 a2.5 2.5 0 0 1 -2.5 -2.25 Z"/><path class="sk-glyph" d="M{cx0+37} 185 h20"/></g>',
                 f'<g class="sk-btn sk-btn-mauve" data-go="effort"><rect class="sk-hit" x="{cx0+64}" y="175" width="40" height="20"/><rect class="sk-face" x="{cx0+66}" y="179" width="36" height="12" rx="6"/><circle class="sk-glyph" cx="{cx0+73}" cy="185" r="2"/><path class="sk-glyph" d="M{cx0+73} 183 v-1.25 M{cx0+73} 187 v1.25 M{cx0+79} 185 h18"/></g>',
                 f'<rect class="sk-edge" x="{cx1-66}" y="179" width="44" height="12" rx="6"/>' + spark(cx1 - 59, 185, 2.5) + f'<path class="sk-frame" d="M{cx1-53} 185 h26"/>',
                 f'<g data-show="mode"><rect class="sk-pop" x="{cx0+22}" y="100" width="64" height="40" rx="4"/><circle class="sk-accent-fill" cx="{cx0+30}" cy="108" r="1.75"/><path class="sk-ink" d="M{cx0+36} 108 h26"/><path class="sk-frame" d="M{cx0+36} 120 h20 M{cx0+36} 132 h30"/></g>',
                 f'<g data-show="effort"><rect class="sk-pop" x="{cx0+66}" y="100" width="60" height="40" rx="4"/><path class="sk-frame" d="M{cx0+80} 108 h16 M{cx0+80} 120 h24"/><circle class="sk-accent-fill" cx="{cx0+74}" cy="132" r="1.75"/><path class="sk-ink" d="M{cx0+80} 132 h20"/></g>']
    else:
        comp += [car, plus(cx0 + 10, 185),
                 f'<rect class="sk-edge" x="{cx0+22}" y="179" width="26" height="12" rx="6"/><circle class="sk-frame" cx="{cx0+28}" cy="185" r="1.25"/><path class="sk-frame" d="M{cx0+32} 185 h11"/>']
        if u >= 150:
            comp.append(f'<rect class="sk-edge" x="{cx0+52}" y="179" width="22" height="12" rx="6"/><circle class="sk-frame" cx="{cx0+58}" cy="185" r="1.25"/><path class="sk-frame" d="M{cx0+62} 185 h8"/>')
    # the status row: context used, and the limits
    bar = 40 if u >= 150 else max(16, u - 32)
    # The bar shrinks only as far as the box's new width asks, never grows.
    bgrow = (' data-grow="' + "|".join(str(min(0, u + v[1] - v[0] - 32 - bar)) for v in moves.values()) + '"') if moves else ''
    out.append(f'<rect class="sk-plate" x="{cx0+27}" y="204.5" width="{bar}" height="4" rx="2"{CL}{bgrow}/>')
    comp.append(f'<text class="sk-small" x="{cx0}" y="207">Context</text><rect class="sk-accent-fill" x="{cx0+27}" y="204.5" width="8" height="4" rx="2"/>')
    if u >= 150:
        comp.append(f'<path class="sk-faint" d="M{cx0+73} 203 v7"/><text class="sk-small" x="{cx0+79}" y="207">5h · 49%</text>')
        if u >= 190 and not right_in:
            comp.append(f'<path class="sk-faint" d="M{cx0+115} 203 v7"/><text class="sk-small" x="{cx0+121}" y="207">7d · 56%</text>')
    out += [f'<g{CL}>'] + ['  ' + c for c in comp] + ['</g>', '</g>']
    snd = f'<g{CR}>' + send(cx1 - 11, 185) + '</g>'
    return out, snd

# ---- the panels ----
# Each is its box at one side, drawn as the app has it. With `hits` what
# can be done in it answers the pointer.
def files_panel(hits=False):
    x = LP
    b = [f'<g class="sk-box sk-c-ochre"><rect x="{x}" y="26" width="64" height="186" rx="3"/>',
         f'  <text class="sk-start sk-small" x="{x+6}" y="34">Files</text>']
    if hits:
        b += [f'  <g class="sk-btn sk-btn-ochre" data-go="branches"><rect class="sk-hit" x="{x+24}" y="27" width="24" height="14"/><rect class="sk-face" x="{x+26}" y="29.5" width="20" height="9" rx="4.5"/><text class="sk-small sk-lit sk-in" x="{x+30}" y="34">main</text></g>',
              f'  <g class="sk-btn sk-btn-ochre" data-go="changes"><rect class="sk-hit" x="{x+48}" y="27" width="14" height="14"/><rect class="sk-face" x="{x+49}" y="29.5" width="11" height="9" rx="4.5"/><text class="sk-small sk-lit sk-in" x="{x+52.5}" y="34">2</text></g>']
    else:
        b.append(f'  <rect class="sk-edge" x="{x+26}" y="29.5" width="20" height="9" rx="4.5"/><text class="sk-small" x="{x+30}" y="34">main</text><rect class="sk-edge" x="{x+49}" y="29.5" width="11" height="9" rx="4.5"/><text class="sk-small" x="{x+52.5}" y="34">2</text>')
    b += [f'  <path class="sk-faint" d="M{x} 42 H{x+64}"/>',
          '  <!-- The tree, with git\'s marks: a changed folder\'s dot, a changed file\'s letter, an ignored one dim. -->',
          '  ' + chev(97, 50, "sk-frame") + folder(101, 47) + '<path class="sk-ink" d="M113 50 h22"/>',
          '  ' + chev(101, 62) + folder(105, 59) + '<path class="sk-frame" d="M117 62 h18"/><circle class="sk-sage" cx="149" cy="62" r="1.5"/>',
          '  ' + chev(101, 74) + folder(105, 71) + '<path class="sk-frame" d="M117 74 h14"/><circle class="sk-sage" cx="149" cy="74" r="1.5"/>',
          '  <path class="sk-frame" d="M106 83 h5 l2.5 2.5 v6.5 h-7.5 Z M117 86 h20"/><text class="sk-small sk-sage-text" x="146" y="86.5">M</text>',
          '  <path class="sk-frame" d="M106 95 h5 l2.5 2.5 v6.5 h-7.5 Z M117 98 h24"/><text class="sk-small sk-sage-text" x="146" y="98.5">M</text>',
          '  <rect class="sk-accent-fill" data-show="open" x="92.5" y="104" width="1.5" height="12" rx="0.75"/>' if hits else '',
          '  <path class="sk-frame" d="M106 107 h5 l2.5 2.5 v6.5 h-7.5 Z M117 110 h16"/><text class="sk-small sk-ochre-text" x="146" y="110.5">U</text>',
          '  <rect class="sk-row" data-go="open" x="95" y="104" width="58" height="12" rx="3"/>' if hits else '',
          '  <path class="sk-faint" d="M106 119 h5 l2.5 2.5 v6.5 h-7.5 Z M117 122 h22"/>',
          '  <path class="sk-frame" d="M106 131 h5 l2.5 2.5 v6.5 h-7.5 Z M117 134 h18"/>',
          '</g>']
    if not hits: return b
    b += [
      '<!-- The file\'s pane, between the tree and the chat: code with its line numbers, colors and a gutter mark. -->',
      '<g data-when="open" data-rest="-40 0" data-on="0 0" data-show="open">',
      f'  <g class="sk-box sk-c-slate"><rect x="160" y="26" width="{PANE_W}" height="186" rx="3"/><text class="sk-start sk-small sk-lit" x="166" y="34">main.rs</text><path class="sk-faint" d="M203 31 l5 5 M208 31 l-5 5 M160 40 H{160+PANE_W}"/>',
      '    <path class="sk-faint" d="M164 50 h2 M164 58 h2 M164 66 h2 M164 74 h2 M164 82 h2 M164 90 h2 M164 98 h2 M164 106 h2"/>',
      '    <path class="sk-slate-line" d="M170 50 h8"/><path class="sk-frame" d="M181 50 h12 M174 58 h18"/><path class="sk-mauve-line" d="M195 58 h12"/><path class="sk-frame" d="M174 66 h16 M174 74 h26 M170 82 h10"/><path class="sk-sage-line" d="M183 82 h18"/><path class="sk-frame" d="M174 90 h20 M174 98 h14 M170 106 h18"/>',
      '    <rect class="sk-sage" x="161" y="56" width="1.5" height="12" rx="0.75"/>',
      '  </g>',
      '</g>',
      '<!-- The branches, from the pill at the head: the one checked out ticked, the rest by recency, and a new one. -->',
      '<g data-show="branches"><rect class="sk-pop" x="96" y="42" width="70" height="52" rx="4"/>' + check(102, 51, "sk-accent") + '<path class="sk-ink" d="M112 51 h22"/><path class="sk-frame" d="M112 62 h26 M112 73 h18"/><path class="sk-faint" d="M96 79 H166"/><path class="sk-accent" d="M103.5 84 v6 M100.5 87 h6"/><text class="sk-small sk-accent-text" x="112" y="87.5">New branch</text></g>',
      '<!-- The Changes sheet over the window, from the pill with the count: the files ticked, the picked file\'s lines beside the last commit\'s, the commit under the files, History beside Changes, the branch and Push. -->',
      '<g data-show="changes">',
      '  <rect class="sk-scrim" x="89" y="23" width="229" height="195"/>',
      '  <rect class="sk-pop" x="98" y="30" width="214" height="176" rx="5"/>',
      '  <rect class="sk-edge" x="104" y="35" width="64" height="12" rx="3"/><rect class="sk-plate" x="105" y="36" width="31" height="10" rx="2"/><text class="sk-small sk-lit" x="109" y="41.5">Changes</text><text class="sk-small" x="142" y="41.5">History</text>',
      '  <rect class="sk-edge" x="228" y="35" width="48" height="12" rx="6"/><path class="sk-frame" d="M235 38.5 v5 M235 38.5 a2.5 2.5 0 0 0 2.5 2.5 h1.5 M239.5 38.5 v1"/><text class="sk-small sk-lit" x="246" y="41.5">main</text>' + chev(269, 41) + '<rect class="sk-edge" x="278" y="35" width="30" height="12" rx="6"/><text class="sk-small" x="283" y="41.5">Push</text><text class="sk-small sk-lit" x="300" y="41.5">1</text>',
      '  <path class="sk-faint" d="M98 52 H312 M176 52 V206"/>',
      '  <rect class="sk-tickbox" x="105" y="59" width="6" height="6" rx="1"/>' + check(105.5, 62, "sk-tick") + '<path class="sk-frame" d="M116 62 h34"/><text class="sk-small sk-sage-text" x="164" y="62.5">M</text>',
      '  <rect class="sk-wash" x="100" y="68" width="74" height="12" rx="3"/><rect class="sk-tickbox" x="105" y="71" width="6" height="6" rx="1"/>' + check(105.5, 74, "sk-tick") + '<path class="sk-frame" d="M116 74 h26"/><text class="sk-small sk-ochre-text" x="164" y="74.5">U</text>',
      '  <rect class="sk-tickbox" x="105" y="83" width="6" height="6" rx="1"/><path class="sk-frame" d="M116 86 h30"/><text class="sk-small sk-sage-text" x="164" y="86.5">M</text>',
      '  <path class="sk-faint" d="M98 150 H176"/>',
      '  <rect class="sk-field" x="104" y="156" width="66" height="11" rx="2"/><path class="sk-ink" d="M109 161.5 h30"/><text class="sk-small sk-accent-text" x="162" y="162">*</text>',
      '  <rect class="sk-field" x="104" y="170" width="66" height="14" rx="2"/><path class="sk-faint" d="M109 177 h40"/>',
      '  <rect class="sk-accent-fill" x="104" y="188" width="66" height="12" rx="3"/><text class="sk-small sk-page-text" x="110" y="194.5">Commit 2 files</text>',
      '  <text class="sk-small" x="184" y="62">notes.md</text><path class="sk-faint" d="M186 72 h3 M186 80 h3 M186 88 h3 M186 96 h3 M186 104 h3"/><rect class="sk-sage-wash" x="180" y="68" width="128" height="40"/><path class="sk-added" d="M194 72 h70 M194 80 h50 M194 88 h80 M194 96 h30 M194 104 h60"/>',
      '</g>',
    ]
    return b

def outline_panel(hits=False):
    x = LP
    b = [f'<g class="sk-box sk-c-mauve"><rect x="{x}" y="26" width="64" height="186" rx="3"/><text class="sk-start sk-small" x="{x+6}" y="34">Outline</text><path class="sk-faint" d="M{x} 40 H{x+64}"/>',
         f'  <text class="sk-small" x="{x+6}" y="49">Today</text>']
    ys = [58, 75, 92, 109]
    mark = f'<rect class="sk-wash" x="{x+3}" y="{ys[0]-6}" width="58" height="17" rx="3"/><rect class="sk-accent-fill" x="{x+0.5}" y="{ys[0]-4}" width="1.5" height="13" rx="0.75"/>'
    b.append('  <!-- An entry a prompt: its time on a plate and its label; the one in view wears the accent. -->')
    b.append('  <g data-when="e2 e3 e4" data-on="0 17|0 34|0 51">' + mark + '</g>' if hits else '  ' + mark)
    for i, (y, (a, c)) in enumerate(zip(ys, [(34, 24), (28, 32), (30, 20), (32, 16)])):
        ink = "sk-ink" if i == 0 else "sk-frame"
        b.append(f'  <rect class="sk-plate" x="{x+6}" y="{y-3}" width="14" height="7" rx="2"/><path class="{ink}" d="M{x+24} {y+0.5} h{a} M{x+24} {y+6.5} h{c}"/>')
        if hits: b.append(f'  <rect class="sk-row" data-go="e{i+1}" x="{x+3}" y="{y-6}" width="58" height="17" rx="3"/>')
    b.append('</g>')
    return b

def shell_panel(hits=False):
    x = RP
    b = [f'<g class="sk-box sk-c-sage"><rect x="{x}" y="26" width="64" height="186" rx="3"/>',
         '  <!-- The shell: its tabs at the head with the plus for another, then a prompt, what it printed, and the cursor. -->',
         f'  <path class="sk-sage-line" d="M{x+6} 32 l2 2 l-2 2"/><text class="sk-small sk-lit" x="{x+11}" y="34.5">zsh 1</text>']
    if hits:
        b += [f'  <g data-show="tab"><path class="sk-sage-line" d="M{x+30} 32 l2 2 l-2 2"/><text class="sk-small sk-lit" x="{x+35}" y="34.5">zsh 2</text></g>',
              f'  <g class="sk-btn sk-btn-sage" data-go="tab"><rect class="sk-hit" x="{x+51}" y="26" width="13" height="15"/><circle class="sk-face" cx="{x+58}" cy="34" r="4.5"/><path class="sk-glyph" d="M{x+58} 32 v4 M{x+56} 34 h4"/></g>']
    else:
        b.append(f'  <path class="sk-faint" d="M{x+32} 32 l4 4 M{x+36} 32 l-4 4"/><path class="sk-frame" d="M{x+57} 31 v6 M{x+54} 34 h6"/>')
    b.append(f'  <path class="sk-faint" d="M{x} 40 H{x+64}"/>')
    screen = (f'<path class="sk-sage-line" d="M{x+6} 49 l3 3 l-3 3"/><path class="sk-frame" d="M{x+15} 52 h36"/><path class="sk-faint" d="M{x+6} 62 h46 M{x+6} 68 h32 M{x+6} 74 h40"/>'
              f'<path class="sk-sage-line" d="M{x+6} 83 l3 3 l-3 3"/><path class="sk-frame" d="M{x+15} 86 h26"/><path class="sk-faint" d="M{x+6} 96 h40 M{x+6} 102 h24"/>'
              f'<path class="sk-sage-line" d="M{x+6} 111 l3 3 l-3 3"/><rect class="sk-accent-fill" x="{x+15}" y="111" width="4" height="6"/>')
    if hits:
        b += [f'  <g data-hide="tab">{screen}</g>',
              f'  <g data-show="tab"><path class="sk-sage-line" d="M{x+6} 49 l3 3 l-3 3"/><rect class="sk-accent-fill" x="{x+15}" y="49" width="4" height="6"/></g>']
    else:
        b.append('  ' + screen)
    b.append('</g>')
    return b

def agent_panel(hits=False):
    x = RP
    b = [f'<g class="sk-box sk-c-claude"><rect x="{x}" y="26" width="64" height="186" rx="3"/>',
         '  <!-- The agent\'s side, in Claude\'s color: the agent as it runs in its own terminal, drawn whole and two-way. -->',
         '  ' + spark(x + 10, 34, 3, "sk-claude-spark") + f'<text class="sk-small sk-lit" x="{x+16}" y="34.5">Claude Code</text><path class="sk-faint" d="M{x} 40 H{x+64}"/>',
         f'  <rect class="sk-edge" x="{x+5}" y="46" width="54" height="30" rx="2"/><path class="sk-frame" d="M{x+10} 53 h40 M{x+10} 60 h30 M{x+10} 67 h36"/>',
         f'  <path class="sk-claude-line" d="M{x+6} 86 l3 3 l-3 3"/><path class="sk-frame" d="M{x+15} 89 h30"/><path class="sk-faint" d="M{x+6} 99 h46 M{x+6} 105 h30"/>',
         f'  <rect class="sk-edge" x="{x+5}" y="112" width="54" height="14" rx="2"/><path class="sk-claude-line" d="M{x+10} 117 l2 2 l-2 2"/>']
    if hits:
        b += [f'  <path class="sk-ink" data-show="type" d="M{x+16} 119 h26"/>',
              f'  <rect class="sk-accent-fill" x="{x+16}" y="116" width="4" height="6" data-when="type" data-on="28 0"/>',
              f'  <rect class="sk-row" data-go="type" x="{x+5}" y="112" width="54" height="14" rx="2"/>']
    else:
        b.append(f'  <rect class="sk-accent-fill" x="{x+16}" y="116" width="4" height="6"/>')
    b.append('</g>')
    return b

# The strip's controls: the two segments at the left and the two at the
# right. `lit` names the page's own, filled while its panel shows and
# putting it away under the pointer; the rest are faint.
def controls(lit=None):
    kinds = [("files", 93, "ochre"), ("outline", 105, "mauve"), ("shell", 291, "sage"), ("agent", 303, "claude")]
    out = [seg_frame(92), seg_frame(290)]
    own = []
    for kind, x, color in kinds:
        if kind == lit: own.append(square(x, kind, color, go="away", off=True))
        else: out.append(square(x, kind))
    return out, own

def write(name, home, still, label, caption, body, path=None, cls="sketch", size=(320, 220)):
    lines = [f'<figure class="{cls}" data-home="{home}" data-still="{still}">',
             f'  <svg viewBox="0 0 {size[0]} {size[1]}" role="img" aria-label="{label}">']
    for b in body:
        for l in b.split("\n"):
            if not l.strip(): continue      # a blank line would end Pandoc's raw block
            lines.append(re.sub(r"^ {3,}", "  ", l))
    lines.append('  </svg>')
    if caption:
        lines.append(f'  <figcaption class="sketch-label">{caption}</figcaption>')
    lines.append('</figure>')
    text = "\n".join(lines) + "\n"
    assert "\n\n" not in text
    for l in text.split("\n"):
        assert not l.startswith("    "), l
    if path:                                 # a page at the site's root sees assets/ from there
        text = text.replace('href="../assets/', 'href="assets/')
    with open(path or os.path.join(OUT, name + ".html"), "w") as f:
        f.write(text)

# ---- Get Started: the whole window, the four buttons bringing their panels ----
conv, snd = chat(MAIN_L, MAIN_R, {"files": (LEFT_ROOM, 0, 0), "outline": (LEFT_ROOM, 0, 0), "shell": (0, -RIGHT_ROOM, 0), "agent": (0, -RIGHT_ROOM, 0)})
body = chrome() + defs() + part("sidebar", True, sidebar()) + part("chat", True, conv) + [
  '<!-- The four buttons on the strip, each bringing its panel beside the chat, which makes room. -->',
  seg_frame(92), square(93, "files", "ochre", go="files"), square(105, "outline", "mauve", go="outline"),
  seg_frame(290), square(291, "shell", "sage", go="shell"), square(303, "agent", "claude", go="agent"),
  '<g clip-path="url(#sk-main)">'] + wrap(files_panel(), "files", "0 0", "-70 0") + wrap(outline_panel(), "outline", "0 0", "-70 0") \
  + wrap(shell_panel(), "shell", "0 0", "86 0") + wrap(agent_panel(), "agent", "0 0", "86 0") + ['</g>', snd]
write("index", "", "files",
      "Emaki's window: the sidebar with its projects and sessions, the chat with its composer in the middle, and four buttons on the strip, two at each end, each bringing a panel beside the chat: files or outline at the left, the shell or the agent's terminal at the right.",
      "The four buttons bring their panels beside the chat.", body)
# ---- The landing page's hero: Emaki's window as it opens ----
# Abstract, as the handscroll is: no words but the name. The sidebar's
# rows are their glyphs and a line each; in the main area the handscroll's
# place and, under it, the composer, its caret and a line
# for the draft, the plus, two pills, the model and send, and the row of
# the folder and the agent under it. The handscroll itself is the real one
# (_hero.html), laid over its place by the sheet (.home), so it winds
# under the pointer as it does on its own; HOME_SCROLL is that place, and
# css/theme.scss (.home > .hero-fig) holds the same numbers.
# The window is wider and shorter than the docs' (HOME_W by HOME_H), so the
# first screen keeps room under it for the name and the buttons.
HOME_W, HOME_H = 360, 168
HOME_SCROLL = (148.5, 37, 150)          # x, y and width of the handscroll in the window
cx0, cx1, C0 = 128, 319, 103            # the composer's left and right, and its top
home_chrome = [
  f'<g class="sk-frame"><rect class="sk-window" x="0" y="0" width="{HOME_W}" height="{HOME_H}" rx="8"/><path d="M1 22 H{HOME_W-1} M88 22 V{HOME_H-1}"/></g>',
] + chrome()[1:]
home_side = [
  '<!-- The sidebar: new, all and agents, then the projects, the first open with its sessions. -->',
  plus(14, 34), '<path class="sk-ink" d="M23 34 h34"/>',
  '<path class="sk-frame" d="M11 44 h6 v6 h-6 Z M12.5 47 h3"/><path class="sk-frame" d="M23 47 h28"/>',
  spark(14, 59) + '<path class="sk-frame" d="M23 59 h22"/>',
  '<path class="sk-faint" d="M11 72 h18"/>',
  folder(11, 79, "sk-ochre-line") + '<path class="sk-ink" d="M24 82 h26"/>',
  '<path class="sk-faint" d="M14.5 89 V122"/>',
  spark(24, 95) + '<path class="sk-frame" d="M31 95 h30"/><circle class="sk-sage" cx="73" cy="95" r="1.75"/>',
  spark(24, 107) + '<path class="sk-frame" d="M31 107 h24"/>',
  spark(24, 119) + '<path class="sk-frame" d="M31 119 h28"/>',
  folder(11, 130) + '<path class="sk-frame" d="M24 133 h20"/>',
  folder(11, 142) + '<path class="sk-frame" d="M24 145 h16"/>',
  folder(11, 154) + '<path class="sk-frame" d="M24 157 h22"/>',
]
home_main = [
  '<!-- The handscroll stands here, laid over by the page (.home > .hero-fig). -->',
  '<!-- The composer, over the folder and the agent it starts in. -->',
  f'<rect class="sk-plate" x="{cx0}" y="{C0+28}" width="{cx1-cx0}" height="20" rx="7"/>',
  f'<rect class="sk-page-fill" x="{cx0}" y="{C0}" width="{cx1-cx0}" height="38" rx="7"/><rect class="sk-edge" x="{cx0}" y="{C0}" width="{cx1-cx0}" height="38" rx="7"/>',
  f'<path class="sk-ink sk-caret" d="M{cx0+8} {C0+6.5} v8"/><path class="sk-faint" d="M{cx0+12} {C0+10.5} h46"/>',
  plus(cx0 + 10, C0 + 29),
  f'<rect class="sk-edge" x="{cx0+20}" y="{C0+23}" width="30" height="12" rx="6"/><path class="sk-ochre-line" d="M{cx0+25.5} {C0+26.5} l2.5 -1.25 l2.5 1.25 v3 a2.5 2.5 0 0 1 -2.5 2.25 a2.5 2.5 0 0 1 -2.5 -2.25 Z"/><path class="sk-ochre-line" d="M{cx0+33.5} {C0+29} h12"/>',
  f'<rect class="sk-edge" x="{cx0+54}" y="{C0+23}" width="30" height="12" rx="6"/><circle class="sk-frame" cx="{cx0+61}" cy="{C0+29}" r="2"/><path class="sk-frame" d="M{cx0+66.5} {C0+29} h12"/>',
  f'<rect class="sk-edge" x="{cx1-46}" y="{C0+23}" width="26" height="12" rx="6"/><path class="sk-frame" d="M{cx1-40} {C0+29} h14"/>',
  send(cx1 - 9, C0 + 29),
  folder(cx0 + 7, C0 + 40) + f'<path class="sk-frame" d="M{cx0+19} {C0+43} h40"/>',
  f'<path class="sk-faint" d="M{cx1-44} {C0+39} v8"/>' + spark(cx1 - 36, C0 + 43, 2.5, "sk-claude-spark") + f'<path class="sk-frame" d="M{cx1-30} {C0+43} h22"/>',
]
write("home", "", "", "Emaki's window as it opens, drawn in lines: the sidebar with its projects and sessions, and in the main area the handscroll and the composer to start a session, over the folder and the agent it starts in.",
      None, home_chrome + home_side + home_main, path="_home.html", cls="sketch home-window", size=(HOME_W, HOME_H))

# ---- Projects: the sidebar ----
conv, snd = chat(MAIN_L, MAIN_R)
ctl, _ = controls()
body = chrome() + defs() + part("sidebar", True, sidebar(hits=True)) + part("chat", False, ['<g data-hide="new">'] + conv + ['</g>']) + part("controls", False, ctl) + part("new", True, [
  '<!-- New Session: the message box over the folder it starts in, in the chat\'s place. -->',
  '<g data-show="new">',
  '  <rect class="sk-edge" x="124" y="92" width="160" height="44" rx="7"/>',
  '  <path class="sk-ink" d="M132 100 v9"/><path class="sk-faint" d="M136 104.5 h40"/>',
  '  ' + plus(134, 126) + '<rect class="sk-edge" x="144" y="120" width="26" height="12" rx="6"/><circle class="sk-frame" cx="150" cy="126" r="1.25"/><path class="sk-frame" d="M154 126 h11"/>',
  '  ' + send(273, 126),
  '  <rect class="sk-plate" x="124" y="142" width="90" height="12" rx="6"/>' + folder(131, 145) + '<path class="sk-frame" d="M143 148 h40"/>' + chev(207, 148, "sk-frame"),
  '</g>']) + ['<g data-hide="new">' + snd + '</g>']
write("projects", "", "open",
      "Emaki's sidebar in color, the rest of the window gray: New Session, All Sessions and Agents, then the projects, the first open with its sessions under it. The folder folds them, a session lights, and New Session brings the message box over a folder.",
      "The folder, a session and New Session answer the pointer.", body)

# ---- Chats: the transcript and the composer ----
conv, snd = chat(MAIN_L, MAIN_R, hits=True, caret=True)
ctl, _ = controls()
body = chrome() + defs() + part("sidebar", False, sidebar()) + part("chat", True, conv) + part("controls", False, ctl) + [snd]
write("chats", "", "mode",
      "Emaki's chat in color, the sidebar gray: your prompt in a bubble at the right, the agent's name and reply at the left with a tool call on a card that opens, and the composer with its caret, the plus, the mode and effort pills opening their lists, the model, send, and the status row under it.",
      "The tool call, the plus, the mode and the effort answer the pointer.", body)

# ---- Files Panel ----
conv, snd = chat(LP + 64 + 4, MAIN_R, {"open": (PANE_ROOM, 0, 0), "away": (-LEFT_ROOM, 0, 0)})
ctl, own = controls("files")
body = chrome() + defs() + part("sidebar", False, sidebar()) + part("chat", False, conv) + part("controls", False, ctl) \
  + part("files", True, own + ['<g clip-path="url(#sk-main)">'] + wrap(files_panel(hits=True), "away", "-70 0") + ['</g>']) + [snd]
write("files", "", "open",
      "Emaki's files panel in color at the chat's left, the rest gray: the project's tree with git's marks, the branch and the Changes count at its head. A file row opens the file in a pane beside the tree, the branch drops the branches, the count opens the Changes sheet, and the files button puts the panel away.",
      "A file, the branch, the Changes count and the files button answer the pointer.", body)

# ---- Outline Panel ----
conv, snd = chat(LP + 64 + 4, MAIN_R, {"away": (-LEFT_ROOM, 0, 0), "e2": (0, 0, -24), "e3": (0, 0, -48), "e4": (0, 0, -72)}, rounds=2)
ctl, own = controls("outline")
body = chrome() + defs() + part("sidebar", False, sidebar()) + part("chat", False, conv) + part("controls", False, ctl) \
  + part("outline", True, own + ['<g clip-path="url(#sk-main)">'] + wrap(outline_panel(hits=True), "away", "-70 0") + ['</g>']) + [snd]
write("outline", "", "e3",
      "Emaki's outline panel in color at the chat's left, the rest gray: an entry a prompt under the day's heading, the one in view marked in the accent. An entry under the pointer brings the chat to its round, and the outline button puts the panel away.",
      "An entry and the outline button answer the pointer.", body)

# ---- Shell Terminal Panel ----
conv, snd = chat(MAIN_L, RP - 4, {"away": (0, RIGHT_ROOM, 0)})
ctl, own = controls("shell")
body = chrome() + defs() + part("sidebar", False, sidebar()) + part("chat", False, conv) + part("controls", False, ctl) \
  + part("shell", True, own + ['<g clip-path="url(#sk-main)">'] + wrap(shell_panel(hits=True), "away", "86 0") + ['</g>']) + [snd]
write("shell", "", "tab",
      "Emaki's shell terminal in color at the chat's right, the rest gray: a shell in the session's folder with its tab at the head, a prompt, what it printed and the cursor. The plus opens another tab, and the shell button puts the panel away.",
      "The plus and the shell button answer the pointer.", body)

# ---- Agent Terminal Panel ----
conv, snd = chat(MAIN_L, RP - 4, {"away": (0, RIGHT_ROOM, 0)})
ctl, own = controls("agent")
body = chrome() + defs() + part("sidebar", False, sidebar()) + part("chat", False, conv) + part("controls", False, ctl) \
  + part("agent", True, own + ['<g clip-path="url(#sk-main)">'] + wrap(agent_panel(hits=True), "away", "86 0") + ['</g>']) + [snd]
write("agent", "", "type",
      "Emaki's agent terminal in color at the chat's right, the rest gray, its border in Claude's color: the agent's own screen drawn whole, with its prompt at the foot. The prompt under the pointer takes typing, and the agent button puts the panel away.",
      "The prompt and the agent button answer the pointer.", body)

# ---- Settings ----
def rail(y, name, go=None):
    if go:
        return (f'<rect class="sk-wash" data-show="{go}" x="98" y="{y-7}" width="56" height="12" rx="3"/>'
                f'<text class="sk-small sk-lit" x="104" y="{y+0.5}">{name}</text>'
                f'<rect class="sk-row" data-go="{go}" x="98" y="{y-7}" width="56" height="12" rx="3"/>')
    return f'<text class="sk-small" x="104" y="{y+0.5}">{name}</text>'
def switch(x, y, on=True):
    if on:
        return f'<rect class="sk-accent-fill" x="{x}" y="{y}" width="14" height="8" rx="4"/><circle class="sk-page-fill" cx="{x+10}" cy="{y+4}" r="3"/>'
    return f'<rect class="sk-plate" x="{x}" y="{y}" width="14" height="8" rx="4"/><circle class="sk-page-fill" cx="{x+4}" cy="{y+4}" r="3"/>'
conv, snd = chat(MAIN_L, MAIN_R)
ctl, _ = controls()
body = chrome() + defs() + part("sidebar", False, sidebar()) + part("chat", False, conv) + part("controls", False, ctl) + [snd] + [
  '<rect class="sk-scrim" x="89" y="23" width="229" height="195"/>',
  '<!-- The settings sheet: a rail of sections at the left, the section\'s groups at the right under its name. -->',
  '<rect class="sk-pop" x="94" y="28" width="222" height="178" rx="5"/>',
  '<path class="sk-faint" d="M158 28 V206"/>',
  rail(40, "Appearance", "appearance"), rail(54, "Fonts", "fonts"), rail(68, "Composer"), rail(82, "New sessions", "new"),
  rail(96, "Terminal"), rail(110, "Files"), rail(124, "Updates", "updates"), rail(138, "About"),
  '<!-- Appearance: system, light or dark, and the accent, one of seven, the chosen one ringed. -->',
  '<g data-show="appearance"><text class="sk-lit" x="166" y="41">Appearance</text><path class="sk-faint" d="M158 48 H316"/>',
  '  <rect class="sk-edge" x="166" y="56" width="140" height="56" rx="4"/>',
  '  <text class="sk-small" x="172" y="68.5">Appearance</text><rect class="sk-edge" x="244" y="62" width="56" height="12" rx="3"/><rect class="sk-plate" x="245" y="63" width="18" height="10" rx="2"/><text class="sk-small sk-lit" x="247" y="68.5">Auto</text><path class="sk-faint" d="M270 68 h8 M286 68 h10"/>',
  '  <path class="sk-faint" d="M166 78 H306"/>',
  '  <text class="sk-small" x="172" y="92.5">Accent</text><text class="sk-small" x="172" y="102">Periwinkle</text>',
  '  <circle class="sk-accent-fill" cx="236" cy="95" r="4"/><circle class="sk-page" cx="236" cy="95" r="2"/><circle class="sk-mauve" cx="248" cy="95" r="4"/><circle class="sk-rose" cx="260" cy="95" r="4"/><circle class="sk-ochre" cx="272" cy="95" r="4"/><circle class="sk-sage" cx="284" cy="95" r="4"/><circle class="sk-slate" cx="296" cy="95" r="4"/>',
  '</g>',
  '<!-- Fonts: the chat face, the code face, and one text size for all three. -->',
  '<g data-show="fonts"><text class="sk-lit" x="166" y="41">Fonts</text><path class="sk-faint" d="M158 48 H316"/>',
  '  <rect class="sk-edge" x="166" y="56" width="140" height="70" rx="4"/>',
  '  <text class="sk-small" x="172" y="68.5">Chat</text><text class="sk-aa" x="252" y="70">Aa</text><rect class="sk-edge" x="270" y="62" width="30" height="12" rx="3"/><path class="sk-frame" d="M275 68 h14"/>' + chev(294, 68),
  '  <path class="sk-faint" d="M166 78 H306"/>',
  '  <text class="sk-small" x="172" y="90.5">Code</text><text class="sk-aa-mono" x="252" y="92">Aa</text><rect class="sk-edge" x="270" y="84" width="30" height="12" rx="3"/><path class="sk-frame" d="M275 90 h12"/>' + chev(294, 90),
  '  <path class="sk-faint" d="M166 100 H306"/>',
  '  <text class="sk-small" x="172" y="112.5">Text size</text><path class="sk-plate-line" d="M244 112 h56"/><path class="sk-accent" d="M244 112 h24"/><circle class="sk-page-fill" cx="268" cy="112" r="3.5"/><circle class="sk-accent" cx="268" cy="112" r="3.5"/>',
  '</g>',
  '<!-- New sessions: one agent\'s three at a time, the agents a small control at the head. -->',
  '<g data-show="new"><text class="sk-lit" x="166" y="41">New sessions</text><path class="sk-faint" d="M158 48 H316"/>',
  '  <rect class="sk-edge" x="166" y="56" width="140" height="78" rx="4"/>',
  '  ' + spark(174, 64, 3) + '<text class="sk-small sk-lit" x="180" y="64.5">Claude Code</text><rect class="sk-edge" x="276" y="58" width="24" height="12" rx="3"/><rect class="sk-plate" x="277" y="59" width="11" height="10" rx="2"/>' + spark(282.5, 64, 2.5) + '<circle class="sk-codex" cx="294" cy="64" r="2.5"/>',
  '  <path class="sk-faint" d="M166 72 H306"/>',
  '  <text class="sk-small" x="172" y="84.5">Mode</text><rect class="sk-edge" x="244" y="78" width="56" height="12" rx="6"/><path class="sk-frame" d="M250 84 h30"/>' + chev(294, 84),
  '  <text class="sk-small" x="172" y="104.5">Model</text><rect class="sk-edge" x="244" y="98" width="56" height="12" rx="6"/><path class="sk-frame" d="M250 104 h24"/>' + chev(294, 104),
  '  <text class="sk-small" x="172" y="124.5">Effort</text><rect class="sk-edge" x="244" y="118" width="56" height="12" rx="6"/><path class="sk-frame" d="M250 124 h20"/>' + chev(294, 124),
  '</g>',
  '<!-- Updates: by itself, on a daily check, and a button to check now. -->',
  '<g data-show="updates"><text class="sk-lit" x="166" y="41">Updates</text><path class="sk-faint" d="M158 48 H316"/>',
  '  <rect class="sk-edge" x="166" y="56" width="140" height="56" rx="4"/>',
  '  <text class="sk-small" x="172" y="68.5">Check daily</text>' + switch(286, 64),
  '  <path class="sk-faint" d="M166 78 H306"/>',
  '  <text class="sk-small" x="172" y="92.5">Up to date</text><text class="sk-small" x="172" y="102">v0.2.8</text><rect class="sk-edge" x="256" y="89" width="44" height="12" rx="6"/><text class="sk-small sk-lit" x="262" y="95.5">Check now</text>',
  '</g>',
]
write("settings", "appearance", "appearance",
      "Emaki's settings sheet over the window, which is gray under it: a rail of its eight sections at the left, and the section's groups at the right: Appearance with the accent's seven discs, Fonts with the two faces and one text size, New sessions with each agent's mode, model and effort, and Updates.",
      "Appearance, Fonts, New sessions and Updates answer the pointer.", body)
print("wrote", sorted(os.listdir(OUT)))
