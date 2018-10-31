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
var sockets = [];
io.on("connection", socket => {
	sockets.push(socket);
	//console.log(socket);
	console.log("socket connected at: " + socket.id);
	socket.on("chat", data => {
		io.sockets.emit("chat", data);
		//console.log(data);
	});
	socket.on("new user", data => {
		users.push(data);
		console.log(users);
		io.sockets.emit("users list", users);
		io.sockets.emit("users count", users.length);
	});
	socket.on("disconnect", function() {
		var i = sockets.indexOf(socket);
		users.forEach(user => {
			if (user.id == socket.id) {
				users.splice(users.indexOf(user), 1);
				console.log(user.username + " disconnected");
			}
		});
		io.sockets.emit("users list", users);
		sockets.splice(i, 1);
	});
	socket.on("update user", data => {
		users.forEach(user => {
			if (user.id == data.mystats.id) {
				user.ischatting = true;
				user.to = data.pickeduser.username;
			}
			if (user.id == data.pickeduser.id) {
				user.ischatting = true;
				user.to = data.mystats.username;
			}
		});
		io.sockets.emit("users list", users);
	});
});
