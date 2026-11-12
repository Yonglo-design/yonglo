// klantgegevens.html: vult de keuzelijst "Land" met alle landen, in de taal van de pagina.
// Nederland staat standaard geselecteerd; Nederland, België en Duitsland staan bovenaan.
(function () {
  var sel = document.querySelector('[data-landen]');
  if (!sel || !window.Intl || !Intl.DisplayNames) return;
  var EN = document.documentElement.lang === 'en';
  var namen = new Intl.DisplayNames([EN ? 'en' : 'nl'], { type: 'region' });
  var CODES = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
    'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ ' +
    'NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
    'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
    'UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW').split(' ');
  var BOVEN = ['NL', 'BE', 'DE'];
  var naam = function (c) { try { return namen.of(c); } catch (e) { return c; } };
  var huidig = sel.value;
  var opt = function (c) { var o = document.createElement('option'); o.value = o.textContent = naam(c); return o; };
  var frag = document.createDocumentFragment();
  BOVEN.forEach(function (c) { frag.appendChild(opt(c)); });
  var lijn = document.createElement('option'); lijn.disabled = true; lijn.textContent = '──────────'; frag.appendChild(lijn);
  CODES.filter(function (c) { return BOVEN.indexOf(c) < 0; })
    .map(opt).sort(function (a, b) { return a.textContent.localeCompare(b.textContent, EN ? 'en' : 'nl'); })
    .forEach(function (o) { frag.appendChild(o); });
  sel.innerHTML = '';
  sel.appendChild(frag);
  sel.value = naam('NL') || huidig;
})();
