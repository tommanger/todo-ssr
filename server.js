const express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");

const todoService = require("./services/todo.service");

const app = express();
const port = 3000;
const VIEW_DIR = `${__dirname}/views`;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
    secret: "puki muki",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

app.get("/puki", (req, res) => res.send("Hello Puki!"));
app.get("/muki", (req, res) => res.redirect("/puki"));

app.get("/", (req, res) => {
  var visitCount = req.cookies.visitCount || 0;
  visitCount++;
  res.cookie("visitCount", visitCount);
  const data = {
    captcha: todoService.makeCaptcha()
  };
  console.log('data',data)
  req.session.captchaSum = data.captcha.num1 + data.captcha.num2;
  res.render(`${VIEW_DIR}/index.ejs`, data);
});

app.get("/todo", (req, res) => {
  const nickname = req.session.nickname;
  if (!nickname) {
    res.redirect("/");
  }
  todoService.query(nickname).then(todos => {
    const data = {
      title: nickname + "Todos:",
      todos: todos
    };
    res.render(`${VIEW_DIR}/todos.ejs`, data);
  });
});

app.get("/todo/edit/:todoId?", (req, res) => {
  const todoId = req.params.todoId;
  if (todoId) {
    todoService.getById(todoId).then(todo => {
      res.render(`${VIEW_DIR}/todo-edit.ejs`, { todo });
    });
  } else {
    res.render(`${VIEW_DIR}/todo-edit.ejs`, { todo: {} });
  }
});

app.post("/todo/delete", (req, res) => {
  const { todoId } = req.body;

  todoService.remove(todoId).then(() => {
    res.redirect("/todo");
  });
});
app.post("/todo/add", (req, res) => {
  const todo = req.body;
  todo.nickname = req.session.nickname;
  todoService
    .add(todo)
    .then(todo => {
      res.redirect("/todo");
    })
    .catch(err => {
      console.log("ERRRRROR");
    });
});

app.post("/todo/update", (req, res) => {
  const todo = req.body;
  todo.nickname = req.session.nickname;
  todoService
    .update(todo)
    .then(todo => {
      res.redirect("/todo");
    })
    .catch(err => {
      console.log("ERRRRROR");
    });
});

app.get("/todo/:todoId", (req, res) => {
  const todoId = req.params.todoId;
  todoService
    .getById(todoId)
    .then(todo => {
      res.render(`${VIEW_DIR}/todo.ejs`, { todo });
    })
    .catch(err => {
      // res.redirect('/todo')
      res.send("BABA");
    });
});

app.post("/setUser", (req, res) => {
  req.session.nickname = req.body.nickname;
 
  if (!req.session.nickname || +req.session.captchaSum !== +req.body.sumUser) {
    res.redirect("/");
  } else {
    res.redirect("/todo");
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
