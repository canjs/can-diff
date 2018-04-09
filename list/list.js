'use strict';

var canReflect = require("can-reflect");

var slice = [].slice;
// a b c
// a b c d
// [[2,0, d]]


function defaultIdentity(a, b){
    return a === b;
}

function makeIdentityFromMapSchema(typeSchema) {
    return function identityCheck(a, b) {
        var aId = canReflect.getIdentity(a, typeSchema),
            bId = canReflect.getIdentity(b, typeSchema);
        return aId === bId;
    };
}

function makeIdentityFromListSchema(listSchema) {
    return makeIdentityFromMapSchema( canReflect.getSchema(listSchema.values) );
}

function makeIdentity(oldList, oldListLength) {
    var listSchema = canReflect.getSchema(oldList),
        typeSchema;
    if(listSchema != null) {
        typeSchema = canReflect.getSchema(listSchema.values);
    }
    if(typeSchema == null && oldListLength > 0) {
        typeSchema = canReflect.getSchema( canReflect.getKeyValue(oldList, 0) );
    }
    if(typeSchema) {
        return makeIdentityFromMapSchema(typeSchema);
    } else {
        return defaultIdentity;
    }
}



function reverseDiff(oldDiffStopIndex, newDiffStopIndex, oldList, newList, identity) {
	var oldIndex = oldList.length - 1,
		newIndex =  newList.length - 1;

	while( oldIndex > oldDiffStopIndex && newIndex > newDiffStopIndex) {
		var oldItem = oldList[oldIndex],
			newItem = newList[newIndex];

		if( identity( oldItem, newItem ) ) {
			oldIndex--;
			newIndex--;
			continue;
		} else {
			// use newIndex because it reflects any deletions
			return [{
                type: "splice",
				index: newDiffStopIndex,
			 	deleteCount: (oldIndex-oldDiffStopIndex+1),
			 	insert: slice.call(newList, newDiffStopIndex,newIndex+1)
			}];
		}
	}
	// if we've reached of either the new or old list
	// we simply return
	return [{
        type: "splice",
		index: newDiffStopIndex,
		deleteCount: (oldIndex-oldDiffStopIndex+1),
		insert: slice.call(newList, newDiffStopIndex,newIndex+1)
	}];

}

/**
 * @module {function} can-util/js/diff/diff diff
 * @parent can-util/js
 * @signature `diff( oldList, newList, [identity] )`
 *
 * @param  {ArrayLike} oldList the array to diff from
 * @param  {ArrayLike} newList the array to diff to
 * @param  {function} identity an optional identity function for comparing elements
 * @return {Array}     a list of Patch objects representing the differences
 *
 * Returns the difference between two ArrayLike objects (that have nonnegative
 * integer keys and the `length` property) as an array of patch objects.
 *
 * A patch object returned by this function has the following properties:
 * - **index**:  the index of newList where the patch begins
 * - **deleteCount**: the number of items deleted from that index in newList
 * - **insert**: an Array of items newly inserted at that index in newList
 *
 * ```js
 * var diff = require("can-util/js/diff/diff");
 *
 * console.log(diff([1], [1, 2])); // -> [{index: 1, deleteCount: 0, insert: [2]}]
 * console.log(diff([1, 2], [1])); // -> [{index: 1, deleteCount: 1, insert: []}]
 *
 * // with an optional identity function:
 * diff(
 *     [{id:1},{id:2}],
 *     [{id:1},{id:3}],
 *     (a,b) => a.id === b.id
 * ); // -> [{index: 1, deleteCount: 1, insert: [{id:3}]}]
 * ```
 */

// TODO: update for a better type reference. E.g.:
//    @typdef {function(*,*)} can-util/diff/diff/typedefs.identity identify(a, b)
//
//    @param {*} a This is something.
//    @param {can-util/diff/diff/typedefs.identity} identity(a, b)
//    @option {*} a

module.exports = /*namespace.diff =*/ function(oldList, newList, schemaOrIdentity){
    var oldIndex = 0,
		newIndex =  0,
		oldLength = canReflect.size( oldList ),
		newLength = canReflect.size( newList ),
		patches = [];

    var schemaType = typeof schemaOrIdentity,
        identity;
    if(schemaType === "function") {
        identity = schemaOrIdentity;
    } else if(schemaOrIdentity != null) {
        if(schemaOrIdentity.type === "map") {
            identity = makeIdentityFromMapSchema(schemaOrIdentity);
        } else {
            identity = makeIdentityFromListSchema(schemaOrIdentity);
        }
    } else {
        identity = makeIdentity(oldList, oldLength);
    }



	while(oldIndex < oldLength && newIndex < newLength) {
		var oldItem = oldList[oldIndex],
			newItem = newList[newIndex];

		if( identity( oldItem, newItem ) ) {
			oldIndex++;
			newIndex++;
			continue;
		}
		// look for single insert, does the next newList item equal the current oldList.
		// 1 2 3
		// 1 2 4 3
		if(  newIndex+1 < newLength && identity( oldItem, newList[newIndex+1] ) ) {
			patches.push({index: newIndex, deleteCount: 0, insert: [ newList[newIndex] ], type: "splice"});
			oldIndex++;
			newIndex += 2;
			continue;
		}
		// look for single removal, does the next item in the oldList equal the current newList item.
		// 1 2 3
		// 1 3
		else if( oldIndex+1 < oldLength  && identity( oldList[oldIndex+1], newItem ) ) {
			patches.push({index: newIndex, deleteCount: 1, insert: [], type: "splice"});
			oldIndex += 2;
			newIndex++;
			continue;
		}
		// just clean up the rest and exit
		// 1 2 3
		// 1 2 5 6 7
		else {
			// iterate backwards to `newIndex`
			// "a", "b", "c", "d", "e"
			// "a", "x", "y", "z", "e"
			// -> {}
			patches.push.apply(patches, reverseDiff(oldIndex, newIndex , oldList, newList, identity) );


			return patches;
		}
	}
	if( (newIndex === newLength) && (oldIndex === oldLength) ) {
		return patches;
	}
	// a b
	// a b c d e
	patches.push(
				{type: "splice", index: newIndex,
				 deleteCount: oldLength-oldIndex,
				 insert: slice.call(newList, newIndex) } );

	return patches;
};




// a b c
// a d e b c
