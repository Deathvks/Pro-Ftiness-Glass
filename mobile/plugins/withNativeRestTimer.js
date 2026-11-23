const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  AndroidConfig,
} = require('expo/config-plugins');

const CUSTOM_TIMER_LAYOUT_XML = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content">

    <TextView
        android:id="@+id/title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_alignParentStart="true"
        android:layout_centerVertical="true"
        style="@style/TextAppearance.Compat.Notification.Title"
        android:textSize="15sp"
        android:text="Descanso" />

    <Chronometer
        android:id="@+id/chronometer"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_alignParentEnd="true"
        android:layout_centerVertical="true"
        android:textSize="22sp"
        android:textStyle="bold" />
</RelativeLayout>
`;

const buildNativeTimerModuleJava = (pkg) => `package ${pkg};

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
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class NativeTimerModule extends ReactContextBaseJavaModule {
    public static final String CHANNEL_ID = "native_timer_channel_v15";
    public static final String COMPLETE_CHANNEL_ID = "native_timer_complete_v2";
    public static final String ACTION_ADD_TIME = "${pkg}.ACTION_ADD_TIME";
    public static final String ACTION_SKIP = "${pkg}.ACTION_SKIP";

    private static final int ACTIVE_NOTIFICATION_ID = 999;
    private static final int COMPLETE_NOTIFICATION_ID = 1000;
    private static final int COMPLETE_ALARM_REQ_CODE = 888;
    static final String EXTRA_END_TIME = "endTimeMs";
    private static final long MAX_ALERT_DELAY_MS = 60_000;

    private static final String DEFAULT_TITLE = "Descanso entre series";
    private static final int DEFAULT_COLOR = Color.parseColor("#22C55E");
    private static ReactApplicationContext activeReactContext;

    public NativeTimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        activeReactContext = reactContext;
    }

    @Override
    public String getName() {
        return "NativeTimer";
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Requerido por NativeEventEmitter en React Native sin advertencias
    }

    @ReactMethod
    public void removeListeners(double count) {
        // Requerido por NativeEventEmitter en React Native sin advertencias
    }

    private static SharedPreferences timerState(Context context) {
        return context.getSharedPreferences("rest_timer", Context.MODE_PRIVATE);
    }

    @ReactMethod
    public void startTimer(ReadableMap options, Promise promise) {
        if (options == null || !options.hasKey("endTimeMs")) {
            promise.reject("E_INVALID_ARGS", "Falta endTimeMs");
            return;
        }

        long endTimeMs = (long) options.getDouble("endTimeMs");
        String title = options.hasKey("title") && !options.isNull("title")
                ? options.getString("title")
                : DEFAULT_TITLE;
        if (title == null || title.trim().isEmpty()) title = DEFAULT_TITLE;

        String colorStr = options.hasKey("color") && !options.isNull("color")
                ? options.getString("color")
                : null;
        int accentColor = DEFAULT_COLOR;
        try {
            if (colorStr != null && colorStr.startsWith("#")) {
                accentColor = Color.parseColor(colorStr);
            }
        } catch (Exception ignored) {}

        boolean sound = !options.hasKey("sound") || options.getBoolean("sound");
        boolean vibrate = !options.hasKey("vibrate") || options.getBoolean("vibrate");

        startTimerInternal(getReactApplicationContext(), title, endTimeMs, accentColor, sound, vibrate);
        promise.resolve(null);
    }

    @ReactMethod
    public void stopTimer(Promise promise) {
        stopTimerInternal(getReactApplicationContext());
        promise.resolve(null);
    }

    @ReactMethod
    public void completeTimer(double endTimeMs, Promise promise) {
        handleCompleteFromBroadcast(getReactApplicationContext(), (long) endTimeMs);
        promise.resolve(null);
    }

    @ReactMethod
    public void getTimerState(Promise promise) {
        WritableMap result = Arguments.createMap();
        long endTimeMs = timerState(getReactApplicationContext()).getLong(EXTRA_END_TIME, 0L);
        result.putDouble(EXTRA_END_TIME, (double) endTimeMs);
        promise.resolve(result);
    }

    private static void emitTimerAction(WritableMap payload) {
        ReactApplicationContext ctx = activeReactContext;
        if (ctx == null || !ctx.hasActiveReactInstance()) return;
        try {
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("nativeTimerAction", payload);
        } catch (Exception ignored) {}
    }

    private static synchronized void startTimerInternal(Context context, String title, long endTimeMs, int accentColor,
                                                        boolean sound, boolean vibrate) {
        if (context == null) return;
        timerState(context).edit()
                .putLong(EXTRA_END_TIME, endTimeMs)
                .putString("title", title)
                .putInt("color", accentColor)
                .putBoolean("sound", sound)
                .putBoolean("vibrate", vibrate)
                .apply();

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        createNotificationChannels(context, manager);

        int appIconId = context.getApplicationInfo().icon;
        Bitmap largeIcon = BitmapFactory.decodeResource(context.getResources(), appIconId);
        int smallIconId = context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName());
        if (smallIconId == 0) smallIconId = appIconId;

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        }
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent contentPendingIntent = PendingIntent.getActivity(context, 0, launchIntent, pendingFlags);

        scheduleCompletionAlarm(context, endTimeMs, contentPendingIntent);
        manager.cancel(COMPLETE_NOTIFICATION_ID);

        Intent addTimeIntent = new Intent(context, NativeTimerActionReceiver.class);
        addTimeIntent.setAction(ACTION_ADD_TIME);
        PendingIntent addTimePendingIntent = PendingIntent.getBroadcast(context, 101, addTimeIntent, pendingFlags);

        Intent skipIntent = new Intent(context, NativeTimerActionReceiver.class);
        skipIntent.setAction(ACTION_SKIP);
        PendingIntent skipPendingIntent = PendingIntent.getBroadcast(context, 102, skipIntent, pendingFlags);

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
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(0, "+30s", addTimePendingIntent)
                .addAction(0, "Saltar", skipPendingIntent);

        try {
            manager.notify(ACTIVE_NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            android.util.Log.w("NativeTimer", "Error publicando notificacion activa: " + e.getMessage());
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

        startTimerInternal(
                context,
                state.getString("title", DEFAULT_TITLE),
                newEndTimeMs,
                state.getInt("color", DEFAULT_COLOR),
                state.getBoolean("sound", true),
                state.getBoolean("vibrate", true)
        );

        WritableMap payload = Arguments.createMap();
        payload.putString("action", "addTime");
        payload.putInt("seconds", seconds);
        payload.putDouble(EXTRA_END_TIME, (double) endTimeMs);
        payload.putDouble("newEndTimeMs", (double) newEndTimeMs);
        emitTimerAction(payload);
    }

    public static synchronized void handleSkipFromBroadcast(Context context) {
        long endTimeMs = timerState(context).getLong(EXTRA_END_TIME, 0L);
        if (endTimeMs == 0) return;
        stopTimerInternal(context);

        WritableMap payload = Arguments.createMap();
        payload.putString("action", "skip");
        payload.putDouble(EXTRA_END_TIME, (double) endTimeMs);
        emitTimerAction(payload);
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

        WritableMap payload = Arguments.createMap();
        payload.putString("action", "complete");
        payload.putDouble(EXTRA_END_TIME, (double) endTimeMs);
        emitTimerAction(payload);
    }

    private static void publishCompletion(Context context, NotificationManager manager, boolean sound, boolean vibrate, int color) {
        boolean customFeedback = !sound || !vibrate || manager == null
                || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && !manager.areNotificationsEnabled());

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

        try {
            if (customFeedback && sound) {
                ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 85);
                toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 350);
                new Handler(Looper.getMainLooper()).postDelayed(toneGen::release, 500);
            }
        } catch (Exception ignored) {}

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
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
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

            Intent intent = new Intent(context, NativeTimerCompleteReceiver.class);
            intent.putExtra(EXTRA_END_TIME, triggerAtMillis);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, COMPLETE_ALARM_REQ_CODE, intent, flags);

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
                try {
                    alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAtMillis, openApp), pendingIntent);
                    return;
                } catch (SecurityException ignored) {}
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        } catch (Exception e) {
            android.util.Log.w("NativeTimer", "No se pudo programar alarma de finalizacion: " + e.getMessage());
        }
    }

    private static void cancelCompletionAlarm(Context context) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, NativeTimerCompleteReceiver.class);
            int flags = PendingIntent.FLAG_NO_CREATE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, COMPLETE_ALARM_REQ_CODE, intent, flags);

            if (pendingIntent != null) alarmManager.cancel(pendingIntent);
        } catch (Exception ignored) {}
    }

    private static void createNotificationChannels(Context context, NotificationManager manager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel activeChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Temporizador de Descanso",
                    NotificationManager.IMPORTANCE_HIGH
            );
            activeChannel.setDescription("Cuenta atrás del descanso entre series con botones rápidos");
            activeChannel.enableVibration(false);
            activeChannel.setSound(null, null);
            activeChannel.setShowBadge(true);
            activeChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(activeChannel);

            NotificationChannel completeChannel = new NotificationChannel(
                    COMPLETE_CHANNEL_ID,
                    "Fin de Descanso",
                    NotificationManager.IMPORTANCE_HIGH
            );
            completeChannel.setDescription("Aviso sonoro y vibración al terminar el descanso");
            completeChannel.enableVibration(true);
            completeChannel.setVibrationPattern(new long[]{0, 400, 150, 400, 150, 600});
            completeChannel.setShowBadge(true);
            completeChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(completeChannel);
        }
    }
}
`;

const buildNativeTimerPackageJava = (pkg) => `package ${pkg};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class NativeTimerPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new NativeTimerModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;

