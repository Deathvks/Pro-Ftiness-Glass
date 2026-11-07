package com.profitnessglass.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTimer")
public class TimerPlugin extends Plugin {
    public static final String CHANNEL_ID = "native_timer_channel_v15";
    public static final String COMPLETE_CHANNEL_ID = "native_timer_complete_v2";
    public static final String ACTION_ADD_TIME = "com.profitnessglass.app.ACTION_ADD_TIME";
    public static final String ACTION_SKIP = "com.profitnessglass.app.ACTION_SKIP";

    private static final int ACTIVE_NOTIFICATION_ID = 999;
    private static final int COMPLETE_NOTIFICATION_ID = 1000;
    private static final int COMPLETE_ALARM_REQ_CODE = 888;
    static final String EXTRA_END_TIME = "endTimeMs";
    private static final long MAX_ALERT_DELAY_MS = 60_000;

    private static TimerPlugin instance;
    private static final String DEFAULT_TITLE = "Descanso entre series";
    private static final int DEFAULT_COLOR = Color.parseColor("#22C55E");

    private static SharedPreferences timerState(Context context) {
        return context.getSharedPreferences("rest_timer", Context.MODE_PRIVATE);
    }

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    @PluginMethod
    public void startTimer(PluginCall call) {
        Long endTimeMs = call.getLong("endTimeMs");
        String title = call.getString("title", DEFAULT_TITLE);
        String colorStr = call.getString("color");

        if (endTimeMs == null) {
            call.reject("Falta endTimeMs");
            return;
        }

        int accentColor = DEFAULT_COLOR;
        try {
            if (colorStr != null && colorStr.startsWith("#")) {
                accentColor = Color.parseColor(colorStr);
            }
        } catch (Exception ignored) {}

        startTimerInternal(getContext(), title, endTimeMs, accentColor,
                call.getBoolean("sound", true), call.getBoolean("vibrate", true));
        call.resolve();
    }

    @PluginMethod
    public void stopTimer(PluginCall call) {
        stopTimerInternal(getContext());
        call.resolve();
    }

    @PluginMethod
    public void completeTimer(PluginCall call) {
        handleCompleteFromBroadcast(getContext(), call.getLong(EXTRA_END_TIME, 0L));
        call.resolve();
    }

    @PluginMethod
    public void getTimerState(PluginCall call) {
        JSObject result = new JSObject();
        result.put(EXTRA_END_TIME, timerState(getContext()).getLong(EXTRA_END_TIME, 0L));
        call.resolve(result);
    }

    private static synchronized void startTimerInternal(Context context, String title, long endTimeMs, int accentColor,
                                                        boolean sound, boolean vibrate) {
        if (context == null) return;
        timerState(context).edit().putLong(EXTRA_END_TIME, endTimeMs).putString("title", title)
                .putInt("color", accentColor).putBoolean("sound", sound).putBoolean("vibrate", vibrate).apply();

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        createNotificationChannels(context, manager);

        int appIconId = context.getApplicationInfo().icon;
        Bitmap largeIcon = BitmapFactory.decodeResource(context.getResources(), appIconId);
        int smallIconId = context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName());
        if (smallIconId == 0) smallIconId = appIconId;

