(function (document,io) {

    window.addEventListener('DOMContentLoaded', function () {
      //  messageForm switched to vanilla js for compatibility issue
      var messageForm = document.getElementById('messageForm');
      var message = $('#message');
      var loginArea = $('#loginArea');
      var userList = $('#userlist');
      var login = document.getElementById('login');
      var user;

      var socket = io('http://localhost:8888/');

      socket.emit('start game');


      // check login
      var returnCheckLogin = function() {

      var checkLogin = function() {
        var email = $('#email').val();
        if (email =='') {
          $('#blankUsername').show();
          setTimeout(function () {
              $('#blankUsername').hide();
          }, 4000);
          return false;
        }
        var username = $('#username').val();
        if (username =='') {
          $('#blankUsername').show();
          setTimeout(function () {
              $('#blankUsername').hide();
          }, 4000);
          return false;
        }
        else {
          $.getJSON( "/logincheck/"+ username, function( data ) {
             console.log(data);
            if (data.length == 0){
              console.log('username dispo');
              enterRoom();
            return true;
            };

            for (var i = 0; i < data.length; i++) {
              if (data[i].user.user.username == username & data[i].user.user.email != email) {
                console.log('Déja utilisé');
                $('#takenUsername').show();
                setTimeout(function () {
                  $('#takenUsername').hide();
                   }, 4000);
                return false;
              }else {
                if (data[i].user.user.username == username & data[i].user.user.email == email){
                    console.log('username ok with email');
                    enterRoom();
                return true;
               }
               return true;
            }
          }
          });
          // return true;
        }
      }
      return checkLogin();
    };


    var enterRoom = function () {
        var avatar = $('input[name=avatarOptions]:checked', '#login').val();
        var email = $('#email').val();
        var username = $('#username').val();
         user = {
          username: username,
          email:email,
          avatar:avatar,
          score:0
        }
        socket.emit('new user', user);
        loginArea.hide();
        $('#quiz').show();

    };


      // login form submit
      document.getElementById('login').addEventListener("submit", function(evt) {
        evt.preventDefault();
        returnCheckLogin();
        // if (returnCheckLogin()) {
        //   var avatar = $('input[name=avatarOptions]:checked', '#login').val();
        //   var email = $('#email').val();
        //   var username = $('#username').val();
        //    user = {
        //     username: username,
        //     email:email,
        //     avatar:avatar,
        //     score:0
        //   }
        //   socket.emit('new user', user);
        //   loginArea.hide();
        //   $('#quiz').show();
        // }

        // console.log(avatar,email,username);

      });




      // console.log(messageForm);
      messageForm.addEventListener("submit", function(e) {
        e.preventDefault();
        // console.log(message.val());
        if (message.val() === '') {
          console.log("can't send empty message");
        }else {
          socket.emit('send message',{
            message : message.val(),
            user: user
          });
          $('#chat')
          .prepend('<li class="animated zoomIn right clearfix"><span class="chat-img pull-right"><img src="/img/'+user.avatar+'.jpg" alt="User Avatar"></span></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font">'+user.username+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o"></i> '+ moment().hour()+':'+ moment().minute() +':'+ moment().second() +'</small></div><p>'+ message.val() +'</p></div></li>')

          message.val('');
          // console.log('submitted');

        }
      });

      socket.on('new message',function(data) {
          // console.log(data.message);
          $('#chat')
          .prepend('<li class="right clearfix"><span class="chat-img pull-right"><img src="/img/'+ data.user.avatar+'.jpg" alt="User Avatar"></span></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font">'+data.user.username+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o"></i> '+ moment().hour()+':'+ moment().minute() +':'+ moment().second() +'</small></div><p>'+ data.message +'</p></div></li>');
      });

      socket.on('get users',function(data) {
        // console.log('hello');
        userList.empty();
        // console.log(data[0].user);
        var html = '';
        for (var i = 0; i < data.length; i++) {
          html += '<li class="bounceInDown"><a href="#" class="clearfix"><img src="/img/'+data[i].user.avatar+'.jpg" alt="" class="img-circle"><div class="friend-name"><strong>'+data[i].user.username+'</strong></div><div class="last-message text-muted">'+ moment().hour()+':'+ moment().minute() +':'+ moment().second() +'</div><small class="time text-muted">Score</small><small class="chat-alert label label-danger" id="score">'+data[i].user.score+'</small></a></li>'
        }
        userList.prepend(html);

      });

      socket.on('new question',function(data){
        console.log('question:' + data.emoji);
        // console.log($('#emoji'));
        setTimeout(function () {
          $('#emoji').empty();
          $('#emoji').html(data.emoji);

        }, 5000);
      });

      socket.on('good reply',function(data){
        // console.log($('#emoji'));
        $('#emoji').empty();
        $('#emoji').html(data.reponse);

        $('#chat')
        .prepend('<li class="left clearfix"> <span class="chat-img pull-left"> <img src="/img/malo-asci.png" alt="User Avatar"> </span><div class="chat-body clearfix"><div class="header"> <strong class="primary-font">Bot 🤗</strong> <small class="pull-right text-muted"><i class="fa fa-clock-o"></i>'+ moment().hour()+':'+ moment().minute() +':'+ moment().second() +'</small></div><p>Bonne réponse de '+data.user.username+', la réponse etait : '+data.reponse+'</p></div></li>');

      });

      socket.on('bravo',function(data){
        // console.log('question:' + data);
        //  console.log($('#emoji'));
        $('#emoji').empty();
        $('#emoji').html(data.reponse);

        $('#chat')
        .prepend('<li class="left clearfix"> <span class="chat-img pull-left"> <img src="/img/malo-asci.png" alt="User Avatar"> </span><div class="chat-body clearfix"><div class="header"> <strong class="primary-font">Bot 🤗</strong> <small class="pull-right text-muted"><i class="fa fa-clock-o"></i>'+ moment().hour()+':'+ moment().minute() +':'+ moment().second() +'</small></div><p> Bravo '+data.user.username+' bonne réponse, Tu gagnes un point, la réponse etait : '+data.reponse+'</p></div></li>');
        socket.emit('next question');
      });

      socket.on('end game',function(data){
        // console.log(data);
        // console.log($('#emoji'));
          $('#emoji').empty();
          $('#emoji').html('fin du jeu');

          data.result.forEach(function(element) {
            // console.log(element);
            $('#results').empty();
            $('#results').append('<li>'+element.user.username+' : '+element.user.score+' points</li>')
          });

          // for (var i = 0; i < data.length; i++) {
          //   console.log('yo');
          //   console.log($('#results'));
          //
          // }

          $('#ResultModal').modal('show');
          setTimeout(function () {
            socket.emit('restart');
            socket.emit('start game');
            $('#ResultModal').modal('hide');
          }, 6000);
      });


      // tooltip
      $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();
      });



    });
})(document,io);
