
export function SEABED01(drval1: number, drval2: number, shallow_contour = 2,
    safety_contour = 3, deep_contour = 6, two_shades = true,
    shallow_pattern = false): string[] {

    let colour = 'DEPIT';
    let shallow = true;
    let instr = [];

    if (drval1 >= 0 && drval2 > 0) {
        colour = 'DEPVS';
    }
    if (two_shades) {
        if (drval1 >= safety_contour && drval2 > safety_contour) {
            colour = 'DEPDW';
            shallow = false;
        }
    } else {
        if (drval1 >= shallow_contour && drval2 > shallow_contour) {
            colour = 'DEPMS';
        }
        if (drval1 >= safety_contour && drval2 > safety_contour) {
            colour = 'DEPMD';
            shallow = false;
        }
        if (drval1 >= deep_contour && drval2 > deep_contour) {
            colour = 'DEPDW';
            shallow = false;
        }
    }

    instr.push('AC(' + colour + ')');
    if (shallow_pattern && shallow) {
        instr.push('AP(DIAMOND1)');
    }

    return instr;
}

export function DEPARE03(drgare: boolean, drval1?: number, drval2?: number, restrn?: number): string[] {
    if (drval1 === undefined) {
        drval1 = -1;
    }

    if (drval2 === undefined) {
        drval2 = drval1 + 0.01;
    }

    let instr = SEABED01(drval1, drval2);

    if (drgare) {
        instr.push('AP(DRGARE01)');
        instr.push('LS(DASH,1,CHGRF)');
        if (!(restrn === undefined)) {
            // TODO: Run RESCSP02
        }
    }

    // TODO run edge loop

    return instr;
}

function NOSECTOR(sectr1?: number, sectr2?: number): boolean {
    if (sectr1 === undefined) {
        return true;
    }
    if (sectr2 === undefined) {
        return true;
    }
    if (sectr2 == sectr1) {
        return true;
    }
    if (Math.abs(sectr2 - sectr1) == 360) {
        return true;
    }
    return false;
}

export function LIGHTS06(colour: number[], catlit: number[], sectr1?: number,
    sectr2?: number, orient?: number, litvis?: number, litchr?: number,
    valnmr?: number): string[] {

    if (valnmr === undefined) {
        valnmr = 9;
    }

    let instr = [];

    if (catlit.includes(11) || catlit.includes(8)) {
        // Floodlight or spotlight
        instr.push('SY(LIGHTS82)');
        return instr;
    }
    if (catlit.includes(9)) {
        // Strip light
        instr.push('SY(LIGHTS81)');
        return instr;
    }
    if (catlit.includes(1) || catlit.includes(16)) {
        // Directional or Moire effect
        if (!(orient === undefined)) {
            //instr.push('LS(DASH,1,CHBLK)');
            // TODO: Draw line (see proc doc)
        }
    }


    if (colour.length == 0) {
        colour = [12];
    }
    if (!NOSECTOR(sectr1, sectr2)) {
        // Sector light with line legs and arcs
        // TODO: LIGHTS06 Continuation
        return instr;
    }
    if (valnmr >= 10 && !(catlit.includes(5) || catlit.includes(6)) && litchr != 12) {
        // Major light
        // TODO: Draw 360 deg arc
    }
    let flare_at_45_deg = false;
    if (false) {
        // NO SECTOR Lights plus
        // (co-located with sector light)
        // TODO
    }

    let select = 'LITDEF11';
    if (colour.includes(3)) {
        select = 'LIGHTS11';
    } else if (colour.includes(4)) {
        select = 'LIGHTS12';
    } else if (colour.some(c => [1,11,6].includes(c))) {
        select = 'LIGHTS13';
    }

    if (catlit.includes(1) || catlit.includes(16)) {
        // Directional or Moire effect
        if (!(orient === undefined)) {
            let orient180 = Math.round(orient + 180) % 360;
            instr.push('SY(' + select + ',' + orient180.toFixed() + ')');
            instr.push("TE(‘%03.0lf deg’,’ORIENT’, 3,3,3, '15110', 3,1, CHELK, 23)");
        } else {
            instr.push('SY(QUESTMRK1)');
        }
    } else {
        if (flare_at_45_deg) {
            instr.push('SY(' + select + ',45)');
        } else {
            instr.push('SY(' + select + ',135)');
        }
    }

    // TODO: Light description

    return instr;
}
