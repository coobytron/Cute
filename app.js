const NS = "http://www.w3.org/2000/svg";

const palettes = {
  tangerine: { label: "Tangerine", head: "#F6A65E", secondary: "#E77B4C", muzzle: "#FFF1DB", blush: "#FF786B", stage: "#FFE9BD" },
  lavender: { label: "Lavender", head: "#D9C8F4", secondary: "#B99BEA", muzzle: "#F8F1FF", blush: "#FF93A5", stage: "#EDE3FA" },
  mint: { label: "Mint", head: "#BFE2CF", secondary: "#7FC5A2", muzzle: "#F2FFF8", blush: "#FF8F91", stage: "#DCEFE4" },
  butter: { label: "Butter", head: "#F4C84D", secondary: "#D8A63B", muzzle: "#FFF4D3", blush: "#FF806F", stage: "#FFF0BA" },
  sky: { label: "Sky", head: "#BFDDED", secondary: "#7FB5D2", muzzle: "#F4FBFF", blush: "#FF8E88", stage: "#DDEEF7" }
};

const heads = {
  cat: {
    id: "base-cat-round",
    name: "Round cat",
    clip: "M250 370 L315 150 L430 278 Q500 250 570 278 L685 150 L750 370 C835 438 846 618 772 747 C704 865 606 910 500 912 C394 910 296 865 228 747 C154 618 165 438 250 370Z",
    markup: (c) => `<path d="M250 370 L315 150 L430 278 Q500 250 570 278 L685 150 L750 370 C835 438 846 618 772 747 C704 865 606 910 500 912 C394 910 296 865 228 747 C154 618 165 438 250 370Z" fill="${c.head}" class="face-ink"/>`
  },
  bunny: {
    id: "base-bunny-soft",
    name: "Soft bunny",
    clip: "M283 386 C250 284 302 218 392 250 Q500 208 608 250 C698 218 750 284 717 386 C804 449 829 603 769 729 C712 850 612 906 500 910 C388 906 288 850 231 729 C171 603 196 449 283 386Z",
    markup: (c) => `<path d="M283 386 C250 284 302 218 392 250 Q500 208 608 250 C698 218 750 284 717 386 C804 449 829 603 769 729 C712 850 612 906 500 910 C388 906 288 850 231 729 C171 603 196 449 283 386Z" fill="${c.head}" class="face-ink"/>`
  },
  bear: {
    id: "base-bear-puff",
    name: "Puff bear",
    clip: "M255 386 C198 308 256 220 352 251 Q500 201 648 251 C744 220 802 308 745 386 C828 455 841 617 775 742 C710 864 609 913 500 914 C391 913 290 864 225 742 C159 617 172 455 255 386Z",
    markup: (c) => `<path d="M255 386 C198 308 256 220 352 251 Q500 201 648 251 C744 220 802 308 745 386 C828 455 841 617 775 742 C710 864 609 913 500 914 C391 913 290 864 225 742 C159 617 172 455 255 386Z" fill="${c.head}" class="face-ink"/>`
  },
  puppy: {
    id: "base-puppy-drop",
    name: "Drop puppy",
    clip: "M254 382 C240 267 348 222 440 263 Q500 241 560 263 C652 222 760 267 746 382 C823 452 837 617 772 744 C709 865 610 913 500 914 C390 913 291 865 228 744 C163 617 177 452 254 382Z",
    markup: (c) => `<path d="M254 382 C240 267 348 222 440 263 Q500 241 560 263 C652 222 760 267 746 382 C823 452 837 617 772 744 C709 865 610 913 500 914 C390 913 291 865 228 744 C163 617 177 452 254 382Z" fill="${c.head}" class="face-ink"/>`
  },
  fox: {
    id: "base-fox-point",
    name: "Point fox",
    clip: "M248 371 L324 148 L430 272 Q500 244 570 272 L676 148 L752 371 C833 446 842 616 770 746 C700 871 603 920 500 921 C397 920 300 871 230 746 C158 616 167 446 248 371Z",
    markup: (c) => `<path d="M248 371 L324 148 L430 272 Q500 244 570 272 L676 148 L752 371 C833 446 842 616 770 746 C700 871 603 920 500 921 C397 920 300 871 230 746 C158 616 167 446 248 371Z" fill="${c.head}" class="face-ink"/>`
  }
};

