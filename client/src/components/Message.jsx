import { useState,useEffect } from "react";
import { useCookies } from "react-cookie";
import axios from 'axios';

import "../styles/message.css";

export default function Message(props){

    let styles = {};
    let s = {};
    let bs = {};
    let ds = {};
    const [cookies,setCookies] = useCookies();
    const [linkData,setLinkData] = useState(null);
    var parser = new DOMParser();

    useEffect(() => {

        async function fetchData(){
            if(props.msgObj.link){
                let res = await axios.get('http://localhost:4000/fetch-data',{
                    params: {
                        url: props.msgObj.link
                    }
                })
                
                props.scroll();
                res = res.data;
                if(res.description.length > 120) res.description = res.description.substr(0,120) + "...";
                setLinkData(res);
            }
        }

        fetchData();
    },[]);


    if(cookies.userData.mail === props.msgObj.usermail){
        styles = {
            // alignSelf: "last baseline"
            marginLeft: "auto"
        }
        s = {
            backgroundColor: "#654E92",
            borderRadius: "5px",
            borderTopRightRadius: "0"
        }
        bs = {
            borderColor: "#47356a"
        }
    }

    function downloadLink(){
        // console.log(`data:${props.msgObj.fileType};base64,`);
        return (
            <a download={props.msgObj.fileName} href={`data:${props.msgObj.fileType};base64,${props.msgObj.file}`}><i className="fi fi-sr-inbox-in"></i></a>
        )
    }


    return (
        <div style = {styles} className="msgCont">
            {props.prev !== props.msgObj.username && <div className="userInfo">
                <div className="userTitle">{props.msgObj.username.toUpperCase().charAt(0)}</div>
                <p>{props.msgObj.username}</p>
                <p className="msgTime">{new Date(props.msgObj.time).toLocaleTimeString()}</p>
            </div>}
            {props.msgObj.msg && 
                <div className="msgContent" style = {s} dangerouslySetInnerHTML={{ __html: parser.parseFromString(props.msgObj.msg, 'text/html').body.innerHTML }}>
                </div>
            }
            {
                props.msgObj.file &&
                <div className="fileDiv msgContent" style = {{...s,...bs}} >{props.msgObj.fileName}{downloadLink()}</div>
            }
            {
                linkData && 
                <div className="linkDiv msgContent" style={s}>
                    <div>
                        <img src = {linkData.image} title={linkData.title} />
                        <p>{linkData.description.substr(0,150)}</p>
                    </div>
                    <a href={props.msgObj.link} target="_blank">{props.msgObj.link.substr(12,100)}</a>
                </div>
            }
            {
                !linkData && props.msgObj.link &&
                <div className="linkDiv msgContent" style={s}>
                <a href={props.msgObj.link} target="_blank">{props.msgObj.link.substr(12,100)}</a>
                </div>
            }

        </div>
    )
}