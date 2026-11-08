package com.profitnessglass.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class TimerActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        
        String action = intent.getAction();
        if (TimerPlugin.ACTION_ADD_TIME.equals(action)) {
            TimerPlugin.handleAddTimeFromBroadcast(context, 30);
        } else if (TimerPlugin.ACTION_SKIP.equals(action)) {
            TimerPlugin.handleSkipFromBroadcast(context);
        }
    }
}