const ears = {
  catRound: {
    id: "ears-cat-round",
    name: "Cat peaks",
    markup: (c) => `<g class="face-ink"><path d="M281 338 L318 155 L430 284Z" fill="${c.head}"/><path d="M719 338 L682 155 L570 284Z" fill="${c.head}"/></g><g class="detail-ink"><path d="M315 267 L331 205 L386 275Z" fill="${c.blush}"/><path d="M685 267 L669 205 L614 275Z" fill="${c.blush}"/></g>`
  },
  bunnyLong: {
    id: "ears-bunny-long",
    name: "Long bunny",
    markup: (c) => `<g class="face-ink"><ellipse cx="370" cy="200" rx="67" ry="185" transform="rotate(-10 370 200)" fill="${c.head}"/><ellipse cx="630" cy="200" rx="67" ry="185" transform="rotate(10 630 200)" fill="${c.head}"/></g><g class="detail-ink"><ellipse cx="374" cy="202" rx="25" ry="127" transform="rotate(-10 374 202)" fill="${c.blush}"/><ellipse cx="626" cy="202" rx="25" ry="127" transform="rotate(10 626 202)" fill="${c.blush}"/></g>`
  },
  bearRound: {
    id: "ears-bear-round",
    name: "Bear rounds",
    markup: (c) => `<g class="face-ink"><circle cx="302" cy="310" r="110" fill="${c.head}"/><circle cx="698" cy="310" r="110" fill="${c.head}"/></g><g class="detail-ink"><circle cx="302" cy="310" r="52" fill="${c.secondary}"/><circle cx="698" cy="310" r="52" fill="${c.secondary}"/></g>`
  },
  puppyFlop: {
    id: "ears-puppy-flop",
    name: "Floppy puppy",
    markup: (c) => `<g class="face-ink"><path d="M287 326 C156 252 105 389 168 509 C205 579 295 551 333 462 L361 366Z" fill="${c.secondary}"/><path d="M713 326 C844 252 895 389 832 509 C795 579 705 551 667 462 L639 366Z" fill="${c.secondary}"/></g><path d="M213 376 Q252 421 277 493 M787 376 Q748 421 723 493" fill="none" class="detail-line" opacity=".24"/>`
  },
  foxPoint: {
    id: "ears-fox-point",
    name: "Fox points",
    markup: (c) => `<g class="face-ink"><path d="M275 345 L326 135 L445 292Z" fill="${c.head}"/><path d="M725 345 L674 135 L555 292Z" fill="${c.head}"/></g><g class="detail-ink"><path d="M319 278 L337 196 L399 281Z" fill="${c.blush}"/><path d="M681 278 L663 196 L601 281Z" fill="${c.blush}"/></g>`
  },
  tinyRound: {
    id: "ears-tiny-round",
    name: "Tiny rounds",
    markup: (c) => `<g class="face-ink"><circle cx="340" cy="300" r="75" fill="${c.head}"/><circle cx="660" cy="300" r="75" fill="${c.head}"/></g><g class="detail-ink"><circle cx="340" cy="300" r="31" fill="${c.blush}"/><circle cx="660" cy="300" r="31" fill="${c.blush}"/></g>`
  }
};

