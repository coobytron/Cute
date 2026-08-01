(function attachBuildFaceManifest(global) {
  "use strict";

  const allBases = ["base-cat-round", "base-bunny-soft", "base-bear-puff", "base-puppy-drop", "base-fox-point"];
  const asset = (id, label, type, markup, compatibleBases = allBases, zOrder = 200, overrides = {}) => ({
    id, label, type, markup, compatibleBases, zOrder,
    defaultTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
    overrides
  });

  const assets = [
    asset("base-cat-round", "Round cat", "base", '<path d="M250 370 L315 150 L430 278 Q500 250 570 278 L685 150 L750 370 C835 438 846 618 772 747 C704 865 606 910 500 912 C394 910 296 865 228 747 C154 618 165 438 250 370Z" fill="var(--head)" class="face-ink"/>', allBases, 100),
    asset("base-bunny-soft", "Soft bunny", "base", '<path d="M283 386 C250 284 302 218 392 250 Q500 208 608 250 C698 218 750 284 717 386 C804 449 829 603 769 729 C712 850 612 906 500 910 C388 906 288 850 231 729 C171 603 196 449 283 386Z" fill="var(--head)" class="face-ink"/>', allBases, 100),
    asset("base-bear-puff", "Puff bear", "base", '<path d="M255 386 C198 308 256 220 352 251 Q500 201 648 251 C744 220 802 308 745 386 C828 455 841 617 775 742 C710 864 609 913 500 914 C391 913 290 864 225 742 C159 617 172 455 255 386Z" fill="var(--head)" class="face-ink"/>', allBases, 100),
    asset("base-puppy-drop", "Drop puppy", "base", '<path d="M254 382 C240 267 348 222 440 263 Q500 241 560 263 C652 222 760 267 746 382 C823 452 837 617 772 744 C709 865 610 913 500 914 C390 913 291 865 228 744 C163 617 177 452 254 382Z" fill="var(--head)" class="face-ink"/>', allBases, 100),
    asset("base-fox-point", "Point fox", "base", '<path d="M248 371 L324 148 L430 272 Q500 244 570 272 L676 148 L752 371 C833 446 842 616 770 746 C700 871 603 920 500 921 C397 920 300 871 230 746 C158 616 167 446 248 371Z" fill="var(--head)" class="face-ink"/>', allBases, 100),

    asset("ears-cat-peak", "Cat peaks", "ears", '<g class="face-ink" fill="var(--head)"><path d="M281 338 L318 155 L430 284Z"/><path d="M719 338 L682 155 L570 284Z"/></g><g class="detail-ink" fill="var(--blush)"><path d="M315 267 L331 205 L386 275Z"/><path d="M685 267 L669 205 L614 275Z"/></g>', ["base-cat-round","base-fox-point"], 80),
    asset("ears-bunny-long", "Long bunny", "ears", '<g class="face-ink" fill="var(--head)"><ellipse cx="370" cy="200" rx="67" ry="185" transform="rotate(-10 370 200)"/><ellipse cx="630" cy="200" rx="67" ry="185" transform="rotate(10 630 200)"/></g><g class="detail-ink" fill="var(--blush)"><ellipse cx="374" cy="202" rx="25" ry="127" transform="rotate(-10 374 202)"/><ellipse cx="626" cy="202" rx="25" ry="127" transform="rotate(10 626 202)"/></g>', ["base-bunny-soft","base-bear-puff"], 80),
    asset("ears-bear-round", "Bear rounds", "ears", '<g class="face-ink" fill="var(--head)"><circle cx="302" cy="310" r="110"/><circle cx="698" cy="310" r="110"/></g><g class="detail-ink" fill="var(--secondary)"><circle cx="302" cy="310" r="52"/><circle cx="698" cy="310" r="52"/></g>', ["base-bear-puff","base-bunny-soft"], 80),
    asset("ears-puppy-flop", "Floppy puppy", "ears", '<g class="face-ink" fill="var(--secondary)"><path d="M287 326 C156 252 105 389 168 509 C205 579 295 551 333 462 L361 366Z"/><path d="M713 326 C844 252 895 389 832 509 C795 579 705 551 667 462 L639 366Z"/></g>', ["base-puppy-drop","base-bear-puff"], 80),
    asset("ears-fox-point", "Fox points", "ears", '<g class="face-ink" fill="var(--head)"><path d="M275 345 L326 135 L445 292Z"/><path d="M725 345 L674 135 L555 292Z"/></g><g class="detail-ink" fill="var(--blush)"><path d="M319 278 L337 196 L399 281Z"/><path d="M681 278 L663 196 L601 281Z"/></g>', ["base-fox-point","base-cat-round"], 80),
    asset("ears-tiny-round", "Tiny rounds", "ears", '<g class="face-ink" fill="var(--head)"><circle cx="340" cy="300" r="75"/><circle cx="660" cy="300" r="75"/></g><g class="detail-ink" fill="var(--blush)"><circle cx="340" cy="300" r="31"/><circle cx="660" cy="300" r="31"/></g>', allBases, 80),
    asset("ears-wide-round", "Wide rounds", "ears", '<g class="face-ink" fill="var(--head)"><circle cx="275" cy="330" r="92"/><circle cx="725" cy="330" r="92"/></g><g fill="var(--secondary)"><circle cx="275" cy="330" r="38"/><circle cx="725" cy="330" r="38"/></g>', ["base-bear-puff","base-puppy-drop","base-bunny-soft"], 80),
    asset("ears-soft-point", "Soft points", "ears", '<g class="face-ink" fill="var(--head)"><path d="M270 360 Q300 170 420 290Z"/><path d="M730 360 Q700 170 580 290Z"/></g>', ["base-cat-round","base-fox-point","base-bunny-soft"], 80),

    asset("eyes-sparkle", "Sparkle eyes", "eyes", '<g fill="#2d2723"><path d="M345 473 C345 405 430 405 430 472 C430 537 388 566 388 566 C388 566 345 537 345 473Z"/><path d="M570 473 C570 405 655 405 655 472 C655 537 612 566 612 566 C612 566 570 537 570 473Z"/></g><g fill="#fff"><circle cx="374" cy="446" r="15"/><circle cx="599" cy="446" r="15"/><circle cx="401" cy="487" r="8"/><circle cx="626" cy="487" r="8"/></g>', allBases, 180),
    asset("eyes-sleepy", "Sleepy eyes", "eyes", '<g fill="none" class="detail-line"><path d="M330 488 Q390 542 450 488"/><path d="M550 488 Q610 542 670 488"/></g>', allBases, 180),
    asset("eyes-dot", "Dot eyes", "eyes", '<g fill="#2d2723"><ellipse cx="390" cy="486" rx="28" ry="38"/><ellipse cx="610" cy="486" rx="28" ry="38"/></g><g fill="#fff"><circle cx="401" cy="473" r="9"/><circle cx="621" cy="473" r="9"/></g>', allBases, 180),
    asset("eyes-wink", "Wink", "eyes", '<ellipse cx="390" cy="486" rx="28" ry="38" fill="#2d2723"/><circle cx="401" cy="473" r="9" fill="#fff"/><path d="M552 493 Q611 544 672 493" fill="none" class="detail-line"/>', allBases, 180),
    asset("eyes-tiny", "Tiny eyes", "eyes", '<g fill="#2d2723"><circle cx="398" cy="488" r="19"/><circle cx="602" cy="488" r="19"/></g><g fill="#fff"><circle cx="404" cy="481" r="6"/><circle cx="608" cy="481" r="6"/></g>', allBases, 180),
    asset("eyes-star", "Star eyes", "eyes", '<g fill="#2d2723"><path d="M390 426 L407 466 L450 470 L417 498 L427 540 L390 518 L353 540 L363 498 L330 470 L373 466Z"/><path d="M610 426 L627 466 L670 470 L637 498 L647 540 L610 518 L573 540 L583 498 L550 470 L593 466Z"/></g>', allBases, 180),
    asset("eyes-happy-arc", "Happy arcs", "eyes", '<g fill="none" class="detail-line"><path d="M335 500 Q390 440 445 500"/><path d="M555 500 Q610 440 665 500"/></g>', allBases, 180),
    asset("eyes-round-shine", "Round shine", "eyes", '<g fill="#2d2723"><circle cx="390" cy="486" r="43"/><circle cx="610" cy="486" r="43"/></g><g fill="#fff"><circle cx="374" cy="470" r="14"/><circle cx="594" cy="470" r="14"/></g>', allBases, 180),

    asset("snout-cat", "Cat muzzle", "snout", '<g><ellipse cx="452" cy="642" rx="96" ry="70" fill="var(--muzzle)"/><ellipse cx="548" cy="642" rx="96" ry="70" fill="var(--muzzle)"/><path d="M500 591 C463 591 455 628 500 646 C545 628 537 591 500 591Z" fill="#2d2723"/><path d="M500 646 Q500 697 452 704 M500 646 Q500 697 548 704" fill="none" class="detail-line"/></g>', ["base-cat-round","base-fox-point"], 190),
    asset("snout-bunny", "Bunny mouth", "snout", '<path d="M500 598 C467 580 430 605 446 645 C461 683 487 685 500 665 C513 685 539 683 554 645 C570 605 533 580 500 598Z" fill="var(--blush)" class="detail-ink"/><path d="M500 665 Q500 709 462 717 M500 665 Q500 709 538 717" fill="none" class="detail-line"/>', ["base-bunny-soft","base-cat-round"], 190),
    asset("snout-bear", "Bear muzzle", "snout", '<ellipse cx="500" cy="650" rx="142" ry="103" fill="var(--muzzle)" class="detail-ink"/><ellipse cx="500" cy="610" rx="44" ry="32" fill="#2d2723"/><path d="M500 642 Q500 691 452 698 M500 642 Q500 691 548 698" fill="none" class="detail-line"/>', ["base-bear-puff","base-bunny-soft"], 190),
    asset("snout-puppy", "Puppy muzzle", "snout", '<ellipse cx="500" cy="650" rx="150" ry="100" fill="var(--muzzle)" class="detail-ink"/><path d="M500 588 C457 588 447 635 500 654 C553 635 543 588 500 588Z" fill="#2d2723"/><path d="M500 654 Q500 697 456 706 M500 654 Q500 697 544 706" fill="none" class="detail-line"/>', ["base-puppy-drop","base-bear-puff"], 190),
    asset("snout-fox", "Fox muzzle", "snout", '<path d="M324 620 Q410 556 500 630 Q590 556 676 620 Q642 770 500 802 Q358 770 324 620Z" fill="var(--muzzle)"/><path d="M500 596 C463 596 455 631 500 648 C545 631 537 596 500 596Z" fill="#2d2723"/><path d="M500 648 Q500 697 456 704 M500 648 Q500 697 544 704" fill="none" class="detail-line"/>', ["base-fox-point","base-cat-round"], 190),
    asset("snout-button", "Button nose", "snout", '<ellipse cx="500" cy="630" rx="105" ry="76" fill="var(--muzzle)"/><path d="M500 590 C466 590 458 625 500 642 C542 625 534 590 500 590Z" fill="#2d2723"/><path d="M500 642 Q500 681 470 694 M500 642 Q500 681 530 694" fill="none" class="detail-line"/>', allBases, 190),

    asset("cheeks-soft", "Soft blush", "cheeks", '<g fill="var(--blush)" opacity=".72"><ellipse cx="300" cy="620" rx="64" ry="30"/><ellipse cx="700" cy="620" rx="64" ry="30"/></g>', allBases, 170),
    asset("cheeks-round", "Round blush", "cheeks", '<g fill="var(--blush)" opacity=".68"><circle cx="300" cy="620" r="43"/><circle cx="700" cy="620" r="43"/></g>', allBases, 170),
    asset("cheeks-dots", "Freckle dots", "cheeks", '<g fill="var(--secondary)" opacity=".7"><circle cx="285" cy="620" r="8"/><circle cx="315" cy="610" r="7"/><circle cx="330" cy="635" r="6"/><circle cx="715" cy="620" r="8"/><circle cx="685" cy="610" r="7"/><circle cx="670" cy="635" r="6"/></g>', allBases, 170),
    asset("cheeks-heart", "Heart cheeks", "cheeks", '<g fill="var(--blush)"><path d="M270 610 C270 580 310 580 315 607 C320 580 360 580 360 610 C360 645 315 665 315 665 C315 665 270 645 270 610Z"/><path d="M640 610 C640 580 680 580 685 607 C690 580 730 580 730 610 C730 645 685 665 685 665 C685 665 640 645 640 610Z"/></g>', allBases, 170),
    asset("cheeks-none", "No cheeks", "cheeks", '', allBases, 170),

    asset("markings-tabby", "Tabby marks", "markings", '<g fill="var(--secondary)"><path d="M430 304 L468 390 L500 312 L532 390 L570 304 L552 430 L500 397 L448 430Z"/><path d="M245 490 Q300 450 340 470 L308 505 Q275 490 245 510Z"/><path d="M755 490 Q700 450 660 470 L692 505 Q725 490 755 510Z"/></g>', ["base-cat-round","base-fox-point"], 150),
    asset("markings-mask", "Eye mask", "markings", '<path d="M282 450 Q390 365 500 450 Q610 365 718 450 Q680 575 560 570 Q500 540 440 570 Q320 575 282 450Z" fill="var(--secondary)" opacity=".55"/>', allBases, 150),
    asset("markings-spots", "Soft spots", "markings", '<g fill="var(--secondary)" opacity=".55"><circle cx="340" cy="360" r="38"/><circle cx="650" cy="350" r="28"/><circle cx="260" cy="540" r="24"/></g>', allBases, 150),
    asset("markings-forehead", "Forehead drop", "markings", '<path d="M500 292 Q555 350 500 438 Q445 350 500 292Z" fill="var(--secondary)" opacity=".7"/>', allBases, 150),
    asset("markings-muzzle", "Muzzle patch", "markings", '<ellipse cx="500" cy="650" rx="190" ry="145" fill="var(--secondary)" opacity=".18"/>', allBases, 150),
    asset("markings-none", "No markings", "markings", '', allBases, 150),

    asset("accessory-flower", "Tiny flower", "accessory", '<g transform="translate(700 315)"><g fill="var(--blush)" class="detail-ink"><circle cx="0" cy="-34" r="30"/><circle cx="32" cy="-8" r="30"/><circle cx="20" cy="30" r="30"/><circle cx="-20" cy="30" r="30"/><circle cx="-32" cy="-8" r="30"/></g><circle r="22" fill="var(--secondary)"/></g>', allBases, 230, {"base-bunny-soft":{x:25,y:-50},"base-puppy-drop":{x:35,y:20}}),
    asset("accessory-bow", "Soft bow", "accessory", '<g transform="translate(500 290)" class="detail-ink"><path d="M0 0 C-55 -70 -145 -55 -130 30 C-115 102 -40 70 0 25Z" fill="var(--blush)"/><path d="M0 0 C55 -70 145 -55 130 30 C115 102 40 70 0 25Z" fill="var(--blush)"/><circle r="34" fill="var(--secondary)"/></g>', ["base-bear-puff","base-bunny-soft","base-cat-round"], 230),
    asset("accessory-star", "Little star", "accessory", '<path d="M760 300 L778 342 L824 346 L789 376 L799 421 L760 397 L721 421 L731 376 L696 346 L742 342Z" fill="var(--secondary)" class="detail-ink"/>', allBases, 230),
    asset("accessory-sprout", "Head sprout", "accessory", '<g transform="translate(500 255)" class="detail-ink"><path d="M0 35 Q-12 -20 -70 -42 Q-62 22 0 35Z" fill="#79b88a"/><path d="M0 35 Q12 -20 70 -42 Q62 22 0 35Z" fill="#79b88a"/></g>', ["base-bear-puff","base-bunny-soft","base-puppy-drop"], 230),
    asset("accessory-scarf", "Tiny scarf", "accessory", '<g transform="translate(500 820)" class="detail-ink"><path d="M-180 -35 Q0 40 180 -35 L160 45 Q0 110 -160 45Z" fill="var(--blush)"/><path d="M95 55 L185 155 L130 180 L55 75Z" fill="var(--secondary)"/></g>', allBases, 230),
    asset("accessory-crown", "Paper crown", "accessory", '<path d="M390 310 L420 190 L500 270 L580 190 L610 310Z" fill="#f4c84d" class="detail-ink"/>', ["base-cat-round","base-bear-puff","base-fox-point"], 230),
    asset("accessory-none", "No accessory", "accessory", '', allBases, 230)
  ];

  const recipes = [
    ["layered-mochi", "Mochi Mix", "base-cat-round", "ears-cat-peak", "eyes-sparkle", "snout-cat", "cheeks-soft", "markings-tabby", "accessory-flower", "tangerine"],
    ["layered-mimi", "Mimi Mix", "base-bunny-soft", "ears-bunny-long", "eyes-dot", "snout-bunny", "cheeks-round", "markings-none", "accessory-bow", "lavender"],
    ["layered-puff", "Puff Mix", "base-bear-puff", "ears-bear-round", "eyes-tiny", "snout-bear", "cheeks-soft", "markings-forehead", "accessory-sprout", "mint"],
    ["layered-biscuit", "Biscuit Mix", "base-puppy-drop", "ears-puppy-flop", "eyes-round-shine", "snout-puppy", "cheeks-dots", "markings-spots", "accessory-scarf", "sky"],
    ["layered-yuzu", "Yuzu Mix", "base-fox-point", "ears-fox-point", "eyes-wink", "snout-fox", "cheeks-soft", "markings-tabby", "accessory-star", "butter"],
    ["layered-cat-star", "Star Cat", "base-cat-round", "ears-soft-point", "eyes-star", "snout-cat", "cheeks-heart", "markings-forehead", "accessory-crown", "lavender"],
    ["layered-bunny-sleepy", "Sleepy Bun", "base-bunny-soft", "ears-bunny-long", "eyes-sleepy", "snout-bunny", "cheeks-soft", "markings-spots", "accessory-flower", "mint"],
    ["layered-bear-button", "Button Bear", "base-bear-puff", "ears-wide-round", "eyes-happy-arc", "snout-button", "cheeks-round", "markings-mask", "accessory-bow", "butter"],
    ["layered-pup-sprout", "Sprout Pup", "base-puppy-drop", "ears-tiny-round", "eyes-dot", "snout-puppy", "cheeks-heart", "markings-muzzle", "accessory-sprout", "tangerine"],
    ["layered-fox-crown", "Crown Fox", "base-fox-point", "ears-cat-peak", "eyes-sparkle", "snout-fox", "cheeks-dots", "markings-forehead", "accessory-crown", "sky"],
    ["layered-cat-round", "Round Friend", "base-cat-round", "ears-tiny-round", "eyes-round-shine", "snout-button", "cheeks-round", "markings-none", "accessory-scarf", "mint"],
    ["layered-bunny-star", "Star Bunny", "base-bunny-soft", "ears-bear-round", "eyes-star", "snout-bunny", "cheeks-heart", "markings-spots", "accessory-star", "lavender"]
  ].map(([id,label,base,ears,eyes,snout,cheeks,markings,accessory,palette]) => ({
    id,label,mode:"parts",palette,
    partIds:{base,ears,eyes,snout,cheeks,markings,accessory},
    transform:{scale:1,rotation:0,flipX:false}
  }));

  global.CuteBuildFaceManifest = Object.freeze({
    schemaVersion: 1,
    categories: ["base","ears","eyes","snout","cheeks","markings","accessory"],
    assets,
    recipes,
    byId: new Map(assets.map((item) => [item.id, item]))
  });
})(window);
