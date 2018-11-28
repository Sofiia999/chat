$(document).ready(function () {

    var $chatContainer = $('.chat-container');
    var $chatInput = $('.js-chat-input');
    var $chatButton = $('.js-chat-button');

    // під'єднуємось до сервера - створюєм новий сокет
    var socket = io.connect('http://localhost:8080');
    // відправляємо повідомлення про під'єднання нового користувача
    socket.emit('joinclient', "client is connected!");

    socket.on('joinserver', function (data) {
        console.log(data);
        var text = '<p> <span class="message--admin">Server: </span>' + data.message + '<p>';
        $chatContainer.append(text);
    })

    socket.on('leftserver', function (data) {
        console.log(data);
        var text = '<p> <span class="message--admin">Server: </span>' + data.message + '<p>';
        $chatContainer.append(text);
    })

    socket.on('chatmessage', function (data) {
        console.log(data);
        var text = '<p> <span>' + data.sender + ': </span>' + data.message + '<p>';
        $chatContainer.append(text);

    })

    $chatButton.click(function () {
        var text = $chatInput.val();

        if (text == '' || text == undefined)
            return;

        console.log(text);
        socket.emit('chatmessage', text);

        $chatInput.val('');
    });
});