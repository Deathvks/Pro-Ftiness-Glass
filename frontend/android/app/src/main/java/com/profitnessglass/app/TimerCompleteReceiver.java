package com.profitnessglass.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class TimerCompleteReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null) {
            TimerPlugin.handleCompleteFromBroadcast(context, intent.getLongExtra(TimerPlugin.EXTRA_END_TIME, 0L));
        }
    }
}
