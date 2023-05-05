import { useState, useEffect, useRef } from 'react';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';
import {io} from "socket.io-client";
import axios from 'axios';
import {marked} from 'marked';
import EmojiPicker from 'emoji-picker-react';
import Fuse from "fuse.js";

import Message from '../components/Message';

import '../styles/home.css';

export default function Home(){

    const [cookies,setCookies,removeCookies] = useCookies();
    const [msgs, setMsgs] = useState([]);
    const [chat, setChat] = useState("");
    const [file,setFile] = useState("");
    const scrollDiv = useRef(null);
    const navigate = useNavigate();
    const [socket,setSocket] = useState(null);
    const [link,setLink] = useState(false);
    const [emojDiv,setEmojDiv] = useState(false);
    const [users,setUsers] = useState([]);
    const [showMent,setShowMent] = useState(false);
    const [ments, setMents] = useState([]);
    const [fuse,setFuse] = useState(null);
    const linkRef = useRef(null);

    const [textStyle,setTextStyle] = useState([0,0,0]);
    const ts = ['**','_','~~'];
    const bold = useRef(null);
    const italic = useRef(null);
    const st = useRef(null);

    useEffect(() => {
        if(!cookies.token) navigate("/login");

        axios.get('http://localhost:4000/get_messages',{
            headers: {
                'Authorization': `Basic ${cookies.token}` 
            }
        }).then(res => {
            res = res.data;
            setMsgs(res.msgs);
        });

        axios.get('http://localhost:4000/get-users')
        .then(res => {
            res = res.data;
            setUsers(res);
        });

        setSocket(io("http://localhost:4000"));
        
    },[]);

    useEffect(() => {
        if(!socket) return;

        socket.on("new_msg", (msgObj) => {
            setMsgs( (prev) => [...prev,msgObj]);
        });

    },[socket]);

    useEffect(() => {
        setFuse(new Fuse(users));
    },[users]);

    useEffect(() => {
        if(scrollDiv.current) scrollDiv.current.scrollIntoView({behavior: 'smooth'});
    },[msgs]);

    function sendMsg(){
        if(chat === "") return;
        let msgObj = {date: new Date()}

        let msg = chat;

        for(let i = 0; i < 3; i++) if(textStyle[i] === 1) msg += ts[i];

        if(!link) msgObj.text = marked(msg);
        else msgObj.link = chat;
        socket.emit("msg", cookies.token, msgObj);

        bold.current.style.color = "white";
        italic.current.style.color = "white";
        st.current.style.color = "white";
        
        console.log(marked(msg));

        setTextStyle([0,0,0]);
        setChat("");
        setLink(false);
        setEmojDiv(false);
        if(linkRef) linkRef.current.style.color = "white";
    }

    function fileUpload(evt){
        const file = evt.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        const fileName = file.name;

        reader.onload = () => {
            socket.emit("msg", cookies.token, {date: new Date(), text: "", fileName: fileName, file: file, fileType: file.type});
        }
    }

    function activateLink(evt){
        if(!link) evt.target.style.color = "black";
        else evt.target.style.color = "white";

        setLink((prev) => !prev);
    }

    function scroll(){
        if(scrollDiv.current) scrollDiv.current.scrollIntoView({behavior: 'smooth'});
    }

    function emojiClick(emObj,evt){
        // console.log(emObj,evt);
        setChat(prev => (prev + emObj.emoji))
    }

    function fuzzySearch(query){
        if(query === '') {
            setMents([]);
            return;
        }
        const res = fuse.search(query);
        setMents(res.map(usr => usr.item));
    }

    function mentionUser(evt){
        setChat(prev => (prev + ' @' + evt.target.innerHTML));
        setMents([]);
        setShowMent(false);
    }

    function textFormat(ind, evt){
        // evt.target.color = "grey";
        setChat(prev => (prev + ts[ind]));

        if(textStyle[ind] == 0) evt.target.style.color = "black";
        else evt.target.style.color = "white";

        setTextStyle(prev => {
            return [
                ...prev.slice(0,ind),
                (prev[ind]+1)%2,
                ...prev.slice(ind+1)
            ]
        })
    }

    function logout(){
        removeCookies('token');
        navigate("/login")
    }

    return (
        <>
            <div className='msgContainer'>
                 <h1>radius <i className="fi fi-sr-sign-out-alt" onClick={logout}></i></h1>
                 <div className='msgList'>
                    {msgs.map((msg,ind) => {
                        let prev = "";
                        if(ind !== 0) prev = msgs[ind-1].username;
                        return <Message msgObj={msg} prev={prev} key={msg._id} scroll = {scroll}/>
                    })}
                    <div className='dummy' ref={scrollDiv}></div>
                 </div>
                 <div className='sendDiv'>
                      <div className='optionsDiv'>
                           <div>
                            <i className="fi fi-br-bold" onClick = {(evt) => textFormat(0,evt)} ref = {bold}></i>
                            <i className="fi fi-br-italic" onClick = {(evt) => textFormat(1,evt)} ref = {italic}></i>
                            <i className="fi fi-br-text-slash" onClick = {(evt) => textFormat(2,evt)} ref = {st}></i>
                           </div>
                           <div>
                            <i className="fi fi-br-link-alt" onClick={(evt) => activateLink(evt)} ref={linkRef}></i>
                           </div>
                           <div>
                            <i className="fi fi-br-list"></i>
                            <i className="fi fi-sr-circle-1"></i>
                           </div>
                           <div>
                            <i className="fi fi-br-symbol"></i>
                           </div>
                           <div>
                            <i className="fi fi-rr-code-simple"></i>
                            <i className="fi fi-rr-file-code"></i>
                           </div>
                      </div>
                      <textarea className='chatText' placeholder='Chat comes here...' value = {chat} onChange={(evt) => setChat(evt.target.value)}>
                      </textarea>
                      <div className='lowerDiv'>
                        <div>
                          <input type="file" id="file" onChange = {(evt) => fileUpload(evt)} hidden/>
                          <label htmlFor="file">
                            <i className="fi fi-sr-add"></i>
                          </label>
                        </div>
                        <div>
                          <i className="fi fi-rr-smile" onClick={() => setEmojDiv(prev => !prev)}></i>
                          <i className="fi fi-br-at" onClick={() => setShowMent(prev => !prev)}></i>
                        </div>
                      </div>
                      <i className="fi fi-ss-paper-plane-top" onClick={sendMsg}></i>
                 </div>
            </div>
            {emojDiv && <EmojiPicker onEmojiClick={emojiClick}/> }
            {showMent && 
            <div className='mentions'>
                 <input type="text" name="user" onChange={(evt) => fuzzySearch(evt.target.value)}/>
                 {ments.map(ment => <p key={ment} onClick={(evt) => mentionUser(evt)}>{ment}</p>)}
            </div>}
            <div className="bgLayer bg" style={ { backgroundImage: "url(/pics/doodleBg.jpg)" }}></div>
        </>
    )
}