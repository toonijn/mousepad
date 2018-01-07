const x11 = require('x11');
const x11prop = require('x11-prop');

const atoms = {
	_NET_WM_WINDOW_TYPE_DESKTOP: 488,
	_NET_WM_WINDOW_TYPE_NORMAL: 358
}

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
		x11prop.get_property(X, rootWindow, "_NET_CLIENT_LIST", "WINDOW", (err, data) => {
			if(err)
				console.log(err);

			console.log(data);
			let windows = [];
			let respond = () => {
				cb(windows);
			}
			
			let i = 1;
			data.forEach(wid => {
				++i;
				x11GetStringProperties(X, wid,
					["_NET_WM_PID", "_NET_WM_NAME", "_NET_WM_WINDOW_TYPE"], 
					["CARDINAL", "UTF8_STRING", "ATOM"], (e, [pid, name, type]) => {
						if(e)
							console.log(e);
						else {
							windows.push({wid, pid, name, type});
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
});