const eyes = {
  sparkle: {
    id: "eyes-sparkle",
    name: "Sparkle eyes",
    markup: () => `<g><path d="M345 473 C345 405 430 405 430 472 C430 537 388 566 388 566 C388 566 345 537 345 473Z" fill="#2d2723"/><path d="M570 473 C570 405 655 405 655 472 C655 537 612 566 612 566 C612 566 570 537 570 473Z" fill="#2d2723"/><circle cx="374" cy="446" r="15" fill="#fff"/><circle cx="599" cy="446" r="15" fill="#fff"/><circle cx="401" cy="487" r="8" fill="#fff"/><circle cx="626" cy="487" r="8" fill="#fff"/></g>`
  },
  sleepy: {
    id: "eyes-sleepy",
    name: "Sleepy eyes",
    markup: () => `<g fill="none" class="detail-line"><path d="M330 488 Q390 542 450 488"/><path d="M550 488 Q610 542 670 488"/></g>`
  },
  dot: {
    id: "eyes-dot",
    name: "Dot eyes",
    markup: () => `<g><ellipse cx="390" cy="486" rx="28" ry="38" fill="#2d2723"/><ellipse cx="610" cy="486" rx="28" ry="38" fill="#2d2723"/><circle cx="401" cy="473" r="9" fill="#fff"/><circle cx="621" cy="473" r="9" fill="#fff"/></g>`
  },
  wink: {
    id: "eyes-wink",
    name: "Wink",
    markup: () => `<g><ellipse cx="390" cy="486" rx="28" ry="38" fill="#2d2723"/><circle cx="401" cy="473" r="9" fill="#fff"/><path d="M552 493 Q611 544 672 493" fill="none" class="detail-line"/></g>`
  },
  tiny: {
    id: "eyes-tiny",
    name: "Tiny eyes",
    markup: () => `<g><circle cx="398" cy="488" r="19" fill="#2d2723"/><circle cx="602" cy="488" r="19" fill="#2d2723"/><circle cx="404" cy="481" r="6" fill="#fff"/><circle cx="608" cy="481" r="6" fill="#fff"/></g>`
  },
  star: {
    id: "eyes-star",
    name: "Star eyes",
    markup: () => `<g fill="#2d2723"><path d="M390 426 L407 466 L450 470 L417 498 L427 540 L390 518 L353 540 L363 498 L330 470 L373 466Z"/><path d="M610 426 L627 466 L670 470 L637 498 L647 540 L610 518 L573 540 L583 498 L550 470 L593 466Z"/></g>`
  }
};

const snouts = {
  cat: {
    id: "snout-cat",
    name: "Cat muzzle",
    markup: (c) => `<g><ellipse cx="452" cy="642" rx="96" ry="70" fill="${c.muzzle}"/><ellipse cx="548" cy="642" rx="96" ry="70" fill="${c.muzzle}"/><path d="M500 591 C463 591 455 628 500 646 C545 628 537 591 500 591Z" fill="#2d2723"/><path d="M500 646 Q500 697 452 704 M500 646 Q500 697 548 704" fill="none" class="detail-line"/></g>`
  },
  bunny: {
    id: "snout-bunny",
    name: "Bunny mouth",
    markup: (c) => `<g><path d="M500 598 C467 580 430 605 446 645 C461 683 487 685 500 665 C513 685 539 683 554 645 C570 605 533 580 500 598Z" fill="${c.blush}" class="detail-ink"/><path d="M500 665 Q500 709 462 717 M500 665 Q500 709 538 717" fill="none" class="detail-line"/></g>`
  },
  bear: {
    id: "snout-bear",
    name: "Bear muzzle",
    markup: (c) => `<g><ellipse cx="500" cy="650" rx="142" ry="103" fill="${c.muzzle}" class="detail-ink"/><ellipse cx="500" cy="610" rx="44" ry="32" fill="#2d2723"/><path d="M500 642 Q500 691 452 698 M500 642 Q500 691 548 698" fill="none" class="detail-line"/></g>`
  },
  puppy: {
    id: "snout-puppy",
    name: "Puppy muzzle",
    markup: (c) => `<g><ellipse cx="500" cy="650" rx="150" ry="100" fill="${c.muzzle}" class="detail-ink"/><path d="M500 588 C457 588 447 635 500 654 C553 635 543 588 500 588Z" fill="#2d2723"/><path d="M500 654 Q500 697 456 706 M500 654 Q500 697 544 706" fill="none" class="detail-line"/><path d="M485 706 Q500 745 515 706" fill="${c.blush}" class="detail-ink"/></g>`
  },
  fox: {
    id: "snout-fox",
    name: "Fox muzzle",
    markup: (c) => `<g><path d="M324 620 Q410 556 500 630 Q590 556 676 620 Q642 770 500 802 Q358 770 324 620Z" fill="${c.muzzle}"/><path d="M500 596 C463 596 455 631 500 648 C545 631 537 596 500 596Z" fill="#2d2723"/><path d="M500 648 Q500 697 456 704 M500 648 Q500 697 544 704" fill="none" class="detail-line"/></g>`
  },
  smile: {
    id: "snout-smile",
    name: "Simple smile",
    markup: (c) => `<g><ellipse cx="500" cy="640" rx="112" ry="76" fill="${c.muzzle}"/><path d="M500 594 C472 594 466 620 500 634 C534 620 528 594 500 594Z" fill="#2d2723"/><path d="M445 663 Q500 724 555 663" fill="none" class="detail-line"/></g>`
  }
};

