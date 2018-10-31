var socket = io.connect(
	"https://unitalk.now.sh/",
	{ transports: ["websocket", "polling", "flashsocket"] }
);

var message = document.getElementById("message");
var handle = document.getElementById("handle");
var send = document.getElementById("send");
var output = document.getElementById("output");
var chat = document.getElementById("chat-window");
var typing = document.getElementById("typing");
var numusers = document.getElementById("num-users");
var setidbtn = document.getElementById("set-id");
var userlist = document.getElementById("list-items");
var start = document.getElementById("start-chat");
var authenticated = false;
message.disabled = true;
send.disabled = true;

var clients = [];

var mystats = {
	username: "",
	ischatting: false,
	to: "",
	id: ""
};

var validateName = (arr, name) => {
	for (i = 0; i < arr.length; i++) {
		if (arr[i].username == name) {
			return false;
		}
	}
	return true;
};

function arraySanitize(arr) {
	return arr.filter(function(ele) {
		return !ele.ischatting;
	});
}

function arrayRemove(arr, id) {
	return arr.filter(function(ele) {
		return ele.id != id;
	});
}

var selectRandom = arr => {
	var randopick = arraySanitize(arrayRemove(arr, mystats.id));
	return (pickedUser = randopick[Math.floor(Math.random() * randopick.length)]);
};

var getCount = arr => {
	var count = 0;
	arr.forEach(arr => {
		if (!arr.ischatting) {
			count += 1;
		}
	});
	return count;
};

var updateData = pickeduser => {
	socket.emit("update user", { mystats, pickeduser });
};

socket.on("connect", () => {
	mystats.id = socket.id;
});

socket.on("users list", data => {
	clients = data;
	if (!mystats.ischatting && mystats.to == "") {
		clients.forEach(client => {
			if (client.id == mystats.id) {
				mystats.to = client.to;
				mystats.ischatting = client.ischatting;
			}
		});
	}
	if (mystats.ischatting) {
		message.disabled = false;
		send.disabled = false;
		start.disabled = true;
		play();
		output.innerHTML +=
			'<div class = "greet-bot message-blob message-item-mine"> <p class = "z-depth-2 card-panel my-message"><strong class = "recipient me">' +
			"UniBot 🤖" +
			"   </strong>" +
			"You are connected to <b>" +
			mystats.to +
			"</b>" +
			"</p></div>";
	}
	userlist.innerHTML = "";
	clients.forEach(client => {
		userlist.innerHTML += client.username + "<br>";
	});
});

setidbtn.addEventListener("click", () => {
	if (handle.value != "") {
		if (validateName(clients, handle.value)) {
			console.log(handle.value);
			mystats.username = handle.value;
			setidbtn.disabled = true;
			handle.disabled = true;
			socket.emit("new user", mystats);
		} else {
			output.innerHTML +=
				'<div class = "greet-bot message-blob message-item-mine"> <p class = "z-depth-2 card-panel my-message"><strong class = "recipient me">' +
				"UniBot 🤖" +
				"   </strong>" +
				"A user has already taken this name, if you are finding hard to choose a name, <b>Just mash the keyboard</b>" +
				"</p></div>";
		}
	} else {
		play();
		output.innerHTML +=
			'<div class = "greet-bot message-blob message-item-mine"> <p class = "z-depth-2 card-panel my-message"><strong class = "recipient me">' +
			"UniBot 🤖" +
			"   </strong>" +
			"Please Enter a valid handle!" +
			"</p></div>";
	}
});

start.addEventListener("click", () => {
	console.log("before: ", clients);
	if (getCount(clients) >= 2) {
		updateData(selectRandom(clients));
		send.disabled = false;
		console.log(clients);
	} else {
		play();
		output.innerHTML +=
			'<div class = "greet-bot message-blob message-item-mine"> <p class = "z-depth-2 card-panel my-message"><strong class = "recipient me">' +
			"UniBot 🤖" +
			"   </strong>" +
			"Please wait until altleast server has atmost 2 people... 🕒 \n<em>pssst...call in your friends" +
			"</p></div>";
	}
	start.disabled = true;
});

message.addEventListener("keyup", function(event) {
	event.preventDefault();
	if (event.keyCode === 13) {
		send.click();
	}
});

send.addEventListener("click", () => {
	if (message.value == "") {
		message.value = "<i>~nudge~</i>";
	}
	socket.emit("chat", {
		username: mystats.username,
		message: '<div class = "message-text">' + message.value + "</div>",
		to: mystats.to
	});
	message.value = "";
	message.focus();
	message.select();
});

function play() {
	var audio = document.getElementById("audio");
	audio.play();
}

socket.on("chat", data => {
	console.log(data);
	if (mystats.to == data.to || mystats.username == data.to) {
		if (data.username == mystats.username) {
			output.innerHTML +=
				'<div class = "message-blob message-item-mine">\
				<div class = "z-depth-2 card-panel my-message">\
				<strong class="recipient me" > ' +
				mystats.username +
				"   </strong>" +
				data.message +
				"</div></div>";
		} else if (data.to == mystats.username) {
			play();
			output.innerHTML +=
				'<div class = "message-blob message-item-other">\
				<div class = "z-depth-2 card-panel other-message">\
				<strong class = "recipient other">' +
				data.username +
				"   </strong>" +
				data.message +
				"</div></div>";
		}
	}
	$("#chat-window").animate(
		{
			scrollTop: chat.scrollHeight - chat.clientHeight
		},
		200
	);
});

numusers.innerHTML =
	"there's no user online Now, Maybe call your friends and have a game, \
						this game randomly pairs up two of you without telling who's paired";
socket.on("users count", data => {
	numusers.innerHTML = "<strong> There are " + data + " user(s) online...";
});

$(document).ready(function() {
	output.innerHTML +=
		'<div class = "greet-bot message-blob message-item-mine"> <p class = "z-depth-2 card-panel my-message"><strong class = "recipient me">' +
		"UniBot 🤖" +
		"   </strong>" +
		"Hi, I'm <i>UniBot</i> 🤖 \n Welcome to <b>UniTalk</b>, \nA place where people chat with other people without knowing about each other.\
					To get started, \n1. Enter a name(it should not reveal that is you)\n \
									2. Press <b>Set</b>. \n 3. Press <b>Start</b> if you wait to start chatting \n  4. Once you are connected, the Send button will be enabled \n 5. Have Fun 💖 \n \
									Thank you for your patience 😄" +
		"</p></div>";
});
