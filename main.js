const net = require('net');
const robot = require("robotjs");
const readline = require('readline');
const shellEscape = (() => {
	let se = require('shell-escape');
	return (u) => se([u]);
})();
const { exec }  = require('child_process');
const x11 = require('x11');

x11.createClient(function(err, display) {
	let X = display.client;
	console.log(display.screen);
	let gl = display.screen[0].root;

	X.QueryTree(gl, function(err, tree) {
        console.log(tree); //output all windows tree
    });
});

robot.setMouseDelay(0);

let features = {
	moveRelative: (mx, my) => {
		let {x, y} = robot.getMousePos();
		robot.moveMouse(x + +mx, y + +my);
	},
	scroll: (horizontal, vertical) => {
		robot.scrollMouse(horizontal, vertical);
	},
	click: (button) => {
		robot.mouseClick(button);
	},
	toggle: (down) => {
		robot.mouseToggle(down);
	},
	key: (key) => {
		robot.keyTap(key);
	},
	googleChrome: (url) => {
		exec("export DISPLAY=:0.0; google-chrome --app="+shellEscape(url));
	}
}

let server = net.createServer((socket) => {
	socket.setNoDelay(true);
	socket.on("error", (ignored)=> {});
	let interface = readline.createInterface(socket, socket);
	interface.on("line", (line) => {
		if(!line.trim())
			return;
		let args = line.split(" ").map(a => a.trim());
		let feature = features[args[0]];
		if(feature)
			socket.write(feature(...args.slice(1)) || "");
		else
			console.log(args[0] + "was not a feature");
		socket.write("\n");
	})
});
server.on("error", (error) => {
	console.error(error);
})

server.listen(3563);