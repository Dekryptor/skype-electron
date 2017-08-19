"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SkypeVersionUtility {
    static extractVersionFromReleaseNameString(input) {
        let match = input.match(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/);
        if (match && match[0]) {
            return match[0];
        }
        return '0.0.0.0';
    }
    static getHigherOfVersions(a, b, ignoreCobrand = true) {
        let aSubversions = a.split('.');
        let bSubversions = b.split('.');
        console.assert(aSubversions.length === bSubversions.length);
        for (let i = 0; i < aSubversions.length; i++) {
            if (i !== 2 || !ignoreCobrand) {
                if (parseInt(aSubversions[i], 10) > parseInt(bSubversions[i], 10)) {
                    return a;
                }
                if (parseInt(aSubversions[i], 10) < parseInt(bSubversions[i], 10)) {
                    return b;
                }
            }
        }
        return a;
    }
}
exports.SkypeVersionUtility = SkypeVersionUtility;
