const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/TrainerChats.jsx", "utf8");

const regex = /const getExactTimeLeft = \(requiredDays\) => \{[\s\S]*?\}\);[\s\n]*\};/s;

const replacement = `const getExactTimeLeft = (requiredDays) => {
  const now = new Date();
  const targetDate = new Date(lastDate.getTime() + requiredDays * 24 * 60 * 60 * 1000);
  const diffMs = targetDate - now;
  
  let finalDate = new Date();
  if (diffMs <= 0) {
    finalDate.setHours(11, 0, 0, 0);
    if (finalDate < now) {
      finalDate.setDate(finalDate.getDate() + 1);
    }
  } else {
    finalDate = targetDate;
  }
  
  const waitMs = finalDate - now;
  const h = Math.floor(waitMs / (1000 * 60 * 60));
  const m = Math.floor((waitMs % (1000 * 60 * 60)) / (1000 * 60));
  const dateStr = finalDate.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  
  return \`El \${dateStr} (en \${h}h \${m}m)\`;
};

const renderStep = (stepLevel, title, description, requiredDays, isFinal = false) => {
  const isCompleted = level >= stepLevel;
  const isActive = level === stepLevel - 1;
  
  const reminderMsg = botModalClient.botReminders?.find(m => m.bot_reminder_level === stepLevel);
  const pStatus = reminderMsg?.bot_push_status || "pending";
  const eStatus = reminderMsg?.bot_email_status || "pending";
  
  const sentDateStr = reminderMsg ? new Date(reminderMsg.created_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  const renderTag = (type, status) => {
    const isPush = type === "push";
    const Icon = isPush ? BellAlertIcon : EnvelopeIcon;
    const label = isPush ? "Push" : "Email";
    
    let style = { color: "#9ca3af", backgroundColor: "rgba(156,163,175,0.1)" };
    let text = \`\${label} Pendiente\`;
    let canRetry = true;
    
    if (status === "ok") {
      style = { color: "#16a34a", backgroundColor: "rgba(22,163,74,0.1)" };
      text = \`\${label} Enviado\`;
      canRetry = false;
    } else if (status === "error") {
      style = { color: "#dc2626", backgroundColor: "rgba(220,38,38,0.1)" };
      text = \`\${label} Error \u274C\`;
    }
    
    return (
      <div 
        className={\`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all \${canRetry ? "cursor-pointer active:scale-95 hover:opacity-80" : "cursor-default"}\`}
        style={style}
        onClick={(e) => { 
          e.stopPropagation(); 
          if (canRetry) setResendConfirmData({ client: botModalClient, level: stepLevel, type }); 
        }}
        title={canRetry ? \`Toca para reenviar \${label}\` : \`\${label} enviado correctamente\`}
      >
        <Icon className="w-3 h-3 pointer-events-none" />
        <span className="pointer-events-none">{text}</span>
      </div>
    );
  };

  return (
    <div className="flex items-start gap-4">
      <div className={"w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10 " + (isCompleted ? "bg-green-500 text-white" : isActive ? "bg-accent text-accent-contrast ring-4 ring-accent/20" : "bg-black/5 dark:bg-white/5 text-text-tertiary border border-glass-border")}>
        {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : <ClockIcon className="w-5 h-5" />}
      </div>
      <div className={"flex-1 pt-2 " + (isActive ? "opacity-100" : "opacity-70")}>
        <h4 className={"font-bold text-sm " + (isCompleted ? "text-green-500" : "text-text-primary")}>{title}</h4>
        <div className="text-xs text-text-secondary mt-0.5 flex flex-col gap-1">
          <span>{description}</span>
          {isCompleted && sentDateStr && <span className="text-green-500/80 text-[10px] font-medium">Ejecutado el {sentDateStr}</span>}
        </div>
        {isCompleted ? (
          !isFinal && (
            <div className="flex items-center gap-3 mt-2">
              {renderTag("push", pStatus)}
              {renderTag("email", eStatus)}
            </div>
          )
        ) : isActive ? (
          <div className="mt-2 text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg inline-block">
            {getExactTimeLeft(requiredDays)}
          </div>
        ) : null}
      </div>
    </div>
  );
};`;

content = content.replace(regex, replacement);
fs.writeFileSync("frontend/src/components/TrainerChats.jsx", content);
console.log("Done");
