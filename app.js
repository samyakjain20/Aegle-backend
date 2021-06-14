var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const nodemailer = require('nodemailer')
const { render } = require('ejs');
const mongoose = require('mongoose');
const Webinar = require('./models/webinar');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/imagesUploaded/');
  },
  filename: function(req, file, cb){
    cb(null, file.originalname);
  }
})
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
    cb( null,true);
  } else {
    cb( null, false);
  }
}
const upload = multer({storage: storage, fileFilter: fileFilter});

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(cors()); //inter enviornment 
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public',express.static( 'public'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//connect to mongoDb
const dbURI = 'mongodb+srv://admin_forum:adminforum@cluster0.w7lbe.mongodb.net/discussion?retryWrites=true&w=majority';
mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => console.log('connected to db'))
    .catch((err) => console.log(err));

//router
app.get('/', (req,res) => {
  res.redirect('/webinars');
});

app.get('/webinars', (req,res) => {
  Webinar.find().sort({createdAt: -1 })
    .then((result) => {
        res.render('webinars', {title: "All Webinars", webinars: result })
    })
    .catch((err) => {
        console.log(err);
    });
});

app.get('/createWeb', function(req, res, next) {
  res.render('createWeb', { title: 'Create Webinars' });
});

app.post('/createWeb', upload.single('image'), (req, res, next) => {
  const webinar= new Webinar({
    title: req.body.title,
    dateTime: req.body.dateTime,
    link: req.body.link,
    imagePath: req.file.path,
    description: req.body.description,
  });

  webinar.save()
    .then((result) => {
        res.redirect("/webinars");
    })
    .catch((err) => {
        console.log(err);
    });
});

//edit webinar get req
app.get('/editWeb/:id', (req,res) => {
  Webinar.findById(req.params.id)
  .then((result) => {
      res.render('editWeb', {webinar: result, title: "Editing Webinar"});
  })
})

//edit webinar post request 
app.post('/editWeb/:id', upload.single('image'), (req,res) => {

  Webinar.findByIdAndUpdate(req.params.id, { $set: {
    title : req.body.title,
    dateTime: req.body.dateTime,
    link: req.body.link,
    imagePath: req.file.path,
    description: req.body.description 
  }})
  .then((result) => {
    res.redirect('/webinars');
  })
})

app.delete('/webinar', (req, res) => {
    const id = req.body._id;
    console.log(id);
    Webinar.findByIdAndDelete(id)
    .then(result => {
      res.json({ redirect: '/webinars' });
    })
    .catch(err => {
      console.log(err);
    });
});

app.post('/contact', (req,res) =>{
  console.log(req.body)
  const tranporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'samyak.21810494@viit.ac.in',
        pass: ""
    }
  })
  const mailOptions = {
      from: 'samyak.21810494@viit.ac.in',
      to: req.body.email,
      subject: `Message from ${req.body.name}: ${req.body.subject}`,
      text: `Mail from ${req.body.email}. ${req.body.message}`
  }
  tranporter.sendMail(mailOptions, (error, info) => {
      if(error){
          console.log(error);
          res.send('error')
      }else{
          console.log('Email Sent: ' + info.response)
          res.send('success')
      }
  })

})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;