        // Intent para abrir la aplicación al tocar la notificación
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        }
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent contentPendingIntent = PendingIntent.getActivity(context, 0, launchIntent, pendingFlags);

        scheduleCompletionAlarm(context, endTimeMs, contentPendingIntent);
        manager.cancel(COMPLETE_NOTIFICATION_ID);

        // Intent para botón "+30s"
        Intent addTimeIntent = new Intent(context, TimerActionReceiver.class);
        addTimeIntent.setAction(ACTION_ADD_TIME);
        PendingIntent addTimePendingIntent = PendingIntent.getBroadcast(context, 101, addTimeIntent, pendingFlags);

        // Intent para botón "Saltar"
        Intent skipIntent = new Intent(context, TimerActionReceiver.class);
        skipIntent.setAction(ACTION_SKIP);
        PendingIntent skipPendingIntent = PendingIntent.getBroadcast(context, 102, skipIntent, pendingFlags);

        // Cálculo de tiempo para Chronometer
        long timeRemaining = endTimeMs - System.currentTimeMillis();
        long baseTime = SystemClock.elapsedRealtime() + timeRemaining;

        RemoteViews customLayout = new RemoteViews(context.getPackageName(), R.layout.custom_timer_notification);
        customLayout.setTextViewText(R.id.title, title);
        customLayout.setChronometer(R.id.chronometer, baseTime, null, true);
        customLayout.setTextColor(R.id.chronometer, accentColor);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            customLayout.setChronometerCountDown(R.id.chronometer, true);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(smallIconId)
                .setColor(accentColor)
                .setLargeIcon(largeIcon)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setCustomContentView(customLayout)
                .setContentIntent(contentPendingIntent)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS)
                .addAction(0, "+30s", addTimePendingIntent)
                .addAction(0, "Saltar", skipPendingIntent);

        try {
            manager.notify(ACTIVE_NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            android.util.Log.w("NativeTimer", "Error publicando notificación activa: " + e.getMessage());
        }
    }

    private static synchronized void stopTimerInternal(Context context) {
        if (context == null) return;
        timerState(context).edit().clear().apply();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(ACTIVE_NOTIFICATION_ID);
        }
        cancelCompletionAlarm(context);
    }

    public static synchronized void handleAddTimeFromBroadcast(Context context, int seconds) {
        SharedPreferences state = timerState(context);
        long endTimeMs = state.getLong(EXTRA_END_TIME, 0L);
        if (endTimeMs == 0) return;
        long newEndTimeMs = Math.max(endTimeMs, System.currentTimeMillis()) + seconds * 1000L;

        startTimerInternal(context, state.getString("title", DEFAULT_TITLE), newEndTimeMs,
                state.getInt("color", DEFAULT_COLOR), state.getBoolean("sound", true), state.getBoolean("vibrate", true));

        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", "addTime");
            ret.put("seconds", seconds);
            ret.put(EXTRA_END_TIME, endTimeMs);
            ret.put("newEndTimeMs", newEndTimeMs);
            instance.notifyListeners("timerAction", ret);
        }
    }

    public static synchronized void handleSkipFromBroadcast(Context context) {
        long endTimeMs = timerState(context).getLong(EXTRA_END_TIME, 0L);
        if (endTimeMs == 0) return;
        stopTimerInternal(context);

        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", "skip");
            ret.put(EXTRA_END_TIME, endTimeMs);
            instance.notifyListeners("timerAction", ret);
        }
    }

    public static synchronized void handleCompleteFromBroadcast(Context context, long endTimeMs) {
        SharedPreferences state = timerState(context);
        long now = System.currentTimeMillis();
        if (endTimeMs == 0 || endTimeMs != state.getLong(EXTRA_END_TIME, 0L) || now < endTimeMs) return;

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        boolean sound = state.getBoolean("sound", true);
        boolean vibrate = state.getBoolean("vibrate", true);
        int color = state.getInt("color", DEFAULT_COLOR);
        stopTimerInternal(context);

        if (now - endTimeMs <= MAX_ALERT_DELAY_MS) {
            publishCompletion(context, manager, sound, vibrate, color);
        }

        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", "complete");
            ret.put(EXTRA_END_TIME, endTimeMs);
            instance.notifyListeners("timerAction", ret);
        }
    }

    private static void publishCompletion(Context context, NotificationManager manager, boolean sound, boolean vibrate, int color) {
        boolean customFeedback = !sound || !vibrate || manager == null
                || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && !manager.areNotificationsEnabled());

        // 1. Vibración háptica enérgica de fin de descanso (para notar en bolsillo)
        try {
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (customFeedback && vibrate && vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = new long[]{0, 400, 150, 400, 150, 600};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
                } else {
                    vibrator.vibrate(pattern, -1);
                }
            }
        } catch (Exception ignored) {}

        // 2. Doble pitido suave de aviso
        try {
            if (customFeedback && sound) {
                ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 85);
                toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 350);
                new Handler(Looper.getMainLooper()).postDelayed(toneGen::release, 500);
            }
        } catch (Exception ignored) {}

        // 3. Notificación flotante de fin de descanso (Heads-Up)
        if (manager != null) {
            createNotificationChannels(context, manager);

            int appIconId = context.getApplicationInfo().icon;
            int smallIconId = context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName());
            if (smallIconId == 0) smallIconId = appIconId;

            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (launchIntent != null) {
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            }
            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent contentPendingIntent = PendingIntent.getActivity(context, 0, launchIntent, pendingFlags);

            NotificationCompat.Builder completeBuilder = new NotificationCompat.Builder(context, COMPLETE_CHANNEL_ID)
                    .setSmallIcon(smallIconId)
                    .setColor(color)
                    .setContentTitle("¡Descanso terminado! 💪")
                    .setContentText("Es hora de tu siguiente serie. ¡A por todas!")
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setDefaults(NotificationCompat.DEFAULT_SOUND)
                    .setAutoCancel(true)
                    .setSilent(customFeedback)
                    .setContentIntent(contentPendingIntent)
                    .setVibrate(new long[]{0, 400, 150, 400, 150, 600});

            try {
                manager.notify(COMPLETE_NOTIFICATION_ID, completeBuilder.build());
            } catch (Exception ignored) {}
        }
    }

    private static void scheduleCompletionAlarm(Context context, long triggerAtMillis, PendingIntent openApp) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, TimerCompleteReceiver.class);
            intent.putExtra(EXTRA_END_TIME, triggerAtMillis);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, COMPLETE_ALARM_REQ_CODE, intent, flags);

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
                try {
                    alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAtMillis, openApp), pendingIntent);
                    return;
                } catch (SecurityException ignored) {
                    // El permiso puede cambiar entre la comprobación y la llamada.
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        } catch (Exception e) {
            android.util.Log.w("NativeTimer", "No se pudo programar alarma de finalización: " + e.getMessage());
        }
    }

    private static void cancelCompletionAlarm(Context context) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, TimerCompleteReceiver.class);
            int flags = PendingIntent.FLAG_NO_CREATE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, COMPLETE_ALARM_REQ_CODE, intent, flags);

            if (pendingIntent != null) alarmManager.cancel(pendingIntent);
        } catch (Exception ignored) {}
    }

    private static void createNotificationChannels(Context context, NotificationManager manager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Canal para cuenta atrás en vivo
            NotificationChannel activeChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Temporizador de Descanso",
                    NotificationManager.IMPORTANCE_HIGH
            );
            activeChannel.setDescription("Cuenta atrás del descanso entre series con botones rápidos");
            activeChannel.enableVibration(false);
            activeChannel.setSound(null, null);
            activeChannel.setShowBadge(true);
            manager.createNotificationChannel(activeChannel);

            // Canal para alerta de finalización (con sonido y vibración)
            NotificationChannel completeChannel = new NotificationChannel(
                    COMPLETE_CHANNEL_ID,
                    "Fin de Descanso",
                    NotificationManager.IMPORTANCE_HIGH
            );
            completeChannel.setDescription("Aviso sonoro y vibración al terminar el descanso");
            completeChannel.enableVibration(true);
            completeChannel.setVibrationPattern(new long[]{0, 400, 150, 400, 150, 600});
            completeChannel.setShowBadge(true);
            manager.createNotificationChannel(completeChannel);
        }
    }
}
