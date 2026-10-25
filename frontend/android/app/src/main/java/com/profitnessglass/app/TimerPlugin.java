package com.profitnessglass.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
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

    private static TimerPlugin instance;
    private static Long currentEndTimeMs = null;
    private static String currentTitle = "Descanso entre series";
    private static int lastValidColor = Color.parseColor("#22C55E");

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    @PluginMethod
    public void startTimer(PluginCall call) {
        Long endTimeMs = call.getLong("endTimeMs");
        String title = call.getString("title", "Descanso entre series");
        String colorStr = call.getString("color");

        if (endTimeMs == null) {
            call.reject("Falta endTimeMs");
            return;
        }

        currentEndTimeMs = endTimeMs;
        currentTitle = title;

        try {
            if (colorStr != null && colorStr.startsWith("#")) {
                lastValidColor = Color.parseColor(colorStr);
            }
        } catch (Exception ignored) {}

        startTimerInternal(getContext(), currentTitle, currentEndTimeMs, lastValidColor);
        call.resolve();
    }

    @PluginMethod
    public void stopTimer(PluginCall call) {
        stopTimerInternal(getContext());
        call.resolve();
    }

    public static void startTimerInternal(Context context, String title, long endTimeMs, int accentColor) {
        if (context == null) return;
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

        // Programar alarma exacta para finalización de descanso
        scheduleCompletionAlarm(context, endTimeMs);
    }

    public static void stopTimerInternal(Context context) {
        if (context == null) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(ACTIVE_NOTIFICATION_ID);
        }
        cancelCompletionAlarm(context);
        currentEndTimeMs = null;
    }

    public static void handleAddTimeFromBroadcast(Context context, int seconds) {
        long now = System.currentTimeMillis();
        if (currentEndTimeMs == null || currentEndTimeMs < now) {
            currentEndTimeMs = now;
        }
        currentEndTimeMs += (seconds * 1000L);

        startTimerInternal(context, currentTitle, currentEndTimeMs, lastValidColor);

        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", "addTime");
            ret.put("seconds", seconds);
            ret.put("newEndTimeMs", currentEndTimeMs);
            instance.notifyListeners("timerAction", ret);
        }
    }

    public static void handleSkipFromBroadcast(Context context) {
        stopTimerInternal(context);

        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", "skip");
            instance.notifyListeners("timerAction", ret);
        }
    }

    public static void handleCompleteFromBroadcast(Context context) {
        if (context == null) return;

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(ACTIVE_NOTIFICATION_ID);
        }
        currentEndTimeMs = null;

        // 1. Vibración háptica enérgica de fin de descanso (para notar en bolsillo)
        try {
            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
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
            ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 85);
            toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 350);
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
                    .setColor(lastValidColor)
                    .setContentTitle("¡Descanso terminado! 💪")
                    .setContentText("Es hora de tu siguiente serie. ¡A por todas!")
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setAutoCancel(true)
                    .setContentIntent(contentPendingIntent)
                    .setVibrate(new long[]{0, 400, 150, 400, 150, 600});

            try {
                manager.notify(COMPLETE_NOTIFICATION_ID, completeBuilder.build());
            } catch (Exception ignored) {}
        }

        // 4. Notificar a la instancia JS de la app si está activa
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", "complete");
            instance.notifyListeners("timerAction", ret);
        }
    }

    private static void scheduleCompletionAlarm(Context context, long triggerAtMillis) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, TimerCompleteReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, COMPLETE_ALARM_REQ_CODE, intent, flags);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
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
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, COMPLETE_ALARM_REQ_CODE, intent, flags);

            alarmManager.cancel(pendingIntent);
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
