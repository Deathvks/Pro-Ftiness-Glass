package com.profitnessglass.app;

import android.os.Bundle;
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
    }
}