const cheeks = {
  peach: { id: "cheeks-peach", name: "Peach cheeks", markup: (c) => `<g opacity=".82"><ellipse cx="315" cy="628" rx="67" ry="35" fill="${c.blush}"/><ellipse cx="685" cy="628" rx="67" ry="35" fill="${c.blush}"/></g>` },
  hatch: { id: "cheeks-hatch", name: "Hatched cheeks", markup: (c) => `<g opacity=".78"><ellipse cx="315" cy="628" rx="67" ry="35" fill="${c.blush}"/><ellipse cx="685" cy="628" rx="67" ry="35" fill="${c.blush}"/><path d="M275 637 l25 -18 M311 642 l25 -18 M649 642 l25 -18 M685 637 l25 -18" class="tiny-line" fill="none"/></g>` },
  tiny: { id: "cheeks-tiny", name: "Tiny cheeks", markup: (c) => `<g opacity=".85"><circle cx="326" cy="630" r="31" fill="${c.blush}"/><circle cx="674" cy="630" r="31" fill="${c.blush}"/></g>` },
  none: { id: "cheeks-none", name: "No cheeks", markup: () => "" }
};

const markings = {
  freckles: { id: "mark-freckles", name: "Freckles", markup: () => `<g fill="#2d2723" opacity=".28"><circle cx="397" cy="578" r="7"/><circle cx="427" cy="565" r="5"/><circle cx="455" cy="575" r="6"/><circle cx="603" cy="578" r="7"/><circle cx="573" cy="565" r="5"/><circle cx="545" cy="575" r="6"/></g>` },
  forehead: { id: "mark-forehead", name: "Forehead tuft", markup: (c) => `<path d="M410 316 Q468 366 500 302 Q532 366 590 316 Q548 405 500 374 Q452 405 410 316Z" fill="${c.secondary}" opacity=".9"/>` },
  patch: { id: "mark-patch", name: "Face patch", markup: (c) => `<path d="M326 380 Q436 331 493 392 Q432 457 350 472 Q307 444 326 380Z" fill="${c.secondary}" opacity=".82"/>` },
  foxMask: { id: "mark-fox-mask", name: "Fox mask", markup: (c) => `<path d="M254 520 Q370 398 500 492 Q630 398 746 520 Q667 590 585 568 Q500 550 415 568 Q333 590 254 520Z" fill="${c.secondary}" opacity=".34"/>` },
  none: { id: "mark-none", name: "No marking", markup: () => "" }
};

const accessories = {
  flower: { id: "extra-flower", name: "Tiny flower", markup: (c) => `<g transform="translate(725 350) rotate(12)" filter="url(#stickerShadow)"><g class="detail-ink" fill="${c.blush}"><circle cx="0" cy="-35" r="31"/><circle cx="34" cy="-5" r="31"/><circle cx="21" cy="36" r="31"/><circle cx="-21" cy="36" r="31"/><circle cx="-34" cy="-5" r="31"/></g><circle r="23" fill="#F4C84D" class="detail-ink"/></g>` },
  star: { id: "extra-star", name: "Lucky star", markup: () => `<path d="M742 294 L765 346 L821 351 L779 388 L791 443 L742 414 L693 443 L705 388 L663 351 L719 346Z" fill="#F4C84D" class="detail-ink" filter="url(#stickerShadow)"/>` },
  bandana: { id: "extra-bandana", name: "Bandana", markup: (c) => `<g><path d="M270 780 Q500 872 730 780 L682 888 Q500 954 318 888Z" fill="${c.blush}" class="face-ink"/><path d="M665 853 L786 922 L700 771Z" fill="${c.secondary}" class="detail-ink"/></g>` },
  sprout: { id: "extra-sprout", name: "Head sprout", markup: (c) => `<g transform="translate(500 260)"><path d="M0 36 Q-8 -37 -61 -74" class="detail-line" fill="none"/><path d="M-61 -74 Q-9 -88 -12 -34 Q-64 -26 -61 -74Z" fill="${c.secondary}" class="detail-ink"/><path d="M-1 -37 Q42 -93 86 -60 Q60 -6 7 6Z" fill="${c.secondary}" class="detail-ink"/></g>` },
  none: { id: "extra-none", name: "No accessory", markup: () => "" }
};

