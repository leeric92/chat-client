var express    = require('express')
var app        = express()
var http = require('http')
var server = http.Server(app);
var bodyParser = require('body-parser')
var shortid = require('shortid')
var fs = require('fs')
var io = require('socket.io')(server)

io.on("connect", function(server){
	console.log("user connected");
});

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var port = process.env.PORT || 8080

var router = express.Router()
var router2 = express.Router()

// Unsafely enable cors
router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})

// logging middleware
router.use(function(req, res, next) {
	console.log('\nReceived:',{url: req.originalUrl, body: req.body, query: req.query})
	next()
})

// Simple in memory database
const database = [
	{ name: 'Tea Chats', id: 0, users: ['Ryan','Nick', 'Danielle'], messages: [{name: 'Ryan', message: 'ayyyyy', id: 'gg35545', reaction: null},{name: 'Nick', message: 'lmao', id: 'yy35578', reaction: null}, {name: 'Danielle', message: 'leggooooo', id: 'hh9843', reaction: null}]},
	{ name: 'Coffee Chats', id: 1, users: ['Jessye'], messages: [{name: 'Jessye', message: 'ayy', id: 'ff35278', reaction: null}]},
	{ name: 'Cake Talks', id: 2, users: ['Adam'], messages: [{name: 'Mike', message: 'hello', id: '923js', reaction: null}]},
	{ name: 'Random Talks', id: 3, users: ['Jason'], messages: [{name: 'Luke', message: 'hi there', id: '282bj', reaction: null}]},
	{ name: 'Dog Photos', id: 3, users: ['Helen'], messages: [{name: 'Helen', message: 'Dog is cute', id: '282bj', reaction: null}]}
];


// Utility functions
const findRoom = (roomId) => {
	const room = database.find((room) => {
		return room.id === parseInt(roomId)
	})
	if (room === undefined){
		return {error: `a room with id ${roomId} does not exist`}
	}
	return room
}

const findRoomIndex = (roomId) => {
	const roomIndex = database.findIndex((room) => {
		return room.id === parseInt(roomId)
	})
	return roomIndex
}

const findMessageIndex = (room, messageId) => {
	const messageIndex = room.messages.findIndex((message) => {
		return message.id === messageId
	})
	return messageIndex
}

const logUser = (room, username) => {
	const userNotLogged = !room.users.find((user) => {
		return user === username
	})

	if (userNotLogged) {
		room.users.push(username)
	}
}

// Web files
router2.get('/', function(req, res) {
	fs.readFile('./public/index.html', function(err, html){
		if(err) throw err;
		res.writeHeader(200, {"Content-Type": "text/html"});
		res.write(html);
		res.end();
	});
});

// API Routes
router.get('/rooms', function(req, res) {
	const rooms = database.map((room) => {
		return {name: room.name, id: room.id}
	})
	console.log('Response:',rooms)
	res.json(rooms)
})

router.get('/rooms/:roomId', function(req, res) {
	room = findRoom(req.params.roomId)
	if (room.error) {
		console.log('Response:',room)
		res.json(room)
	} else {
		console.log('Response:',{name: room.name, id: room.id, users: room.users})
		res.json({name: room.name, id: room.id, users: room.users})
	}
})

router.route('/rooms/:roomId/messages')
	.get(function(req, res) {
		room = findRoom(req.params.roomId)
		if (room.error) {
			console.log('Response:',room)
			res.json(room)
		} else {
			console.log('Response:',room.messages)
			res.json(room.messages)
		}
	})
	.post(function(req, res) {
		room = findRoom(req.params.roomId)
		if (room.error) {
			console.log('Response:',room)
			res.json(room)
		} else if (!req.body.name || !req.body.message) {
			console.log('Response:',{error: 'request missing name or message'})
			res.json({error: 'request missing name or message'})
		} else {
			io.emit('messages updated');
			io.emit('user joined');
			logUser(room, req.body.name)
			const reaction = req.body.reaction || null
			room.messages.push({name: req.body.name, message: req.body.message, id: shortid.generate(), reaction})
			console.log('Response:',{message: 'OK!'})
			res.json({message: 'OK!'})
		}
	})

app.use('/api', router)
server.listen(port)
console.log(`API running at localhost:${port}/api`)