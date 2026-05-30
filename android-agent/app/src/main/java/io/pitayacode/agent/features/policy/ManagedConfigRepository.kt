package io.pitayacode.agent.features.policy

import android.content.Context
import android.content.RestrictionsManager
import android.os.Bundle
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ManagedConfigRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private val restrictionsManager = context.getSystemService(Context.RESTRICTIONS_SERVICE) as RestrictionsManager

    fun getBaseUrl(): String {
        val bundle = restrictionsManager.applicationRestrictions
        val configuredUrl = bundle.getString("backend_base_url")

        if (!configuredUrl.isNullOrEmpty()) {
            return configuredUrl
        }

        if (io.pitayacode.agent.BuildConfig.FLAVOR == "dev") {
            return "http://10.0.2.2:3005/v1" // Dev Fallback (Emulator)
        }

        // PROD: Must use valid Managed Config with public domain
        // Example: https://opscore-api.pitayacode.io/v1
        throw IllegalStateException("Missing backend_base_url in PROD. Device QUARANTINED.")
    }

    fun getWsUrl(): String {
        val bundle = restrictionsManager.applicationRestrictions
        val configuredUrl = bundle.getString("backend_ws_url")

        if (!configuredUrl.isNullOrEmpty()) {
            return configuredUrl
        }

        if (io.pitayacode.agent.BuildConfig.FLAVOR == "dev") {
            return "ws://10.0.2.2:3005/v1/ws" // Dev Fallback (Emulator)
        }

        // PROD: Must use valid Managed Config with public domain (WSS)
        // Example: wss://opscore-api.pitayacode.io/v1/ws
        throw IllegalStateException("Missing backend_ws_url in PROD. Device QUARANTINED.")
    }

    fun getTenantId(): String? {
        val bundle = restrictionsManager.applicationRestrictions
        val tenantId = bundle.getString("tenant_id")
        
        if (!tenantId.isNullOrEmpty()) {
            return tenantId
        }

        if (io.pitayacode.agent.BuildConfig.FLAVOR == "dev") {
            return "dev-tenant-id" // Dev Fallback
        }
        
        return null
    }

    // Flow to observe changes (requires a BroadcastReceiver to trigger, here we simplify)
    // In a real app, we would register a receiver for ACTION_APPLICATION_RESTRICTIONS_CHANGED
    // and emit to a localized Flow.
}
