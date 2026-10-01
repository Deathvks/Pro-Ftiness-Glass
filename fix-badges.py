import sys
import re

with open('frontend/src/components/TrainerChats.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the push and email rendering block inside renderStep
pattern = re.compile(r'<div className="flex items-center gap-3 mt-2">\s*<div.*?<div.*?</div>\s*</div>', re.DOTALL)

new_block = '''<div className="flex items-center gap-3 mt-2">
  {(() => {
    const pushStatus = botModalClient.botReminders?.find(m => m.bot_reminder_level === stepLevel)?.bot_push_status || (botModalClient.lastMessage?.bot_reminder_level === stepLevel ? botModalClient.lastMessage?.bot_push_status : null) || 'error';
    const emailStatus = botModalClient.botReminders?.find(m => m.bot_reminder_level === stepLevel)?.bot_email_status || (botModalClient.lastMessage?.bot_reminder_level === stepLevel ? botModalClient.lastMessage?.bot_email_status : null) || 'error';
    
    const isPushOk = pushStatus === 'ok' || pushStatus === 'manual_ok';
    const isEmailOk = emailStatus === 'ok' || emailStatus === 'manual_ok';

    return (
      <>
        <div 
          className={"flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all " + (!isPushOk ? 'cursor-pointer active:scale-95 hover:brightness-95' : 'cursor-default')}
          style={!isPushOk ? { color: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)' } : { color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)' }}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!isPushOk) setResendConfirmData({ client: botModalClient, level: stepLevel, type: 'push' }); 
          }}
          title={!isPushOk ? "Toca para reenviar solo el Push" : (pushStatus === 'manual_ok' ? "Push reenviado manualmente" : "Push enviado correctamente")}
        >
          {!isPushOk ? (
            <><BellAlertIcon className="w-3 h-3 pointer-events-none text-red-500" /> <span className="pointer-events-none text-red-500">Push Error ✕</span></>
          ) : (
            <><BellAlertIcon className="w-3 h-3 pointer-events-none" /> <span className="pointer-events-none">{pushStatus === 'manual_ok' ? 'Push Manual ✓' : 'Push ✓'}</span></>
          )}
        </div>
        <div 
          className={"flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all " + (!isEmailOk ? 'cursor-pointer active:scale-95 hover:brightness-95' : 'cursor-default')}
          style={!isEmailOk ? { color: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)' } : { color: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)' }}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!isEmailOk) setResendConfirmData({ client: botModalClient, level: stepLevel, type: 'email' }); 
          }}
          title={!isEmailOk ? "Toca para reenviar solo el Correo" : (emailStatus === 'manual_ok' ? "Correo reenviado manualmente" : "Correo enviado correctamente")}
        >
          {!isEmailOk ? (
            <><EnvelopeIcon className="w-3 h-3 pointer-events-none text-red-500" /> <span className="pointer-events-none text-red-500">Email Error ✕</span></>
          ) : (
            <><EnvelopeIcon className="w-3 h-3 pointer-events-none" /> <span className="pointer-events-none">{emailStatus === 'manual_ok' ? 'Email Manual ✓' : 'Email ✓'}</span></>
          )}
        </div>
      </>
    );
  })()}
</div>'''

content = pattern.sub(new_block, content)

with open('frontend/src/components/TrainerChats.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done render step block")