const finishes = {
  clean: { label: "Clean", markup: () => "" },
  paper: { label: "Paper dots", markup: () => `<rect x="120" y="100" width="760" height="840" fill="url(#paperDots)" opacity=".45" clip-path="url(#headClip)"/>` },
  halftone: { label: "Halftone", markup: () => `<path d="M160 620 Q330 460 500 550 Q670 460 840 620 L840 920 L160 920Z" fill="url(#halftone)" opacity=".55" clip-path="url(#headClip)"/>` },
  ink: { label: "Ink accents", markup: () => `<g fill="none" class="tiny-line" opacity=".32"><path d="M275 760 q34 26 68 1 M650 773 q38 21 72 -7 M294 431 q28 -33 59 -16 M646 416 q31 -16 61 18"/></g>` }
};

const recipes = [
  { id: "mochi-cat", name: "Mochi Cat", animal: "Cat", palette: "tangerine", head: "cat", ears: "catRound", eyes: "sparkle", snout: "cat", cheeks: "hatch", marking: "freckles", accessory: "flower" },
  { id: "mimi-bunny", name: "Mimi Bunny", animal: "Bunny", palette: "lavender", head: "bunny", ears: "bunnyLong", eyes: "sparkle", snout: "bunny", cheeks: "peach", marking: "none", accessory: "star" },
  { id: "puff-bear", name: "Puff Bear", animal: "Bear", palette: "mint", head: "bear", ears: "bearRound", eyes: "sleepy", snout: "bear", cheeks: "tiny", marking: "forehead", accessory: "sprout" },
  { id: "biscuit-pup", name: "Biscuit Pup", animal: "Puppy", palette: "sky", head: "puppy", ears: "puppyFlop", eyes: "wink", snout: "puppy", cheeks: "peach", marking: "patch", accessory: "bandana" },
  { id: "yuzu-fox", name: "Yuzu Fox", animal: "Fox", palette: "butter", head: "fox", ears: "foxPoint", eyes: "dot", snout: "fox", cheeks: "hatch", marking: "foxMask", accessory: "none" }
];

const categories = {
  head: { label: "Base", items: heads },
  ears: { label: "Ears", items: ears },
  eyes: { label: "Eyes", items: eyes },
  snout: { label: "Snout", items: snouts },
  cheeks: { label: "Cheeks", items: cheeks },
  marking: { label: "Marking", items: markings },
  accessory: { label: "Extra", items: accessories }
};

const defaultState = {
  recipeId: "mochi-cat",
  palette: "tangerine",
  head: "cat",
  ears: "catRound",
  eyes: "sparkle",
  snout: "cat",
  cheeks: "hatch",
  marking: "freckles",
  accessory: "flower",
  finish: "paper",
  scale: 100,
  rotation: 0,
  flipped: false,
  favorite: false,
  name: "Mochi Cat",
  mode: "recipes",
  category: "head"
};

let state = { ...defaultState };
let saved = loadSaved();

const els = {
  renderRoot: document.querySelector("#renderRoot"),
  headClipPath: document.querySelector("#headClipPath"),
  stage: document.querySelector("#stage"),
  recipeLibrary: document.querySelector("#recipeLibrary"),
  partLibrary: document.querySelector("#partLibrary"),
  categoryTabs: document.querySelector("#categoryTabs"),
  partGrid: document.querySelector("#partGrid"),
  characterTitle: document.querySelector("#characterTitle"),
  stageStatus: document.querySelector("#stageStatus"),
  recipeCode: document.querySelector("#recipeCode"),
  scaleControl: document.querySelector("#scaleControl"),
  scaleOutput: document.querySelector("#scaleOutput"),
  rotationControl: document.querySelector("#rotationControl"),
  rotationOutput: document.querySelector("#rotationOutput"),
  paletteGrid: document.querySelector("#paletteGrid"),
  finishGrid: document.querySelector("#finishGrid"),
  nameInput: document.querySelector("#nameInput"),
  favoriteButton: document.querySelector("#favoriteButton"),
  savedGrid: document.querySelector("#savedGrid")
};

function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[char]));
}

function currentPalette() {
  return palettes[state.palette] || palettes.tangerine;
}

