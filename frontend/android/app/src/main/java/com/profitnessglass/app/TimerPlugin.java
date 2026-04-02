package com.profitnessglass.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTimer")
public class TimerPlugin extends Plugin {
    private static int activeNotificationId = 999;
    private static final String CHANNEL_ID = "native_timer_v14";
    
    // Caché del último color válido enviado desde el frontend
    private static int lastValidColor = Color.parseColor("#00E676"); 

    @PluginMethod
    public void startTimer(PluginCall call) {
        Long endTimeMs = call.getLong("endTimeMs");
        String title = call.getString("title", "Descanso en progreso");
        String colorStr = call.getString("color");

        if (endTimeMs == null) {
            call.reject("Falta endTimeMs");
            return;
        }

        Context context = getContext();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Temporizador", NotificationManager.IMPORTANCE_HIGH);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0}); 
            channel.setSound(null, null);
            channel.setShowBadge(true); 
            manager.createNotificationChannel(channel);
        }

        int appIconId = context.getApplicationInfo().icon;
        Bitmap largeIcon = BitmapFactory.decodeResource(context.getResources(), appIconId);
        int smallIconId = context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName());
        if (smallIconId == 0) smallIconId = appIconId;

        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, pendingFlags);

        long timeRemaining = endTimeMs - System.currentTimeMillis();
        long baseTime = SystemClock.elapsedRealtime() + timeRemaining;

        RemoteViews customLayout = new RemoteViews(context.getPackageName(), R.layout.custom_timer_notification);
        customLayout.setTextViewText(R.id.title, title);
        customLayout.setChronometer(R.id.chronometer, baseTime, null, true);
        
        // Actualizar color si JS lo envía correctamente; si falla en 2º plano, reusa el cacheado
        try {
            if (colorStr != null && colorStr.startsWith("#")) {
                lastValidColor = Color.parseColor(colorStr);
            }
        } catch (Exception ignored) {}
        
        customLayout.setTextColor(R.id.chronometer, lastValidColor);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            customLayout.setChronometerCountDown(R.id.chronometer, true);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(smallIconId)
                .setColor(lastValidColor) 
                .setLargeIcon(largeIcon)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setCustomContentView(customLayout)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MAX);

        try {
            manager.cancel(activeNotificationId);
            activeNotificationId = (int) SystemClock.uptimeMillis();
            manager.notify(activeNotificationId, builder.build());
            call.resolve();
        } catch (Exception e) {
            call.reject("Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopTimer(PluginCall call) {
        Context context = getContext();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.cancel(activeNotificationId);
        call.resolve();
    }
}