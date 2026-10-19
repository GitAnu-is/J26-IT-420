export const manifest = {
  screens: {
    scr_h6gskz: { name: "Splash", route: "/welcome", position: { "x": 160, "y": 220 } },
    scr_pqchs3: { name: "Choose language", route: "/language", position: { "x": 1560, "y": 220 } },
    scr_beg5ea: { name: "Onboarding", route: "/onboarding", position: { "x": 160, "y": 2200 } },
    scr_7s4nn6: { name: "Log in", route: "/login", position: { "x": 1560, "y": 2200 } },
    scr_lzsybj: { name: "Create account", route: "/register", position: { "x": 2960, "y": 2200 } },
    scr_xcix2f: { name: "Home", route: "/home", state: { "signedIn": true }, position: { "x": 160, "y": 4180 } },
    scr_4zcbhf: { name: "Crop advice – Input", route: "/crop", state: { "signedIn": true }, position: { "x": 160, "y": 6160 } },
    scr_qcsx0p: { name: "Crop advice – Results", route: "/crop/results", state: { "signedIn": true }, position: { "x": 1560, "y": 6160 } },
    scr_lchc6z: { name: "Plant health – Photo", route: "/disease", state: { "signedIn": true }, position: { "x": 160, "y": 8140 } },
    scr_ha7v92: { name: "Plant health – Diagnosis", route: "/disease/results", state: { "signedIn": true }, position: { "x": 1560, "y": 8140 } },
    scr_9yogye: { name: "Harvest – Input", route: "/harvest", state: { "signedIn": true }, position: { "x": 160, "y": 10120 } },
    scr_dpurtk: { name: "Harvest – Results", route: "/harvest/results", state: { "signedIn": true }, position: { "x": 1560, "y": 10120 } },
    scr_9iel7t: { name: "Transport risk – Input", route: "/transport", state: { "signedIn": true }, position: { "x": 160, "y": 12100 } },
    scr_5kgaxa: { name: "Transport risk – Results", route: "/transport/results", state: { "signedIn": true }, position: { "x": 1560, "y": 12100 } },
    scr_2ymg11: { name: "My checks", route: "/history", state: { "signedIn": true }, position: { "x": 160, "y": 14080 } },
    scr_whc6o0: { name: "Alerts", route: "/notifications", state: { "signedIn": true }, position: { "x": 1560, "y": 14080 } },
    scr_u6xcq3: { name: "More", route: "/more", state: { "signedIn": true }, position: { "x": 2960, "y": 14080 } },
    scr_8132xx: { name: "Settings", route: "/settings", state: { "signedIn": true }, position: { "x": 160, "y": 16060 } },
    scr_lszroy: { name: "Developer notes", route: "/developer", state: { "signedIn": true }, position: { "x": 1560, "y": 16060 } }
  },
  sections: {
    sec_j7v4vx: { name: "Splash & Entry", x: 0, y: 0, width: 2920, height: 1180 },
    sec_s4qw56: { name: "Authentication & Onboarding", x: 0, y: 1980, width: 4320, height: 1180 },
    sec_yf87rd: { name: "Home Hub", x: 0, y: 3960, width: 1520, height: 1180 },
    sec_8j9q02: { name: "Crop Advice", x: 0, y: 5940, width: 2920, height: 1180 },
    sec_zatdom: { name: "Plant Health", x: 0, y: 7920, width: 2920, height: 1180 },
    sec_jvz4ok: { name: "Harvest Analysis", x: 0, y: 9900, width: 2920, height: 1180 },
    sec_u3bf1h: { name: "Transport Risk", x: 0, y: 11880, width: 2920, height: 1180 },
    sec_67xc04: { name: "Secondary Navigation", x: 0, y: 13860, width: 4320, height: 1180 },
    sec_yab1iv: { name: "Settings & Meta", x: 0, y: 15840, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_j7v4vx", children: [
    { kind: "screen", id: "scr_h6gskz" },
    { kind: "screen", id: "scr_pqchs3" }]
  },
  { kind: "section", id: "sec_s4qw56", children: [
    { kind: "screen", id: "scr_beg5ea" },
    { kind: "screen", id: "scr_7s4nn6" },
    { kind: "screen", id: "scr_lzsybj" }]
  },
  { kind: "section", id: "sec_yf87rd", children: [
    { kind: "screen", id: "scr_xcix2f" }]
  },
  { kind: "section", id: "sec_8j9q02", children: [
    { kind: "screen", id: "scr_4zcbhf" },
    { kind: "screen", id: "scr_qcsx0p" }]
  },
  { kind: "section", id: "sec_zatdom", children: [
    { kind: "screen", id: "scr_lchc6z" },
    { kind: "screen", id: "scr_ha7v92" }]
  },
  { kind: "section", id: "sec_jvz4ok", children: [
    { kind: "screen", id: "scr_9yogye" },
    { kind: "screen", id: "scr_dpurtk" }]
  },
  { kind: "section", id: "sec_u3bf1h", children: [
    { kind: "screen", id: "scr_9iel7t" },
    { kind: "screen", id: "scr_5kgaxa" }]
  },
  { kind: "section", id: "sec_67xc04", children: [
    { kind: "screen", id: "scr_2ymg11" },
    { kind: "screen", id: "scr_whc6o0" },
    { kind: "screen", id: "scr_u6xcq3" }]
  },
  { kind: "section", id: "sec_yab1iv", children: [
    { kind: "screen", id: "scr_8132xx" },
    { kind: "screen", id: "scr_lszroy" }]
  }]

};