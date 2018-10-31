const express = require("express");
const socket = require("socket.io");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");

var connectedClients;
var users = [];
const app = express();
app.set("port", process.env.PORT || 3000);

app.use(express.static("public"));

app.use(cookieParser());
app.use(session({ secret: "Shh, its a secret!" }));

app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true
	})
);

var server = app.listen(app.get("port"), () => {
	console.log("App started at " + app.get("port"));
});

var io = socket(server);

io.on("connection", socket => {
	console.log("socket connected at: " + socket.id);
	socket.on("chat", data => {
		io.sockets.emit("chat", data);
		//console.log(data);
	});
	socket.on("typing", data => {
		socket.broadcast.emit("typing", data);
	});
	socket.on("disconnect", function() {
		console.log(socket.id + " Got disconnected!");

		var i = users.indexOf(socket);
		users.splice(i, 1);
	});
	socket.on("new user", data => {
		users.push(data);
		//console.log(users);
		io.emit("users list", users);
		io.emit("join", connectedClients);
	});
	socket.on("new user notification", data => {
		socket.broadcast.emit("new user notification", data);
	});
	socket.on("connect user", data => {
		console.log(data);
		data.pickedUser.to = data.myinfo.username;
		data.pickedUser.ischatting = true;
		data.myinfo.to = data.pickedUser.username;
		data.myinfo.ischatting = true;
		//console.log(data);
		//console.log(users);
		users.forEach(user => {
			if (user.username == data.pickedUser.username) {
				user.to = data.pickedUser.to;
				user.ischatting = true;
			}
			if (user.username == data.myinfo.username) {
				user.to = data.myinfo.to;
				user.ischatting = true;
			}
		});
		io.sockets.emit("connect user", data);
	});
	io.emit("users list", users);
	connectedClients = Object.keys(io.sockets.connected).length;
	console.log(users);
});
