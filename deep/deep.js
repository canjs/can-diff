var diffMap = require("../map/map"),
    diffList = require("../list/list"),
    canReflect = require("can-reflect");

function shouldCheckSet(patch, destVal, sourceVal) {
    return patch.type === "set" && destVal && sourceVal &&
        typeof destVal === "object" &&
        typeof sourceVal === "object";
}

function diffDeep(dest, source, parentKey){

    if (dest && canReflect.isMoreListLikeThanMapLike(dest)) {
		return diffList(dest, source).map(function(patch){
            if(parentKey) {
                patch.key = parentKey;
            }
            return patch;
        });
	} else {
        parentKey = parentKey ? parentKey+".": "";
		var patches = diffMap(dest, source);
        // any sets we are going to recurse within
        var finalPatches = [];
        patches.forEach(function(patch){
            var key = patch.key;

            patch.key = parentKey + patch.key;
            var destVal = dest && canReflect.getKeyValue(dest, key),
                sourceVal = source && canReflect.getKeyValue(source, key);
            if(shouldCheckSet(patch, destVal, sourceVal)) {

                var deepPatches = diffDeep(destVal, sourceVal, patch.key);
                finalPatches.push.apply(finalPatches, deepPatches);
            } else {
                finalPatches.push(patch);
            }
        });
        return finalPatches;
	}
}

module.exports = diffDeep;
