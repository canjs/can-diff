'use strict';

var canReflect = require('can-reflect');

function defaultIdentity(a, b){
	return a === b;
}


/**
 * @module {function} can-util/js/diff-object/diff-object diff-object
 * @parent can-util/js
 * @signature `diffObject(oldObject, newObject)`
 *
 * @param {Object} oldObject the object to diff from
 * @param {Object} newObject the object to diff to
 * @return {Array} an array of object-patch objects
 *
 * Find the differences between two objects, based on properties and values
 *
 * The object-patch object format has the following keys:
 * - **property**: the property key on the new object
 * - **type**:     the type of operation on this property: add, remove, or set
 * - **value**:    the new value (if type is "add" or "set")
 *
 * ```js
 * var diffObject = require("can-util/js/diff-object/diff-object");
 *
 * console.log(diffObject({a: 1, b: 2}, {b: 3, c: 4})); // ->
 *   [{property: "a", type: "remove"},
 *    {property: "b", type: "set": value: 3},
 *    {property: "c", type: "add", "value": 4}]
 * ```
 */

module.exports = function(oldObject, newObject){
	var oldObjectClone,
		patches = [];



	// clone oldObject so properties can be deleted
	oldObjectClone = canReflect.assignMap({}, oldObject);

    canReflect.eachKey(newObject, function(value, newProp){
        // look for added properties
        if (!oldObject || !oldObject.hasOwnProperty(newProp)) {
            patches.push({
                key: newProp,
                type: 'add',
                value: value
            });
        // look for changed properties
        } else if (newObject[newProp] !== oldObject[newProp]) {
            patches.push({
                key: newProp,
                type: 'set',
                value: value
            });
        }

        // delete properties found in newObject
        // so we can find removed properties
        delete oldObjectClone[newProp];
    });

	// loop over removed properties
	for (var oldProp in oldObjectClone) {
		patches.push({
			key: oldProp,
			type: 'delete'
		});
	}

	return patches;
};
