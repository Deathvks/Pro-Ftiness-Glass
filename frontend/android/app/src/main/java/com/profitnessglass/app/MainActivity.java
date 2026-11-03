package com.profitnessglass.app;

import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Forzamos el tema sin barra ANTES de que Android dibuje la pantalla
        setTheme(R.style.AppTheme_NoActionBar);

        // Registramos el plugin nativo del temporizador
        registerPlugin(TimerPlugin.class);
        
        // Habilita la vista de extremo a extremo para Android 15+
        EdgeToEdge.enable(this);
        
        super.onCreate(savedInstanceState);

        // Si se actualizó la app desde Play Store (cambio de versionCode), limpiar la caché y almacenamiento de WebView
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            long currentVersionCode = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) 
                ? pInfo.getLongVersionCode() 
                : pInfo.versionCode;

            SharedPreferences prefs = getSharedPreferences("pfg_app_prefs", MODE_PRIVATE);
            long lastVersionCode = prefs.getLong("last_version_code", -1);
            if (lastVersionCode == -1) {
                // Nueva instalación o reinstalación: garantizar un inicio limpio evitando que copias corruptas de Google Drive bloqueen la app
                try {
                    android.webkit.WebStorage.getInstance().deleteAllData();
                } catch (Exception ignored) {}
            }
            if (lastVersionCode != currentVersionCode) {
                // Actualización de versión: purgar WebView WebStorage (localStorage, sessionStorage, IndexedDB)
                // y la caché de archivos para evitar bucles de renderizado con estados corruptos de versiones previas.
                try {
                    android.webkit.WebStorage.getInstance().deleteAllData();
                } catch (Exception ignored) {}

                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.clearCache(true);
                }
                prefs.edit().putLong("last_version_code", currentVersionCode).apply();
            }
        } catch (Exception ignored) {}
    }
}
