local function req(path,method,body,cb) PerformHttpRequest(Config.ApiBase..path,function(code,data) if cb then cb(code,data) end end,method,body and json.encode(body) or '',{['Content-Type']='application/json',['x-neonrp-bridge-secret']=Config.BridgeSecret}) end
local function run(a)
 local id=tonumber(a.playerId);local valid=id and GetPlayerName(id);local status='IGNORED'
 if a.action=='ANNOUNCE' then TriggerClientEvent('chat:addMessage',-1,{args={'^5NEONRP',tostring(a.message or '')}});status='EXECUTED'
 elseif a.action=='KICK' and valid then DropPlayer(id,'NEONRP | '..(a.reason or 'Decyzja administracji'));status='EXECUTED'
 elseif a.action=='WARN' and valid then TriggerClientEvent('chat:addMessage',id,{args={'^1OSTRZEŻENIE',tostring(a.reason or '')}});status='EXECUTED'
 elseif a.action=='BAN' and valid then DropPlayer(id,'NEONRP BAN (DEMO) | '..(a.reason or 'Decyzja administracji'));status='DEMO_ONLY_NOT_PERSISTENT'
 elseif a.action=='UNBAN' then status='NEEDS_PERSISTENT_BAN_DATABASE' end
 req('/bridge/ack','POST',{id=a.id,status=status})
end
CreateThread(function() print('^5[NEONRP]^7 Bridge started');while true do req('/bridge/actions','GET',nil,function(code,data) if code==200 and data then local ok,d=pcall(json.decode,data);if ok then for _,a in ipairs(d.actions or {}) do run(a) end end end end);Wait((Config.PollSeconds or 10)*1000) end end)