const buildActionReceiverJava = (pkg) => `package ${pkg};

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class NativeTimerActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        String action = intent.getAction();
        if (NativeTimerModule.ACTION_ADD_TIME.equals(action)) {
            NativeTimerModule.handleAddTimeFromBroadcast(context, 30);
        } else if (NativeTimerModule.ACTION_SKIP.equals(action)) {
            NativeTimerModule.handleSkipFromBroadcast(context);
        }
    }
}
`;

const buildCompleteReceiverJava = (pkg) => `package ${pkg};

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class NativeTimerCompleteReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null) {
            NativeTimerModule.handleCompleteFromBroadcast(
                    context,
                    intent.getLongExtra(NativeTimerModule.EXTRA_END_TIME, 0L)
            );
        }
    }
}
`;

function ensurePermission(manifest, permissionName) {
  manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] || [];
  const exists = manifest.manifest['uses-permission'].some(
    (entry) => entry.$ && entry.$['android:name'] === permissionName
  );
  if (!exists) {
    manifest.manifest['uses-permission'].push({
      $: { 'android:name': permissionName },
    });
  }
}

function upsertReceiver(application, receiverObj) {
  application.receiver = application.receiver || [];
  const targetName = receiverObj.$['android:name'];
  const idx = application.receiver.findIndex((r) => r.$ && r.$['android:name'] === targetName);
  if (idx >= 0) {
    application.receiver[idx] = receiverObj;
  } else {
    application.receiver.push(receiverObj);
  }
}

