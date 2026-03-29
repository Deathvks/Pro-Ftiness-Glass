package com.profitnessglass.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeTimer")
public class TimerPlugin extends Plugin {
    private static final int NOTIFICATION_ID = 999;
    private static final String CHANNEL_ID = "native_timer";

    @PluginMethod
    public void startTimer(PluginCall call) {
        Long endTimeMs = call.getLong("endTimeMs");
        String title = call.getString("title", "Descanso en progreso");

        if (endTimeMs == null) {
            call.reject("Falta endTimeMs");
            return;
        }

        Context context = getContext();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        // Crear canal silencioso para Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Temporizador", NotificationManager.IMPORTANCE_LOW);
            channel.setVibrationPattern(new long[]{0});
            channel.enableVibration(false);
            manager.createNotificationChannel(channel);
        }

        // Búsqueda segura del icono para evitar crasheos con iconos adaptativos modernos
        int iconId = context.getResources().getIdentifier("ic_launcher", "mipmap", context.getPackageName());
        if (iconId == 0) {
            iconId = android.R.drawable.ic_dialog_info; // Fallback infalible del sistema
        }

        // Configurar la notificación nativa con Chronometer
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(iconId)
                .setContentTitle(title)
                .setOngoing(true)          // Persistente
                .setOnlyAlertOnce(true)    // Silencioso al actualizar
                .setWhen(endTimeMs)        // Hora objetivo
                .setUsesChronometer(true); // Activa el cronómetro nativo

        // Cuenta regresiva para Android 7+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            builder.setChronometerCountDown(true);
        }

        try {
            manager.notify(NOTIFICATION_ID, builder.build());
            call.resolve();
        } catch (Exception e) {
            call.reject("Error al lanzar la notificación: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopTimer(PluginCall call) {
        Context context = getContext();
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.cancel(NOTIFICATION_ID);
        call.resolve();
    }
}