function faceStyleBlock() {
  return `<style>
    .face-ink{stroke:#2d2723;stroke-width:18;stroke-linecap:round;stroke-linejoin:round}
    .detail-ink{stroke:#2d2723;stroke-width:11;stroke-linecap:round;stroke-linejoin:round}
    .detail-line{stroke:#2d2723;stroke-width:14;stroke-linecap:round;stroke-linejoin:round}
    .tiny-line{stroke:#2d2723;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
  </style>`;
}

function faceMarkup(snapshot = state, options = {}) {
  const c = palettes[snapshot.palette] || palettes.tangerine;
  const head = heads[snapshot.head] || heads.cat;
  const ear = ears[snapshot.ears] || ears.catRound;
  const eye = eyes[snapshot.eyes] || eyes.sparkle;
  const snout = snouts[snapshot.snout] || snouts.cat;
  const cheek = cheeks[snapshot.cheeks] || cheeks.peach;
  const marking = markings[snapshot.marking] || markings.none;
  const accessory = accessories[snapshot.accessory] || accessories.none;
  const finish = finishes[snapshot.finish] || finishes.clean;
  const scale = Number(snapshot.scale || 100) / 100;
  const rotation = Number(snapshot.rotation || 0);
  const flip = snapshot.flipped ? -1 : 1;
  const transform = `translate(500 520) rotate(${rotation}) scale(${scale * flip} ${scale}) translate(-500 -520)`;
  const includeBackground = options.background !== false;

  return `${includeBackground ? `<rect width="1000" height="1000" rx="70" fill="${c.stage}"/>` : ""}
    ${faceStyleBlock()}
    <g transform="${transform}" filter="url(#faceShadow)">
      ${ear.markup(c)}
      ${head.markup(c)}
      <g clip-path="url(#headClip)">${marking.markup(c)}</g>
      ${eye.markup(c)}
      ${cheek.markup(c)}
      ${snout.markup(c)}
      ${accessory.markup(c)}
      ${finish.markup(c)}
    </g>`;
}

function renderFace() {
  const head = heads[state.head] || heads.cat;
  els.headClipPath.setAttribute("d", head.clip);
  els.renderRoot.innerHTML = faceMarkup(state, { background: false });
  els.stage.style.background = currentPalette().stage;
  els.characterTitle.textContent = state.name || "Untitled Cutie";
  els.stageStatus.textContent = state.mode === "recipes" ? "Curated recipe" : "Custom composition";
  els.recipeCode.textContent = [
    heads[state.head]?.id,
    ears[state.ears]?.id,
    eyes[state.eyes]?.id,
    snouts[state.snout]?.id
  ].filter(Boolean).join(" · ").toUpperCase();
  els.scaleOutput.textContent = `${state.scale}%`;
  els.rotationOutput.textContent = `${state.rotation}°`;
  els.scaleControl.value = state.scale;
  els.rotationControl.value = state.rotation;
  els.nameInput.value = state.name;
  els.favoriteButton.classList.toggle("is-active", state.favorite);
  els.favoriteButton.textContent = state.favorite ? "♥" : "♡";
  renderRecipeLibrary();
  renderPartLibrary();
  renderPalettes();
  renderFinishes();
}

function smallSvg(snapshot, background = true) {
  const head = heads[snapshot.head] || heads.cat;
  return `<svg viewBox="0 0 1000 1000" xmlns="${NS}">
    <defs>
      <clipPath id="headClip"><path d="${head.clip}"/></clipPath>
      <filter id="faceShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#3d3028" flood-opacity=".14"/></filter>
      <filter id="stickerShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="7" flood-color="#3d3028" flood-opacity=".18"/></filter>
      <pattern id="paperDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r="2.2" fill="#2d2723" opacity=".11"/></pattern>
      <pattern id="halftone" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.2" fill="#2d2723" opacity=".16"/></pattern>
    </defs>
    ${faceMarkup(snapshot, { background })}
  </svg>`;
}

function renderRecipeLibrary() {
  els.recipeLibrary.innerHTML = recipes.map((recipe) => {
    const snapshot = { ...defaultState, ...recipe, finish: "paper", scale: 92, rotation: 0, flipped: false };
    return `<button class="recipe-card ${state.recipeId === recipe.id && state.mode === "recipes" ? "is-active" : ""}" data-recipe="${recipe.id}" type="button">
      <span class="recipe-thumb" style="background:${palettes[recipe.palette].stage}">${smallSvg(snapshot)}</span>
      <span class="recipe-meta"><strong>${escapeHtml(recipe.name)}</strong><span>${escapeHtml(recipe.animal)} · ${escapeHtml(eyes[recipe.eyes].name)}</span></span>
      <span class="recipe-arrow">→</span>
    </button>`;
  }).join("");

  els.recipeLibrary.querySelectorAll("[data-recipe]").forEach((button) => {
    button.addEventListener("click", () => applyRecipe(button.dataset.recipe));
  });
}

