require("dotenv").config();
const express=require("express"), session=require("express-session"), helmet=require("helmet"), axios=require("axios"), crypto=require("crypto"), path=require("path");
const app=express(), PORT=process.env.PORT||3000, API="https://discord.com/api/v10";
app.use(helmet({contentSecurityPolicy:false})); app.use(express.json({limit:"32kb"}));
app.use(session({name:"neonrp.sid",secret:process.env.SESSION_SECRET||"change-me",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:28800000}}));
app.use(express.static(path.join(__dirname,"public")));
const roles=(process.env.ADMIN_ROLE_IDS||"").split(",").map(x=>x.trim()).filter(Boolean), logs=[], queue=[]; let seq=1;
const login=(q,s,n)=>q.session.user?n():s.status(401).json({error:"Zaloguj się przez Discord."});
const admin=(q,s,n)=>!q.session.user?s.status(401).json({error:"Zaloguj się."}):!q.session.isAdmin?s.status(403).json({error:"Brak roli administratora."}):n();
const txt=(v,m=500)=>typeof v==="string"&&v.trim().length>0&&v.length<=m;
function log(actor,action,target,detail,status){logs.unshift({at:new Date().toISOString(),actor,action,target,detail,status});if(logs.length>300)logs.pop();}
app.get("/auth/discord",(q,s)=>{const state=crypto.randomBytes(24).toString("hex");q.session.oauthState=state;const p=new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID||"",redirect_uri:process.env.DISCORD_REDIRECT_URI||"",response_type:"code",scope:"identify guilds.members.read",state});s.redirect("https://discord.com/oauth2/authorize?"+p)});
app.get("/auth/discord/callback",async(q,s)=>{try{if(!q.query.code||q.query.state!==q.session.oauthState)return s.status(400).send("Nieprawidłowy OAuth state.");delete q.session.oauthState;const t=await axios.post(API+"/oauth2/token",new URLSearchParams({client_id:process.env.DISCORD_CLIENT_ID,client_secret:process.env.DISCORD_CLIENT_SECRET,grant_type:"authorization_code",code:q.query.code,redirect_uri:process.env.DISCORD_REDIRECT_URI}),{headers:{"Content-Type":"application/x-www-form-urlencoded"}});const h={Authorization:"Bearer "+t.data.access_token},u=(await axios.get(API+"/users/@me",{headers:h})).data;let rs=[];try{const m=(await axios.get(API+"/users/@me/guilds/"+process.env.DISCORD_GUILD_ID+"/member",{headers:h})).data;rs=m.roles||[]}catch{}q.session.user={id:u.id,username:u.username,global_name:u.global_name,avatar:u.avatar};q.session.isAdmin=roles.some(r=>rs.includes(r));s.redirect("/#panel")}catch(e){console.error(e.response?.data||e.message);s.status(500).send("Błąd logowania Discord. Sprawdź .env.")}});
app.post("/auth/logout",(q,s)=>q.session.destroy(()=>s.json({ok:true})));
app.get("/api/me",(q,s)=>s.json({user:q.session.user||null,isAdmin:!!q.session.isAdmin}));
app.get("/api/player/profile",login,(q,s)=>s.json({discord:q.session.user,character:null,message:"Dane postaci wymagają podłączenia bazy/frameworku FiveM."}));
app.post("/api/player/tickets",login,(q,s)=>{let {subject,message}=q.body||{};if(!txt(subject,100)||!txt(message,2000))return s.status(400).json({error:"Uzupełnij temat i treść."});log(q.session.user.username,"PLAYER_TICKET",q.session.user.id,subject,"DEMO — pamięć");s.status(202).json({ok:true,message:"Zgłoszenie przyjęte demonstracyjnie; dodaj bazę danych, aby je utrwalać."})});
app.get("/api/admin/overview",admin,(q,s)=>s.json({server:"NEONRP",status:"OCZEKUJE NA MOST FIVEM",queued:queue.length}));
app.get("/api/admin/players",admin,(q,s)=>s.json({players:[],message:"Lista graczy wymaga integracji framework/baza."}));
app.get("/api/admin/logs",admin,(q,s)=>s.json({logs:logs.slice(0,100)}));
app.post("/api/admin/actions",admin,(q,s)=>{const {action,playerId,reason,message}=q.body||{};if(!["BAN","KICK","WARN","UNBAN","ANNOUNCE"].includes(action))return s.status(400).json({error:"Nieznana akcja."});if(action==="ANNOUNCE"?!txt(message,500):!txt(String(playerId||""),64))return s.status(400).json({error:"Podaj cel lub treść ogłoszenia."});if(!["ANNOUNCE","UNBAN"].includes(action)&&!txt(reason,300))return s.status(400).json({error:"Podaj powód."});const a={id:String(seq++),action,playerId:playerId||null,reason:reason||"",message:message||"",actor:q.session.user.username};queue.push(a);log(a.actor,action,a.playerId||"ALL",a.reason||a.message,"QUEUED");s.status(202).json({ok:true,actionId:a.id,status:"QUEUED"})});
function bridge(q,s,n){const e=process.env.NEONRP_BRIDGE_SECRET||"",v=q.get("x-neonrp-bridge-secret")||"";if(!e||v!==e)return s.status(403).json({error:"Bridge auth failed"});n()}
app.get("/bridge/actions",bridge,(q,s)=>s.json({actions:queue.splice(0,20)}));
app.post("/bridge/ack",bridge,(q,s)=>{log("FiveM Bridge","ACK",q.body?.id,"",q.body?.status||"UNKNOWN");s.json({ok:true})});
app.listen(PORT,()=>console.log("NEONRP: http://localhost:"+PORT));
