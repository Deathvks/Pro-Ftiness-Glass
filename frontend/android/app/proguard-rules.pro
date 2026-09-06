# Capacitor Core
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin

# Cordova
-keep class org.apache.cordova.** { *; }

# Google Auth Plugin
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.** { *; }

# Firebase / Push Notifications
-keep class com.google.firebase.** { *; }
-keep class com.google.firebase.messaging.** { *; }

# Capgo / Status Bar plugins
-keep class ee.forgr.capacitor_navigation_bar.** { *; }
-keep class com.capacitorjs.plugins.statusbar.** { *; }

# Preserve JS Interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve stack traces for debugging (Google Play requires this to map crashes)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Material Design
-keep class com.google.android.material.** { *; }