function renderCategoryTabs() {
  els.categoryTabs.innerHTML = Object.entries(categories).map(([key, category]) => `<button class="category-button ${state.category === key ? "is-active" : ""}" data-category="${key}" type="button">${category.label}</button>`).join("");
  els.categoryTabs.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderPartLibrary();
    });
  });
}

function partPreview(categoryKey, itemKey) {
  const c = currentPalette();
  const item = categories[categoryKey].items[itemKey];
  const clip = heads[state.head]?.clip || heads.cat.clip;
  return `<svg viewBox="180 120 640 760" xmlns="${NS}">${faceStyleBlock()}<defs><clipPath id="headClip"><path d="${clip}"/></clipPath><filter id="stickerShadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity=".15"/></filter></defs>${item.markup(c)}</svg>`;
}

function renderPartLibrary() {
  renderCategoryTabs();
  const category = categories[state.category];
  els.partGrid.innerHTML = Object.entries(category.items).map(([key, item]) => `<button class="part-card ${state[state.category] === key ? "is-active" : ""}" data-part="${key}" type="button"><span class="part-preview">${partPreview(state.category, key)}</span><span class="part-name">${escapeHtml(item.name)}</span></button>`).join("");
  els.partGrid.querySelectorAll("[data-part]").forEach((button) => {
    button.addEventListener("click", () => {
      state[state.category] = button.dataset.part;
      state.recipeId = null;
      state.mode = "parts";
      renderFace();
    });
  });
}

function renderPalettes() {
  els.paletteGrid.innerHTML = Object.entries(palettes).map(([key, palette]) => `<button class="palette-button ${state.palette === key ? "is-active" : ""}" style="--swatch:${palette.head}" data-palette="${key}" aria-label="${palette.label}" title="${palette.label}" type="button"></button>`).join("");
  els.paletteGrid.querySelectorAll("[data-palette]").forEach((button) => {
    button.addEventListener("click", () => {
      state.palette = button.dataset.palette;
      state.recipeId = null;
      state.mode = "parts";
      renderFace();
    });
  });
}

function renderFinishes() {
  els.finishGrid.innerHTML = Object.entries(finishes).map(([key, finish]) => `<button class="finish-button ${state.finish === key ? "is-active" : ""}" data-finish="${key}" type="button">${finish.label}</button>`).join("");
  els.finishGrid.querySelectorAll("[data-finish]").forEach((button) => {
    button.addEventListener("click", () => {
      state.finish = button.dataset.finish;
      renderFace();
    });
  });
}

function applyRecipe(recipeId) {
  const recipe = recipes.find((item) => item.id === recipeId);
  if (!recipe) return;
  state = {
    ...defaultState,
    ...recipe,
    recipeId: recipe.id,
    name: recipe.name,
    finish: state.finish || "paper",
    mode: "recipes"
  };
  syncModeTabs();
  renderFace();
}

