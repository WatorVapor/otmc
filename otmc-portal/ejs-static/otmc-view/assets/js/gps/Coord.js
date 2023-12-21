export class Coord {
  static a = 6378137.0;
  static f = 1.0 / 298.257223563;
  static e2 = Coord.f * (2.0 - Coord.f);
  constructor(){
  }
  /**
  WGS2ECEF
  * WGS84 to ECEF
  */
  WGS2ECEF(lat,lon,geo) {
    lat = Math.PI * lat / 180.0;
    lon = Math.PI * lon / 180.0;
    const N = Coord.a / Math.sqrt(1.0 - Coord.e2 * Math.pow(Math.sin(lat),2.0));
    const x = (N + geo) * Math.cos(lat) * Math.sin(lon);
    const y = (N * (1.0 - Coord.e2) + geo) * Math.sin(lat) ;
    const z = (N + geo) * Math.cos(lat) * Math.cos(lon);
    return {x:x,y:y,z:z};
  }
  /**
  ECEF2WGS
  * ECEF to WGS84
  */
  ECEF2WGS(x,y,z) {
    const p = Math.sqrt(x*x + y*y);
    const r = Math.sqrt(p*p + z*z);
    const mu = Math.atan(z / p * ((1.0 - Coord.f) + Coord.e2 * Coord.a/r));
    const B = Math.atan( (z * (1.0-Coord.f) + Coord. e2* Coord.a*Math.Pow(Math.sin(mu),3)) / ((1.0-Coord.f)*(p-e2*a*Math.Pow(Math.cos(mu),3))) );
    const lat = 180.0 * B / Math.PI;
    const lon = 180.0 * Math.atan2(y,x) / Math.PI;
    const geo = p * Math.cos(B) + z*Math.sin(B) - a*Math.sqrt(1.0 - e2*Math.Pow(Math.sin(B),2));
  }
}
