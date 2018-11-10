var mysql = require("mysql");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var isOnline = require('is-online');


app.get('/', function(req, res){
res.sendFile(__dirname + '/public/index.html');
});
app.get('/dodaj', function (req, res) {
  res.sendFile(__dirname + '/public/dodaj.html');
})
app.get('/zarejestruj', function (req, res) {
  res.sendFile(__dirname + '/public/zarejestruj.html');
})
app.get('/zaloguj', function (req, res) {
  res.sendFile(__dirname + '/public/zaloguj.html');
})
app.get('/post', function (req, res) {
  res.sendFile(__dirname + '/public/post.html');
})
app.get('/logo', function (req, res) {
  res.sendFile(__dirname + '/public/img/logo.png');
})
app.get('/style', function (req, res) {
  res.sendFile(__dirname + '/public/css/style.css');
})
app.get('/js', function (req, res) {
  res.sendFile(__dirname + '/public/js/all.js');
})

http.listen(5000, function(){
  console.log('listening on *:3000');
});
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "cieszy"
});
socketCount =[];
io.on('connection', function (socket) {

  isOnline().then(online => {
    console.log(online +"ile online jest");
    //=> true
});
   	socketCount++;
    io.emit("onlinePlayers", {online:socketCount});
    socket.emit("authLogin", );
    socket.on("authLogout",function(){
      socket.emit("authLogin");
    });


    console.log(socketCount);

    con.query('SELECT * FROM posts',function(err,rows){
      if(err) throw err;
      socket.emit('showrows', rows);
    });

	socket.on("dodajPost", function(data){
	var title = data.title;
	var description = data.description;
    var author = data.author;
    var date = data.date;
    con.query('INSERT INTO posts (author, title, description, created) VALUES ("'+ author +'","'+title+'","'+description+'","'+date+'")',function(err,rows){
      if(err) throw err;
		console.log('Nowy Post!' + author + date);
		con.query('SELECT * FROM posts',function(err,rows){
		   if(err) throw err;
				socket.emit('showrows', rows);
	    });
    });
});

	socket.on('rejestracja', function(data){

		var nickname = data.nickname;
		var email = data.email;
		var password = data.password;
		var data = data.data;
	con.query('INSERT INTO users (nickname, email, password, created) VALUES ("'+nickname+'","'+email+'","'+password+'","'+data+'")',function(err,rows){
      if(err) throw err;
		console.log('Nowy użytkownik! - ' + nickname);
    });
});

	socket.on('zaloguj', function(data){

		var nickname = data.nickname;
		var password = data.password;
	  var auth = con.query('SELECT COUNT(*) as total FROM users WHERE nickname="' + nickname + '" AND password="'+password+'"',function(err,rows){
      if(err) throw err;
	  var logged = rows[0].total;
      if (logged > 0) {
		  console.log("SUCCES");
			socket.emit("loginSuccess", {nickname:nickname});
		  }
		  else{
			socket.emit("loginFailed");
		  }
    });
	});

    socket.on('requestPost', function(data){
    var id = data.id;
    con.query('SELECT * FROM posts WHERE id="'+id+'"',function(err,rows){
      if(err) throw err;
      socket.emit('showPost', rows);
    });

    });



	socket.on('addComment', function(data){
		var id = data.id;
		var content = data.content;
		var author = data.author;
		var data = data.date;
			con.query('INSERT INTO comments (author, post_id, content, created) VALUES ("'+author+'","'+id+'","'+content+'","'+data+'")',function(err,rows){
      if(err) throw err;
		console.log('Nowy komentarz! - ' + content);

    });
	});
	  // Pobieranie komentarzy po ID posta
		socket.on('getComments', function(data){
      var commentid = data.id;
		con.query('SELECT * FROM comments WHERE post_id = "'+commentid+'" ',function(err,rows){
      if(err) throw err;
      // Wysłanie listy komentarzy przypisanych dla danego posta
      io.emit('showComments', rows);
    });
		});
    socket.on('getSubComments', function(data){
      var commentid = data.id;
    con.query('SELECT * FROM subcomments WHERE comment_id = "'+commentid+'" ',function(err,rows){
      if(err) throw err;
      // Wysłanie listy komentarzy przypisanych dla danego posta
      io.emit('showSubComments', rows);
    });
    });



	 socket.on('disconnect', function () {
     socketCount--;
     io.emit("onlinePlayers", {online:socketCount});
	    console.log(socketCount);
  });

  // Cala procedura dodawania like
  socket.on('SprawdzamyKtoryLike', function(data){
	  var id = data.id;
	  var author = data.author;
	  console.log(id);
	  var auth = con.query('SELECT COUNT(*) as total FROM likes WHERE post_id="' + id + '" AND author="'+author+'"',function(err,rows){
      if(err) throw err;
	  var CheckLike = rows[0].total;
      if (CheckLike > 0) {
		    console.log("Like był już dany, a więc usuwamy");
			// Jesli like już jest, usuwamy go i wyswietlamy na stronie
		 			con.query('DELETE FROM likes WHERE post_id = "'+id+'" AND author="'+author+'"',function(err,rows){
					if(err) throw err;
					var auth = con.query('SELECT COUNT(*) as total FROM likes WHERE post_id="' + id + '"',function(err,rows){
					if(err) throw err;
					var logged = rows[0].total;
						io.emit('dodajemyLike', {id:id, likes:logged});
				});
			});
		  }
		  else{
			// Jeśli like dla danego postu nie był dany, dodajemy i wyswietlamy
					con.query('INSERT INTO likes (post_id, author) VALUES ("'+id+'","'+author+'")',function(err,rows){
					if(err) throw err;
					var auth = con.query('SELECT COUNT(*) as total FROM likes WHERE post_id="' + id + '"',function(err,rows){
					if(err) throw err;
					var logged = rows[0].total;
					if (logged > 0) {
							io.emit('dodajemyLike', {id:id, likes:logged});
				}
			});
		});
	}
  });
 });
 // Dodawanie i usuwanie DISLIKE
  socket.on('SprawdzamyKtoryDisLike', function(data){
	  var id = data.id;
	  var author = data.author;
	  console.log(id);
	  var auth = con.query('SELECT COUNT(*) as total FROM dislikes WHERE post_id="' + id + '" AND author="'+author+'"',function(err,rows){
      if(err) throw err;
	  var CheckLike = rows[0].total;
      if (CheckLike > 0) {
		    console.log("Like był już dany, a więc usuwamy");
			// Jesli like już jest, usuwamy go i wyswietlamy na stronie
		 			con.query('DELETE FROM dislikes WHERE post_id = "'+id+'" AND author="'+author+'"',function(err,rows){
					if(err) throw err;
					var auth = con.query('SELECT COUNT(*) as total FROM dislikes WHERE post_id="' + id + '"',function(err,rows){
					if(err) throw err;
					var logged = rows[0].total;
						io.emit('dodajemyDisLike', {id:id, likes:logged});
				});
			});
		  }
		  else{
			// Jeśli like dla danego postu nie był dany, dodajemy i wyswietlamy
					con.query('INSERT INTO dislikes (post_id, author) VALUES ("'+id+'","'+author+'")',function(err,rows){
					if(err) throw err;
					var auth = con.query('SELECT COUNT(*) as total FROM dislikes WHERE post_id="' + id + '"',function(err,rows){
					if(err) throw err;
					var logged = rows[0].total;
					if (logged > 0) {
							io.emit('dodajemyDisLike', {id:id, likes:logged});
				}
			});
		});
	}
  });
 });
  // Potrzebne do wyswietlenia Like oraz Dislike
  socket.on('LikeUpPlus', function(data){
	  con.query('SELECT * FROM posts',function(err,rows){
      if(err) throw err;
      io.emit('showLikes', rows);
	  io.emit('showDisLikes', rows);
    });
	  });
// Wyswietlamy Like
  socket.on('displayLikes', function(data){
	  var id = data.id;
	    var auth = con.query('SELECT COUNT(*) as total FROM likes WHERE post_id="' + id + '"',function(err,rows){
      if(err) throw err;
	  var logged = rows[0].total;
      if (logged > 0) {
			io.emit('DodajemyLike', {likes:logged, id:id});

			}
    });
  });
// Wyswietlamy DisLike
   socket.on('displayDisLikes', function(data){
	  var id = data.id;
	    var auth = con.query('SELECT COUNT(*) as total FROM dislikes WHERE post_id="' + id + '"',function(err,rows){
      if(err) throw err;
	  var logged = rows[0].total;
      if (logged > 0) {
			io.emit('DodajemyDisLike', {likes:logged, id:id});

			}
    });
  });

//Sprawdzamy podczas dodawania LIKE czy był DISLIKe, jesli tak usuwamy go
	  socket.on('UsuwamyDisLike', function(data){
	  var id = data.id;
	  var author = data.author;
	  console.log("ADSSAD");
	  var auth = con.query('SELECT COUNT(*) as total FROM dislikes WHERE post_id="' + id + '" AND author="'+author+'"',function(err,rows){
      if(err) throw err;
	  var CheckLike = rows[0].total;
      if (CheckLike > 0) {
		    console.log("Wyjebalo");
			// Jesli like już jest, usuwamy go i wyswietlamy na stronie
		 			con.query('DELETE FROM dislikes WHERE post_id = "'+id+'" AND author="'+author+'"',function(err,rows){
					if(err) throw err;
					var auth = con.query('SELECT COUNT(*) as total FROM dislikes WHERE post_id="' + id + '"',function(err,rows){
					if(err) throw err;
					var logged = rows[0].total;
						io.emit('DodajemyDisLike', {id:id, likes:logged});
				});
			});
		  }
  });
 });
  // Sprawdzamy podczas dodawania DisLike czy jest Like, jesli tak to usuwamy
  socket.on('UsuwamyLike', function(data){
	  var id = data.id;
	  var author = data.author;
	  console.log("ADSSAD");
	  var auth = con.query('SELECT COUNT(*) as total FROM likes WHERE post_id="' + id + '" AND author="'+author+'"',function(err,rows){
      if(err) throw err;
	  var CheckLike = rows[0].total;
      if (CheckLike > 0) {
			// Jesli like już jest, usuwamy go i wyswietlamy na stronie
		 			con.query('DELETE FROM likes WHERE post_id = "'+id+'" AND author="'+author+'"',function(err,rows){
					if(err) throw err;
					var auth = con.query('SELECT COUNT(*) as total FROM likes WHERE post_id="' + id + '"',function(err,rows){
					if(err) throw err;
					var logged = rows[0].total;
						io.emit('DodajemyLike', {id:id, likes:logged});
				});
			});
		  }
  });
 });

// Walidacja rejestracji

socket.on("CheckLogin", function(data){
  var nickname = data.nickname;
  var email = data.email;
  var password = data.password;
  var data = data.data;
  con.query('SELECT COUNT(*) as ValidateLogin FROM users WHERE nickname="'+nickname+'"',function(err,rows){
    var Validate = rows[0].ValidateLogin;
      if (Validate > 0) {
        socket.emit("ZajetyLogin");
      }else{
        console.log("login"+nickname + " " + password);
       socket.emit("WolnyLogin", {nickname:nickname, password:password, email:email, data:data});
      }
  });

});
socket.on("CheckEmail", function(data){
  var nickname = data.nickname;
  var email = data.email;
  var password = data.password;
  var data = data.data;
  con.query('SELECT COUNT(*) as ValidateEmail FROM users WHERE email="'+email+'"',function(err,rows){
    var ValidateEmail = rows[0].ValidateEmail;
      if (ValidateEmail > 0) {
        socket.emit("ZajetyEmail");
      }else{
       socket.emit("WolnyEmail", {nickname:nickname, password:password, email:email, data:data});
      }
  });

});

  });
