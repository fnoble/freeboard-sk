
import { colors } from './colorscheme';
import * as s52proc from './s52procedure';
import cs from './chartsymbols.json';

import { Style, Stroke, Fill, Icon, Circle, Text } from 'ol/style';

type DashCode = "SOLD" | "DASH" | "DOTT"
type DashStyle = Record<DashCode, any>
// S-52 specifies in mm, converted to px assuming 0.35 px (72dpi)
// then hand adjusted as OpenLayers seems to render dashes longer than gaps
const dashStyles: DashStyle = {
    SOLD: null,
    DASH: [7, 7],  // Tweaked visually, SHOULD BE: dash: 3.6 mm; space: 1.8 mm
    DOTT: [2, 3]   // dot: 0.6 mm; space: 1.2 mm
}

function s52FontStyle(chars: string): [string, number] {
    let a = parseInt(chars[1]);
    let b = parseInt(chars[2]);
    let c = parseInt(chars[3]);
    let d = parseInt(chars.slice(4, 6));

    let cssFontString = d + "px sans-serif";
    if (b == 6) {
        cssFontString = "bold " + cssFontString;
    }
    return [cssFontString, d];
}

function s52TextStyle(string, hjust, vjust, space, chars, xoffs, yoffs, colour, display) {
    const hjustLookup = ['center', 'right', 'left'];
    const vjustLookup = ['bottom', 'middle', 'top']
    let [fontString, fontPt] = s52FontStyle(chars);
    return new Text({
        text: string,
        font: fontString,
        overflow: true,
        textAlign: hjustLookup[hjust + 1],
        textBaseline: vjustLookup[vjust + 1],
        offsetX: xoffs * fontPt * 1.33, // 1.33 px per pt @ 72 dpi
        offsetY: yoffs * fontPt * 1.33, // 1.33 px per pt @ 72 dpi
        fill: new Fill({
            color: colors[colour]
        }),
        stroke: new Stroke({
            color: 'white',
            width: 2
        }),
    });
}

function s52ApplyInstructionsToStyle(s, instr: string[], feature) {
    for (const ins of instr) {
        let tok = ins.match(/(.+)\((.+)\)/)
        if (!tok) {
            console.error('S52 Command Not Matched: ', ins);
            continue;
        }
        let cmd = tok[1];
        let args = tok[2].split(',');
        switch (cmd) {
            case 'SY': // SHOWPOINT
                // Get symbol metadata
                let symName = args[0];
                let syms = cs.symbols.symbol.filter(s => s.name == symName);
                let sym = {
                  pivot: {
                    _x: "0",
                    _y: "0"
                  }
                };
                if (syms.length < 1) {
                  console.error("Error looking up symbol metadata:, ", symName);
                } else {
                  sym = syms[0].bitmap;
                }
                s.setImage(new Icon({
                    anchorXUnits: 'pixels',
                    anchorYUnits: 'pixels',
                    anchor: [parseInt(sym.pivot._x), parseInt(sym.pivot._y)], // TODO: Anchor and align image properly to pivot point
                    opacity: 1,
                    src: '../assets/img/enc/day/' + symName + '.png'
                }));
                break;
            case 'TX': // SHOWTEXT (Textual Label)
                break;
                let [string, hjust, vjust, space, chars, xoffs, yoffs, colour, display] = args;
                if (string == 'OBJNAM') {
                    string = feature.get('OBJNAM');
                }
                console.log('Text: ', string, hjust, vjust, space, chars, xoffs, yoffs, colour, display);
                s.setText(s52TextStyle(string, hjust, vjust, space, chars, xoffs, yoffs, colour, display));
                break;
            case 'TE': // SHOWTEXT (Numeric / Formatted)
                break;
            case 'AC': // SHOWAREA (Area Fill)
                // TODO: Transparency
                s.setFill(new Fill({
                    color: colors[args[0]],
                }));
                break;
            case 'AP': // SHOWAREA (Pattern Fill)
                break;
            case 'LS': // SHOWLINE (Simple)
                s.setStroke(new Stroke({
                    color: colors[args[2]],
                    width: parseInt(args[1]),
                    lineDash: dashStyles[args[0]]
                }));
                break;
            case 'LC': // SHOWLINE (Complex)
                break;
            case 'CS': // CALLSYMPROC
                s52SymbologyProcedure(s, args[0], feature);
                break;
            default:
                console.log('S52 Unknown Command: ', cmd, args);
                break;
        }
    }

    return;
}

