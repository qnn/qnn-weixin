var MCBAND= [12890594.86, 8362377.87, 5591021, 3481989.83, 1678043.12, 0],
    MC2LL = [[1.410526172116255e-8, 0.00000898305509648872, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 17337981.2], [-7.435856389565537e-9, 0.000008983055097726239, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 10260144.86], [-3.030883460898826e-8, 0.00000898305509983578, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37], [-1.981981304930552e-8, 0.000008983055099779535, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06], [3.09191371068437e-9, 0.000008983055096812155, 0.00006995724062, 23.10934304144901, -0.00023663490511, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4], [2.890871144776878e-9, 0.000008983055095805407, -3.068298e-8, 7.47137025468032, -0.00000353937994, -0.02145144861037, -0.00001234426596, 0.00010322952773, -0.00000323890364, 826088.5]];

var convert_point_to_coordinates = function(x, y) {
  var E;
  for (var i = 0; i < MCBAND.length; i++) {
    if (y >= MCBAND[i]) {
      E = MC2LL[i];
      var LNG = E[0] + E[1] * Math.abs(x);
      var INT = y / E[9];
      var LAT = E[2] + E[3] * Math.pow(INT, 1) + E[4] * Math.pow(INT, 2) + E[5] * Math.pow(INT, 3)
                     + E[6] * Math.pow(INT, 4) + E[7] * Math.pow(INT, 5) + E[8] * Math.pow(INT, 6);
      LNG *= (x < 0 ? -1 : 1);
      LAT *= (y < 0 ? -1 : 1);
      return LAT + ', ' + LNG;
    }
  }
  return null;
};

var charcode = function(string) {
  var T = string.charCodeAt(0);
  if (string >= "A" && string <= "Z") {
    return T - "A".charCodeAt(0);
  } else {
    if (string >= "a" && string <= "z") {
      return (26 + T - "a".charCodeAt(0));
    } else {
      if (string >= "0" && string <= "9") {
        return (52 + T - "0".charCodeAt(0));
      } else {
        if (string == "+") { return 62; }
        else { if (string == "/") { return 63; } }
      }
    }
  }
  return -1;
};

var convert = function(string, array) {
  var T = 0, F = 0, E = 0;
  for (var C = 0; C < 6; C++) {
    E = charcode(string.substr(C + 1, 1));
    if (E < 0) return -1 - C;
    T += E << (6 * C);
    E = charcode(string.substr(C + 7, 1));
    if (E < 0) return -7 - C;
    F += E << (6 * C);
  }
  array.push(T);
  array.push(F);
  return 0;
};

exports.parse_geostring = function(geostring) {
  geostring = geostring.slice(1);
  var k = 0, length = geostring.length, array_l = [];
  while (k < length) {
    if (geostring.charAt(k) == '=') {
      if (length - k < 13) break;
      if (convert(geostring.substr(k, 13), array_l) < 0) break;
      k += 13;
    } else if (geostring.charAt(k) == ';') {
      return convert_point_to_coordinates(array_l[0]/100, array_l[1]/100);
    }
  }
  return null;
};
