package io.pitayacode.agent

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class PitayaAgentApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Inicialización de logs y componentes core
    }
}