function s57LtoArray(l?: string): number[] {
  if (l === undefined) {
    return [];
  }
  let l_ = l.slice(1, -1);
  let list = l_.split(':')[1];
  return list.split(',').map(parseInt);
}

function s52SymbologyProcedure(style, proc, feature) {
    var instr;
    switch (proc) {
        case 'DEPARE01':
        case 'DEPARE02':
        case 'DEPARE03':
            instr = s52proc.DEPARE03(
                feature.get('layer') == "DRGARE",
                feature.get('DRVAL1'),
                feature.get('DRVAL2'),
                feature.get('RESTRN')
            );
            s52ApplyInstructionsToStyle(style, instr, feature);
            break;
        case 'LIGHTS05':
        case 'LIGHTS06':
            instr = s52proc.LIGHTS06(
                s57LtoArray(feature.get('COLOUR')),
                s57LtoArray(feature.get('CATLIT')),
                feature.get('SECTR1'),
                feature.get('SECTR2'),
                feature.get('ORIENT'),
                feature.get('LITVIS'),
                feature.get('LITCHR'),
                feature.get('VALNMR'),
            );
            s52ApplyInstructionsToStyle(style, instr, feature);
            break;
        default:
            console.log('S52 Procedure: ', proc);
    }
}

function s52LookupTable(feature) {
    const typeMap = {
      "Point": "Point",
      "MultiPoint": "Point",
      "Polygon": "Area",
      "LineString": "Line",
      "MultiLineString": "Line"
    };
    let objType = typeMap[feature.type_];
    if (objType === undefined) {
      console.error("Unknown object type: ", feature.type_);
    }
    let typeMatches = cs.lookups.lookup.filter(item => item.type == objType);
    const styleMap = {
      "Point": "Paper",
      "Area": "Plain",
      "Line": "Simplified",
    };
    let styleMatches = typeMatches.filter(item => item['table-name'] == styleMap[objType]);
    
    let classMatches = styleMatches.filter(item => item._name == feature.get('layer'));
    if (classMatches.length == 0) {
        // Failsafe presentation for unknown object class
        return cs.lookups.lookup.filter(item => item._name == "######")[0];
    } else if (classMatches.length == 1) {
        return classMatches[0];
    } else {
        for (const m of classMatches) {
            let match = true;
            let attrs = m["attrib-code"];
            if (attrs === undefined) {
                attrs = [];
            }
            for (var attrVal of attrs) {
                let attr = attrVal.__text.slice(0, 6);
                let val = attrVal.__text.slice(6);
                let fAttr_s = feature.get(attr)
                if (fAttr_s == undefined) {
                  match = false;
                  continue;
                }
                let fAttr = fAttr_s.toString();
                if (fAttr[0] == '(') {
                    fAttr = fAttr.slice(1, -1).split(':')[1];
                }
                if (fAttr != val) {
                    match = false;
                }
            }
            if (match == true) {
                return m;
            }
        }
    }
    return classMatches[0];
}

const displayPrioLookup = {
    "Group 1": 1,
    "Area 1": 2,
    "Area 2": 3,
    "Point Symbol": 4,
    "Line Symbol": 5,
    "Area Symbol": 6,
    "Routing": 7,
    "Hazards": 8,
    "Mariners": 9
}

export function s52LookupStyle(feature) {
    let params = s52LookupTable(feature);
    let s = new Style();
    if (true) { // (id != "LNDARE" && id != "BUAARE") {
      s52ApplyInstructionsToStyle(s, params.instruction.split(';'), feature);
    }
    s.setZIndex(displayPrioLookup[params['disp-prio']] + 1000);
    return s;
}