function syncModeTabs() {
  document.querySelectorAll(".mode-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.mode === state.mode));
  els.recipeLibrary.hidden = state.mode !== "recipes";
  els.partLibrary.hidden = state.mode !== "parts";
}

function randomKey(object) {
  const keys = Object.keys(object);
  return keys[Math.floor(Math.random() * keys.length)];
}

function shuffleFace() {
  const useRecipe = Math.random() < 0.42;
  if (useRecipe) {
    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    applyRecipe(recipe.id);
    state.finish = randomKey(finishes);
  } else {
    state = {
      ...state,
      recipeId: null,
      mode: "parts",
      palette: randomKey(palettes),
      head: randomKey(heads),
      ears: randomKey(ears),
      eyes: randomKey(eyes),
      snout: randomKey(snouts),
      cheeks: randomKey(cheeks),
      marking: randomKey(markings),
      accessory: randomKey(accessories),
      finish: randomKey(finishes),
      scale: 96 + Math.floor(Math.random() * 9),
      rotation: -3 + Math.floor(Math.random() * 7),
      flipped: Math.random() > 0.5,
      favorite: false,
      name: cuteName()
    };
  }
  syncModeTabs();
  renderFace();
}

function cuteName() {
  const first = ["Mochi", "Mimi", "Puff", "Biscuit", "Yuzu", "Nori", "Poppy", "Toto", "Miso", "Bean", "Waffle", "Dumpling"];
  const last = ["Bean", "Paws", "Puff", "Sprout", "Bun", "Dot", "Peach", "Muffin", "Moon", "Button"];
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
}

function resetFace() {
  state = { ...defaultState };
  syncModeTabs();
  renderFace();
}

function saveCurrent() {
  const snapshot = { ...state, savedAt: Date.now() };
  saved.unshift(snapshot);
  saved = saved.slice(0, 5);
  localStorage.setItem("cute-face-lab-saved", JSON.stringify(saved));
  renderSaved();
}

function loadSaved() {
  try {
    const value = JSON.parse(localStorage.getItem("cute-face-lab-saved") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function renderSaved() {
  if (!saved.length) {
    els.savedGrid.innerHTML = recipes.slice(0, 3).map((recipe) => {
      const snapshot = { ...defaultState, ...recipe, name: recipe.name, scale: 93 };
      return `<button class="saved-card" data-seed="${recipe.id}" type="button">${smallSvg(snapshot)}<span>${escapeHtml(recipe.name)}</span></button>`;
    }).join("");
    els.savedGrid.querySelectorAll("[data-seed]").forEach((button) => button.addEventListener("click", () => applyRecipe(button.dataset.seed)));
    return;
  }

  els.savedGrid.innerHTML = saved.map((snapshot, index) => `<button class="saved-card" data-saved="${index}" type="button">${smallSvg(snapshot)}<span>${escapeHtml(snapshot.name || "Saved cutie")}</span></button>`).join("");
  els.savedGrid.querySelectorAll("[data-saved]").forEach((button) => {
    button.addEventListener("click", () => {
      state = { ...defaultState, ...saved[Number(button.dataset.saved)], mode: "parts" };
      syncModeTabs();
      renderFace();
    });
  });
}

function exportPng() {
  const head = heads[state.head] || heads.cat;
  const svg = `<svg xmlns="${NS}" width="1600" height="1600" viewBox="0 0 1000 1000"><defs><clipPath id="headClip"><path d="${head.clip}"/></clipPath><filter id="faceShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#3d3028" flood-opacity=".14"/></filter><filter id="stickerShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="7" flood-color="#3d3028" flood-opacity=".18"/></filter><pattern id="paperDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r="2.2" fill="#2d2723" opacity=".11"/></pattern><pattern id="halftone" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.2" fill="#2d2723" opacity=".16"/></pattern></defs>${faceMarkup(state, { background: true })}</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1600;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, 1600, 1600);
    URL.revokeObjectURL(url);
    canvas.toBlob((png) => {
      if (!png) return;
      const link = document.createElement("a");
      const safeName = (state.name || "cute-face").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      link.href = URL.createObjectURL(png);
      link.download = `${safeName || "cute-face"}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    }, "image/png");
  };
  image.src = url;
}

document.querySelectorAll(".mode-tab").forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    syncModeTabs();
    renderFace();
  });
});

document.querySelector("#shuffleButton").addEventListener("click", shuffleFace);
document.querySelector("#shuffleSecondary").addEventListener("click", shuffleFace);
document.querySelector("#resetButton").addEventListener("click", resetFace);
document.querySelector("#flipButton").addEventListener("click", () => { state.flipped = !state.flipped; renderFace(); });
document.querySelector("#favoriteButton").addEventListener("click", () => { state.favorite = !state.favorite; renderFace(); });
document.querySelector("#saveButton").addEventListener("click", saveCurrent);
document.querySelector("#exportButton").addEventListener("click", exportPng);
els.scaleControl.addEventListener("input", (event) => { state.scale = Number(event.target.value); renderFace(); });
els.rotationControl.addEventListener("input", (event) => { state.rotation = Number(event.target.value); renderFace(); });
els.nameInput.addEventListener("input", (event) => { state.name = event.target.value; els.characterTitle.textContent = state.name || "Untitled Cutie"; });

syncModeTabs();
renderSaved();
renderFace();