const withNativeRestTimer = (config) => {
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const pkg = cfg.android?.package || 'com.profitnessglass.app';

    ensurePermission(manifest, 'android.permission.POST_NOTIFICATIONS');
    ensurePermission(manifest, 'android.permission.VIBRATE');
    ensurePermission(manifest, 'android.permission.SCHEDULE_EXACT_ALARM');

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    upsertReceiver(application, {
      $: {
        'android:name': '.NativeTimerActionReceiver',
        'android:exported': 'false',
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': `${pkg}.ACTION_ADD_TIME` } },
            { $: { 'android:name': `${pkg}.ACTION_SKIP` } },
          ],
        },
      ],
    });
    upsertReceiver(application, {
      $: {
        'android:name': '.NativeTimerCompleteReceiver',
        'android:exported': 'false',
      },
    });

    return cfg;
  });

  config = withMainApplication(config, (cfg) => {
    const pkg = cfg.android?.package || 'com.profitnessglass.app';
    let contents = cfg.modResults.contents;
    const isKotlin = cfg.modResults.language === 'kt';

    if (!contents.includes(`${pkg}.NativeTimerPackage`) && !contents.includes('NativeTimerPackage()')) {
      const importLine = isKotlin
        ? `import ${pkg}.NativeTimerPackage`
        : `import ${pkg}.NativeTimerPackage;`;
      if (!contents.includes(importLine)) {
        contents = contents.replace(
          /^(package\s+[^\r\n]+)/m,
          `$1\n${importLine}`
        );
      }

      if (isKotlin) {
        contents = contents.replace(
          /PackageList\(this\)\.packages\.apply\s*\{/,
          `PackageList(this).packages.apply {\n              add(NativeTimerPackage())`
        );
      } else {
        contents = contents.replace(
          /List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);/,
          `List<ReactPackage> packages = new PackageList(this).getPackages();\n      packages.add(new NativeTimerPackage());`
        );
      }
      cfg.modResults.contents = contents;
    }

    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package || 'com.profitnessglass.app';
      const resDir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res');
      const layoutDir = path.join(resDir, 'layout');
      const drawableDir = path.join(resDir, 'drawable');
      const javaDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/java',
        ...pkg.split('.')
      );

      fs.mkdirSync(layoutDir, { recursive: true });
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.mkdirSync(javaDir, { recursive: true });

      fs.writeFileSync(path.join(layoutDir, 'custom_timer_notification.xml'), CUSTOM_TIMER_LAYOUT_XML, 'utf8');

      const iconSrc = path.join(cfg.modRequest.projectRoot, 'assets/images/ic_notification.png');
      if (fs.existsSync(iconSrc)) {
        fs.copyFileSync(iconSrc, path.join(drawableDir, 'ic_notification.png'));
      }

      fs.writeFileSync(path.join(javaDir, 'NativeTimerModule.java'), buildNativeTimerModuleJava(pkg), 'utf8');
      fs.writeFileSync(path.join(javaDir, 'NativeTimerPackage.java'), buildNativeTimerPackageJava(pkg), 'utf8');
      fs.writeFileSync(path.join(javaDir, 'NativeTimerActionReceiver.java'), buildActionReceiverJava(pkg), 'utf8');
      fs.writeFileSync(path.join(javaDir, 'NativeTimerCompleteReceiver.java'), buildCompleteReceiverJava(pkg), 'utf8');

      return cfg;
    },
  ]);

  return config;
};

module.exports = withNativeRestTimer;
