require("dotenv").config();
const exp = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require('axios');
const cheerio = require('cheerio');

const app = exp();
app.use(exp.urlencoded({extended: true}));
app.use(exp.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/chatDB");

const userSchema = new mongoose.Schema({
    username: String,
    mail: String,
    passHash: String
});

const msgSchema = new mongoose.Schema({
    username: String,
    usermail: String,
    msg: String,
    file: String,
    fileName: String,
    time: Date,
    fileType: String,
    link: String
});

const User = new mongoose.model("User", userSchema);
const Msg = new mongoose.model("Msg", msgSchema);

// middle-ware to authenticate users
function authenticate(req,res,next){
         
    const authHeader = req.headers['authorization']; // or req.headers['Authorization']

    // bearer token is sent in the folloeing format - Bearer <token>
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null){
        res.send({success: false});
    }else{
        jwt.verify( token, process.env.JWT_SECRET_KEY, function(err,user){
            if(err) res.send({success: false});
            else{
                req.user = user;
                next();
            }
        });
    }

}

const server = require('http').createServer(app);

const io = require('socket.io')(server,{
    cors:{
        origin: 'http://localhost:3000',
        credentials: true,
        methods: ["GET","POST"]
    }
});

io.on("connection", socket => {
    socket.on("msg", (token, msgObj) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err,user) => {
            if(err) return;

            user = user._doc;
            const newMsg = new Msg({
                username: user.username,
                usermail: user.mail,
                msg: msgObj.text,
                time: msgObj.date,
                fileName: msgObj.fileName,
                file: msgObj.file,
                fileType: msgObj.fileType,
                link: msgObj.link
            });
            newMsg.save();
            io.emit("new_msg", newMsg);
        })
    })
})

app.post("/register", (req,res) => {
    const { username, mail, password } = req.body;

    User.findOne({mail: mail})
        .then((user) => {
        if(user) res.send({success: false, err: 1});
        else{
            bcrypt.hash(password,10, function(err,hash){
                if(err){
                  res.send(err);
                }else{
                    const newUser = new User({
                        username: username,
                        mail: mail,
                        passHash: hash
                    });
                    newUser.save();
                    res.send({success: true});
                }
            });
        }
    })
    .catch(err => (res.send({success: false, err: 0})));
});

app.post("/login", (req,res) => {
    const { mail, password } = req.body;

    User.findOne( { mail: mail })
        .then((user) => {
            if(user && bcrypt.compareSync(password,user.passHash)){
                const token = jwt.sign({...user}, process.env.JWT_SECRET_KEY, { expiresIn: '20d'});
                res.send({success: true,token,data: {username: user.name, mail: mail}});
            }else res.send({success: false, err: 1});
        })
        .catch(err => {
            res.send({success: false, err: 0})
        });
});

app.get('/get_messages', authenticate, async (req,res) => {
    const user = req.user;

    const msgList = await Msg.find()
    .sort({_id: -1})
    .limit(100);

    res.send({success: true, msgs: msgList.reverse()});
});

app.get("/fetch-data", async (req,res) => {
    const url = req.query.url;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const metaTags = $('meta');

        const linkTitle = metaTags.filter((_, tag) => tag.attribs.property === 'og:title').attr('content') || $('title').text();
        const linkDescription = metaTags.filter((_, tag) => tag.attribs.property === 'og:description').attr('content') || '';
        const linkImage = metaTags.filter((_, tag) => tag.attribs.property === 'og:image').attr('content') || '';

        res.send({ title: linkTitle, description: linkDescription, image: linkImage });
    } catch (error) {
        res.sendStatus(500);
    }
});

app.get('/get-users', async (req,res) => {
    const users = await User.find({});
    const usernames = users.map(user => user.username);
    res.send(usernames);
})

server.listen(4000, () => {
    console.log("Server is listening on port 4000");
});