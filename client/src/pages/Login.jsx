import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../styles/login.css';

export default function Login(){

    const [cookies,setCookies] = useCookies();
    const navigate = useNavigate();

    const [mail,setMail] = useState("");
    const [pass,setPass] = useState("");
    const [name,setName] = useState("");
    const [msg,setMsg] = useState("");
    const [signUp,setSignUp] = useState(false);


    useEffect(() => {
      if(cookies.token) navigate("/");
    },[]);

    function handleSign(login){
      if(mail === "" || pass === ""){
        if(mail === "") setMsg("Enter mail id!!");
        else setMsg("Enter password!!");

        setTimeout(() => setMsg(""), 4000);
        return;
      }

      if(login){
        // login
        axios.post('http://localhost:4000/login', {
          mail: mail,
          password: pass
        }).then(res => {
          res = res.data;
          if(!res.success){
            if(res.err === 1) setMsg("Enter valid credentials!!");
            else setMsg("Please try again!!");
            setTimeout(() => setMsg(""), 4000);
          }else{
            setCookies('token', res.token);
            setCookies('userData',res.data);
            navigate("/");
          }
        }).catch(err => console.log(err));
      }else{
        // sign
        setSignUp(true);
      }
    }

    function register(){
      axios.post('http://localhost:4000/register', {
        username: name,
        mail: mail,
        password: pass
      })
      .then(res => {
        res = res.data;
        if(!res.success){
          if(res.err === 1) setMsg("Verify if the account already exists!");
          else setMsg("Please try again!!");

          setTimeout(() => setMsg(""), 4000);
        }else{
          setMsg("Successfully created an account!");
          setName("");
          setPass("");
          setMail("");
          setMsg("");
          setTimeout(() => {
            setSignUp(false);          
          }, 4000);
        }
        console.log(res,"response");
      })
      .catch(err => console.log(err));
    }

    return (
        <>
          {!signUp && <div className="signDiv">
                        <img src="/pics/logo.png" className="logoImg"/>
                        <input type="text" placeholder="mail id" className="loginUserInput" value={mail} onChange = {(evt) => setMail(evt.target.value)} />
                        <input type="password" placeholder="enter password" className="loginPass" value = {pass} onChange = {(evt) => setPass(evt.target.value)}/>
                        <div>
                          <button className="loginBtn" onClick={() => handleSign(true)}>Login</button>
                          <button className="loginBtn" onClick={() => handleSign(false)}>Sign-up</button>
                        </div>
                      </div>
          }
          {signUp && <div className='usDiv'>
                          <input type="text" name="username" placeholder="username..." className="loginUserInput" value={name} onChange={(evt) => setName(evt.target.value)} />
                          <button className="loginBtn" onClick={register}>Sign-up</button>
                     </div>
          }
          <div className="bgLayer" style={ { backgroundImage: "url(/pics/doodleBg.jpg)" }}></div>
          {msg !== "" && <div className='msgDiv'>
                              <span>{msg}</span>
                              <i className="fi fi-rr-cross-circle" onClick={() => setMsg("")}></i>
                         </div>
          }
        </>        
    )
}