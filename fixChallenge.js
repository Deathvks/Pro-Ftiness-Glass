const fs = require('fs');
let content = fs.readFileSync('c:/proyectos/Pro-Ftiness-Glass/backend/services/challengeService.js', 'utf8');

const oldResetLogic =         let needsReset = false;
        if (userChallenge.last_completed_at) {
            const lastCompletedStr = new Date(userChallenge.last_completed_at).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
            
            if (challengeDef.type === 'daily' && lastCompletedStr !== todaySpain) {
                needsReset = true;
            } else if (challengeDef.type === 'weekly' && !isSameSpainWeek(userChallenge.last_completed_at)) {
                needsReset = true;
            }
        };

const newResetLogic =         let needsReset = false;
        const lastUpdated = userChallenge.updatedAt || userChallenge.updated_at;
        if (userChallenge.progress > 0 && lastUpdated) {
            const lastUpdatedStr = new Date(lastUpdated).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
            
            if (challengeDef.type === 'daily' && lastUpdatedStr !== todaySpain) {
                needsReset = true;
            } else if (challengeDef.type === 'weekly' && !isSameSpainWeek(lastUpdated)) {
                needsReset = true;
            }
        };

content = content.replace(oldResetLogic, newResetLogic);
fs.writeFileSync('c:/proyectos/Pro-Ftiness-Glass/backend/services/challengeService.js', content);
