//підключаєм express і створюємо app
var express = require('express');
var app = express();
//підключаєм модуль body-parser і інтегруєм в express
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var cookieParser = require('cookie-parser')();
app.use(cookieParser);
//задаєм папку для статичного контенту
app.use(express.static(__dirname));

var session = require('cookie-session')({
    keys: ['secret'],
    maxAge: 2 * 60 * 60 * 1000
});
app.use(session);

var ChatUser = require('./chatuser');

//підключаємо passport-local для автентифікації, створюємо екземпляр passport-local та реалізуємо логіку автентифікації
var LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session()); // all you need is this fix

passport.use(new LocalStrategy(
    function (username, password, done) {
        ChatUser.find({ username: username, password: password },
            function (err, data) {
                console.log("data:");
                console.log(data);
                if (data.length)
                    return done(null, { id: data[0]._id, username: data[0].username });
                    return done(null, false);
            })
    }));

//записуємо дані в сесію і користувач авторизується
passport.serializeUser(function (user, done) {
    console.log("serialize user:");
    console.log(user);
    done(null, user);
});

//десереалізація
passport.deserializeUser(function (id, done) {
    console.log("deserialize user:");
    console.log(id);
    ChatUser.find({ _id: id.id },
        function (err, data) {
            console.log(data);
            if (data.length == 1)
                done(null, { username: data[0].username });
        });
});

//реалізація запуску автентифікації та створення middleware функції для перевірки чи користувач залогінений
var auth = passport.authenticate(
    'local', {
        successRedirect: '/',
        failureRedirect: '/login'
    });

var myAuth = function (req, res, next) {
    if (req.isAuthenticated()) {
        console.log('is auth');
        next();
    }
    else {
        console.log('is not auth');
        res.redirect('/login');
    }
}


//перевірка чи user автентифікований
app.get('/', myAuth);
//опрацювання кореневого шляху
app.get('/', function (req, res) {
    //console.log("req.user:");
    console.log("req.user:");
    console.log(req.user);
    console.log("req.session:");
    console.log(req.session);
    res.sendFile(__dirname + '/chat.html');
})

app.post('/login', auth);


app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/login.html');
})

app.get('/register', function (req, res) {
    res.sendFile(__dirname + '/register.html');
})

app.post('/register', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    var user = new ChatUser();

    user.username = username;
    user.password = password;

    user.save(function (err, data) {
        if (err) console.log(err.message);
        console.log(data);
        res.redirect('/');
    })
})

// підключаємо модуль сокет іо та налаштовуємо сервер
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//прив'язуємо сокет до сесії
io.use(function (socket, next) {
    var req = socket.handshake;
    var res = {};
    cookieParser(req, res, function (err) {
        if (err) return next(err);
        session(req, res, next);
    });
});
 
//слухаємо подію 'joinclient' на сервері
var users = [];
io.on('connection', function (socket) {

    var user = socket.handshake.session.passport.user.username;
    var pos = users.indexOf(user);
    if (pos == -1) users.push(user);
 
    socket.on('joinclient', function (data) {
        console.log(data);
        console.log('client joined!');
        console.log("socket-clients:");
        console.log(Object.keys(io.sockets.sockets));
        socket.emit('joinserver',  { message: 'Hi ' + user + '!' });
        socket.broadcast.emit('joinserver', { message: user + ' joined to chat!' });
    });
//////////////

    socket.on('chatmessage', function (data) {
        console.log(data);
        io.sockets.emit('chatmessage',  { message: data, sender: user });
    });

    socket.on('disconnect', function() {
        socket.emit('leftserver',  { message: 'Bye, ' + user + '!' });
        socket.broadcast.emit('leftserver', { message: user + ' left chat :(' });
     });

});

server.listen(8080);