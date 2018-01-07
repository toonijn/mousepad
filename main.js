const net = require('net');
const robot = require("robotjs");
const readline = require('readline');
const shellEscape = (() => {
	let se = require('shell-escape');
	return (u) => se([u]);
})();
const { exec }  = require('child_process');
const x11 = require('x11');
const x11prop = require('x11-prop');

robot.setMouseDelay(0);


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

	let features = {
		moveRelative: ([mx, my]) => {
			let {x, y} = robot.getMousePos();
			robot.moveMouse(x + +mx, y + +my);
		},
		scroll: ([horizontal, vertical]) => {
			robot.scrollMouse(horizontal, vertical);
		},
		click: ([button]) => {
			robot.mouseClick(button);
		},
		toggle: ([down]) => {
			robot.mouseToggle(down);
		},
		key: ([key]) => {
			robot.keyTap(key);
		},
		googleChrome: ([url]) => {
			exec("export DISPLAY=:0.0; google-chrome --app="+shellEscape(url));
		},
		getOpenWindows: (_, cb) => {
			x11prop.get_property(X, rootWindow, "_NET_CLIENT_LIST", "WINDOW", (err, data) => {
				if(err)
					console.log(err);

				let windows = [];
				let respond = () => {
					cb(JSON.stringify(windows));
				}

				let i = 1;
				data.forEach(wid => {
					++i;
					x11GetStringProperties(X, wid,
						["_NET_WM_PID", "_NET_WM_NAME", "_NET_WM_WINDOW_TYPE"], 
						["CARDINAL", "UTF8_STRING", "ATOM"], (e, res) => {
							if(e)
								console.log(e);
							else if(res[2] != 385) {
								let [pid, name, type] = res;
								windows.push({wid, pid, name, type});
							}
							if(--i == 0)
								respond();
						});
				});
				if(--i == 0)
					respond();
			});
		},
		closeWindow: (wid) => {
			exec("wmctrl -ic " + wid);
		},
		focusWindow: (wid) => {
			X.RaiseWindow(+wid);
			X.SetInputFocus(+wid);
		}
	};

	features.getOpenWindows("", (w) => {
		console.log(w);
	});

	let server = net.createServer((socket) => {
		socket.setNoDelay(true);
		socket.on("error", (ignored)=> {});
		let interface = readline.createInterface(socket, socket);
		interface.on("line", (line) => {
			if(!line.trim())
				return;
			let args = line.split(" ").map(a => a.trim());
			let feature = features[args[0]];
			console.log(args);
			if(feature)
				feature(args.slice(1), (r) => {
					socket.write(r);
				});
			else
				console.log(args[0] + " was not a feature");
		})
	});
	server.on("error", (error) => {
		console.error(error);
	})

	server.listen(3563);
});