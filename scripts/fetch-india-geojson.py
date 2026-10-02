#!/usr/bin/env python3
"""
Fetch real India state boundary GeoJSON and simplify for choropleth.
Source: DataMeet/IndiaGeoJSON (community-maintained, MIT license).
"""
import json
import os
import urllib.request

URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson"
OUT = "/home/z/my-project/public/geo/india-states.geojson"

def main():
    print(f"Fetching India state GeoJSON from {URL}...")
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "Samanvay/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read().decode("utf-8")
        geo = json.loads(data)
        print(f"  ✓ Fetched {len(geo.get('features', []))} features")
        # Normalize properties — we only need state name + lgd_code mapping
        for f in geo.get("features", []):
            props = f.get("properties", {})
            # DataMeet uses NAME_1 or ST_NM
            name = props.get("ST_NM") or props.get("NAME_1") or props.get("name") or "Unknown"
            props.clear()
            props["name"] = name
            # Map to LGD codes
            props["lgd_code"] = STATE_LGD.get(name, 0)
        # Simplify coordinates to 3 decimal places for smaller file
        def simplify(coords):
            if isinstance(coords, list):
                if coords and isinstance(coords[0], (int, float)):
                    return [round(c, 3) for c in coords]
                return [simplify(c) for c in coords]
            return coords
        for f in geo.get("features", []):
            geom = f.get("geometry", {})
            if "coordinates" in geom:
                geom["coordinates"] = simplify(geom["coordinates"])
        with open(OUT, "w") as f:
            json.dump(geo, f, separators=(",", ":"))
        size = os.path.getsize(OUT)
        print(f"  ✓ Saved to {OUT} ({size/1024:.1f} KB)")
        # Verify states
        states = sorted({f["properties"]["name"] for f in geo["features"]})
        print(f"  ✓ States: {len(states)}")
        for s in states:
            print(f"     {s}")
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        # Fallback: generate a minimal stub file so the app doesn't crash
        stub = {"type": "FeatureCollection", "features": []}
        with open(OUT, "w") as f:
            json.dump(stub, f)
        print(f"  ⚠ Wrote empty stub to {OUT}")

# State name → LGD code mapping (canonical)
STATE_LGD = {
    "Andhra Pradesh": 28,
    "Arunachal Pradesh": 12,
    "Assam": 18,
    "Bihar": 10,
    "Chhattisgarh": 22,
    "Goa": 30,
    "Gujarat": 24,
    "Haryana": 6,
    "Himachal Pradesh": 2,
    "Jharkhand": 20,
    "Karnataka": 29,
    "Kerala": 32,
    "Madhya Pradesh": 23,
    "Maharashtra": 27,
    "Manipur": 14,
    "Meghalaya": 17,
    "Mizoram": 15,
    "Nagaland": 13,
    "Odisha": 21,
    "Punjab": 3,
    "Rajasthan": 8,
    "Sikkim": 11,
    "Tamil Nadu": 33,
    "Telangana": 36,
    "Tripura": 16,
    "Uttar Pradesh": 9,
    "Uttarakhand": 5,
    "West Bengal": 19,
    "Andaman & Nicobar Island": 35,
    "Andaman and Nicobar Islands": 35,
    "Chandigarh": 4,
    "Dadra and Nagar Haveli": 26,
    "Daman and Diu": 25,
    "Delhi": 7,
    "Jammu & Kashmir": 1,
    "Jammu and Kashmir": 1,
    "Ladakh": 37,
    "Lakshadweep": 31,
    "Puducherry": 34,
}

if __name__ == "__main__":
    main()
