var socket = io.connect("http://localhost:3000");

var message = document.getElementById("message");
var handle = document.getElementById("handle");
var send = document.getElementById("send");
var output = document.getElementById("output");
var chat = document.getElementById("chat-window");
var typing = document.getElementById("typing");
var numusers = document.getElementById("num-users");
var setidbtn = document.getElementById("set-id");
var userlist = document.getElementById("list-items");
var mystats = {
	username: "",
	ischatting: false,
	to: ""
};

var clients = [];
var authenticated = false;
send.disabled = true;
message.disabled = true;

$(document).ready(function() {
	M.toast({
		html:
			'Please enter Your name and select "SET", let it not be your real name ;)',
		classes: "rounded"
	});
});

function validateID(username) {
	return clients.some(function(client) {
		return client.username === username;
	});
}

userlist.innerHTML = "";
clients.forEach(client => {
	userlist.innerHTML += client + "<br>";
});

socket.on("new user notification", data => {
	var toastHTML = "<span>" + data + " has joined</span>";
	M.toast({ html: toastHTML, classes: "rounded" });
});

socket.on("users list", data => {
	clients = data;
	userlist.innerHTML = "";
	clients.forEach(client => {
		userlist.innerHTML += client.username + "<br>";
	});
});

setidbtn.addEventListener("click", () => {
	const myid = handle.value;
	M.toast({
		html: "Please wait for atleast 2 users to connect!",
		classes: "rounded"
	});
	if (!validateID(myid) && myid != "") {
		authenticated = true;
		mystats.username = myid;
		socket.emit("new user", { username: myid, ischatting: false, to: "" });
		socket.emit("new user notification", myid);
		//handle.value = 'Hi! ' + myid + ', You can chat with strangers now!';
		var randopick = arraySanitize(arrayRemove(clients, handle.value));
		if (randopick.length >= 1) {
			handle.disabled = true;
			setidbtn.disabled = true;
			send.disabled = false;
			message.disabled = false;
			selectRandom(randopick);
		} else {
			handle.disabled = true;
			setidbtn.disabled = true;
			send.disabled = true;
			message.disabled = true;
		}
	} else {
		alert(
			"err:\nplease choose a proper handle / A user has already selected this handle, please select another..."
		);
	}
});

message.addEventListener("keyup", function(event) {
	event.preventDefault();
	if (event.keyCode === 13) {
		send.click();
	}
});

message.addEventListener("keypress", function() {
	//socket.emit('typing', { handle: handle.value, message: message.value });
	//if (authenticated) {
	socket.emit("typing", { handle: handle.value });
	//}
});

send.addEventListener("click", () => {
	//if (authenticated) {
	if (message.value == "") {
		message.value = "<i>~nudge~</i>";
	}
	socket.emit("chat", {
		handle: handle.value,
		message: message.value,
		to: mystats.to
	});
	//}
	message.value = "";
	message.focus();
	message.select();
});

socket.on("chat", data => {
	typing.innerHTML = "";
	console.log(data.to, data.handle);
	if (data.to == handle.value || data.handle == handle.value) {
		message.disabled = false;
		send.disabled = false;
		if (data.handle == handle.value) {
			output.innerHTML +=
				'<div class = "message-item-mine"> <p class = "z-depth-2 card-panel my-message"><strong class = "recipient me">' +
				data.handle +
				"   </strong>" +
				data.message +
				"</p></div>";
		} else {
			output.innerHTML +=
				'<div class = "message-item-other"><p class = "z-depth-2 card-panel other-message"><strong class = "recipient other">' +
				data.handle +
				"   </strong>" +
				data.message +
				"</p></div>";
		}
	}
	$("#chat-window").animate(
		{
			scrollTop: chat.scrollHeight - chat.clientHeight
		},
		200
	);
});

/*
socket.on("typing", data => {
	typing.innerHTML = "<p><i> " + data.handle + " is typing ... </i></p>";
});*/
numusers.innerHTML =
	"there's no user online Now, Maybe call your friends and have a game, \
						this game pairs up two of you without telling who's paired";
socket.on("join", data => {
	numusers.innerHTML = "<strong> There are " + data + " user(s) online";
});

function arrayRemove(arr, value) {
	return arr.filter(function(ele) {
		return ele.username != value;
	});
}

function arraySanitize(arr) {
	return arr.filter(function(ele) {
		return !ele.ischatting;
	});
}

var selectRandom = randopick => {
	if (randopick.length != 0) {
		var pickedUser = randopick[Math.floor(Math.random() * randopick.length)];
		var myinfo = { username: handle.value, ischatting: false, to: "" };
		socket.emit("connect user", { pickedUser, myinfo });
		clients.forEach(client => {
			if (client.username == pickedUser.username) {
				client.to = pickedUser.to;
			}
			if (client.userlist == myinfo.username) {
				client.to = myinfo.to;
			}
		});
	} else {
		alert("wait please");
	}
};

var connectionData;
socket.on("connect user", data => {
	console.log(data);
	if (authenticated) {
		connectionData = data;
		mystats.ischatting = data.myinfo.ischatting;
		if (data.pickedUser.username != mystats.username) {
			mystats.to = data.myinfo.to;
			clients.forEach(client => {
				if (client.username == mystats.username) {
					client.ischatting = true;
					client.to = mystats.to;
				}
				if (client.username == data.pickedUser.username) {
					client.to = data.myinfo.username;
					client.ischatting = true;
				}
			});
			//send.click();
			M.toast({
				html: 'You are now connected to "' + mystats.to + '"',
				classes: "rounded"
			});
		} else {
			mystats.to = data.pickedUser.to;
			clients.forEach(client => {
				if (client.username == mystats.username) {
					client.ischatting = true;
					client.to = mystats.to;
				}
				if (client.username == mystats.to) {
					client.to = mystats.username;
					client.ischatting = true;
				}
			});
			M.toast({
				html:
					'You are now connected to "' +
					mystats.to +
					'", Please wait for them to respond',
				classes: "rounded"
			});
		}
	}
});
