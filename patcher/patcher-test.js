var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var DefineList = require("can-define/list/list");
var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");
var Patcher = require("./patcher");
var queues = require("can-queues");
var QUnit = require('steal-qunit');
var SimpleObservable = require("can-simple-observable");

QUnit.module("can-diff/patcher",{
	setup: function(){
		this.fixture = document.getElementById("qunit-fixture");
	}
});


QUnit.test('multiple lists can be updated at once', 2, function () {
	var list = new DefineList(["a","b"]);
	var p1 = new Patcher(list),
		p2 = new Patcher(list);

	p1[canSymbol.for("can.onPatches")](function(){
		QUnit.ok(true, "called p1");
	});
	p2[canSymbol.for("can.onPatches")](function(){
		QUnit.ok(true, "called p2");
	});

	list.push("c");
});

QUnit.test('undefined value won\'t error', 1, function () {
	var undfinedObservable = new SimpleObservable(undefined);
	var pu = new Patcher(undfinedObservable);

	pu[canSymbol.for("can.onPatches")](function(){
		QUnit.ok(true, "called pu");
	});

	undfinedObservable.set("a");
});

QUnit.test("Tears down stuff", function(){
	var trigger = new SimpleObservable(0);
	var innerTrigger = new SimpleObservable(1);
	//domPatcher = function(patcher) {
	//
	//}
	var innerCalls = 0;
	var patcherCalls = 0;

	var liveHTML = function(observation){
		var stopTrap = observation.trapBindings();
		canReflect.onValue(observation, function(v){});
		var bindings = stopTrap();
		ObservationRecorder.addBindings(bindings);
	};

	var foos = new DefineList([{}, {}]);

	var outer = new Observation(function(){
		trigger.get();

		var foosPatcher = new Patcher(foos);

		var stopTrap = foosPatcher.trapPatchBindings();

		// trap bind and assign to containing observation, but we are binding on a patcher
		canReflect.onPatches(foosPatcher, function(){
			//foosPatcher.setAsTrapTarget();
			patcherCalls++;

			var inner = new Observation(function(){
				innerCalls++;
				var val = innerTrigger.get();
				return val;
			});

			// trap bind & assign to containing observation, but in this case, it's the PATCHER!?!
			liveHTML(inner);
		}, "notify");

		var bindings = stopTrap();
		ObservationRecorder.addBindings(bindings);
	});

	canReflect.onValue(outer, function(){});

	queues.batch.start();
	trigger.set(1);
	innerTrigger.set(2);
	queues.batch.stop();

	foos.push({});

	//QUnit.equal(innerCalls, 1, "inner only called once");
	QUnit.equal(patcherCalls, 1);
});
