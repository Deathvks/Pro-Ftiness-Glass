package com.profitnessglass.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class TimerCompleteReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        TimerPlugin.handleCompleteFromBroadcast(context);
    }
}
