const x11 = require('x11');
const x11prop = require('x11-prop');

let x11GetStringProperties = (X, wid, properties, types, cb) => {
	let result = [];
	(function call(i) {
		if(i >= properties.length)
			cb(false, result);
		else
			x11prop.get_property(X, wid, properties[i], types[i], (err, value) => {
				if(err)
					cb(err, null);
				else {
					result.push(value[0]);
					call(i + 1);
				}
			});
	})(0);
};

x11.createClient(function(err, display) {
	let X = display.client;
	let rootWindow = display.screen[0].root;

	let getOpenWindows = (cb) => {
		X.QueryTree(rootWindow, (err, tree) => {
			if(err)
				console.log(err);

			let windows = {};
			let respond = () => {
				cb(Object.values(windows));
			}
			
			let i = 0;
			tree.children.forEach(wid => {
				++i;
				x11GetStringProperties(X, wid,
					["_NET_WM_PID", "_NET_WM_NAME"], 
					["CARDINAL", "UTF8_STRING"], (e, [pid, name]) => {
						if(e)
							console.log(e);
						else {
							if(name && pid) {
								if(!windows[pid])
									windows[pid] = {wid, pid, name};
								else if(windows[pid].name.length < name.length) {
									windows[pid].wid = wid;
									windows[pid].name = name;
								}
							}
						}
						if(--i == 0)
							respond();
					});
			});
			if(--i == 0)
				respond();
		});
	};

	getOpenWindows(d => {
		console.log(d);
		display.client.terminate();
	});

/*
	X.InternAtom(false, '_NET_WM_PID', function(err, pidAtom ) {
		X.ChangeWindowAttributes(display.screen[0].root, { eventMask: x11.eventMask.PropertyChange });
		X.on('event', function(ev) {
			if(ev.name == 'PropertyNotify') {
				X.GetAtomName(ev.atom, function(err, name) {
					if (name == '_NET_ACTIVE_WINDOW') {
						X.GetProperty(0, display.screen[0].root, ev.atom, X.atoms.WINDOW, 0, 4, function(err, prop) {
							var active = prop.data.readUInt32LE(0);
							X.GetProperty(0, active, pidAtom, X.atoms.CARDINAL, 0, 4, function(err, prop) {
								console.log(err);
								console.log('PID:', prop.data.readUInt32LE(0));
							});
						});
					}
				});
			}
		});
	});
	*/
});