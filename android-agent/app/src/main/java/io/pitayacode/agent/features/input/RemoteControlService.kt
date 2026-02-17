package io.pitayacode.agent.features.input

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import io.pitayacode.agent.features.commands.data.CommandService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RemoteControlService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    companion object {
        var instance: RemoteControlService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i("RemoteControlService", "Accessibility Service Connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // We don't need to read events, just inject them
    }

    override fun onInterrupt() {
        Log.w("RemoteControlService", "Accessibility Service Interrupted")
        instance = null
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    private var lastX = 0f
    private var lastY = 0f
    private var isContinuing = false

    fun injectTouch(x: Float, y: Float, action: String) {
        val path = Path()
        
        when (action) {
            "CLICK" -> {
                path.moveTo(x, y)
                val gestureBuilder = GestureDescription.Builder()
                val stroke = GestureDescription.StrokeDescription(path, 0, 100)
                gestureBuilder.addStroke(stroke)
                dispatchGesture(gestureBuilder.build(), null, null)
                isContinuing = false
            }
            "DOWN" -> {
                path.moveTo(x, y)
                path.lineTo(x, y)
                lastX = x
                lastY = y
                isContinuing = true
                
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    try {
                        val gestureBuilder = GestureDescription.Builder()
                        val stroke = GestureDescription.StrokeDescription(path, 0, 50, true)
                        gestureBuilder.addStroke(stroke)
                        dispatchGesture(gestureBuilder.build(), null, null)
                    } catch (e: Exception) {
                        Log.e("RemoteControlService", "Error dispatching DOWN gesture", e)
                    }
                }
            }
            "MOVE" -> {
                if (isContinuing) {
                    path.moveTo(lastX, lastY)
                    path.lineTo(x, y)
                    val gestureBuilder = GestureDescription.Builder()
                    // Use a short duration for the move segment
                    try {
                        // Assuming API 24+ (Android 7.0) for StrokeDescription, but willContinue is API 26 (Android 8.0)
                        // If we are below API 26, we can't do continuous gestures easily.
                        // We'll assume API 26+ given it's 2026.
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            val stroke = GestureDescription.StrokeDescription(path, 0, 50, true)
                            gestureBuilder.addStroke(stroke)
                            dispatchGesture(gestureBuilder.build(), null, null)
                        } else {
                            // Fallback for older devices (swipes not continuous)
                            Log.w("RemoteControlService", "Continuous gestures require Android 8.0+")
                        }
                    } catch (e: Exception) {
                        Log.e("RemoteControlService", "Error dispatching gesture", e)
                    }
                    lastX = x
                    lastY = y
                }
            }
            "UP" -> {
                if (isContinuing) {
                    path.moveTo(lastX, lastY)
                    path.lineTo(x, y)
                    val gestureBuilder = GestureDescription.Builder()
                    
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        val stroke = GestureDescription.StrokeDescription(path, 0, 50, false)
                        gestureBuilder.addStroke(stroke)
                        dispatchGesture(gestureBuilder.build(), null, null)
                    }
                    isContinuing = false
                }
            }
        }
    }

    fun injectKey(key: String) {
        when (key) {
            "BACK" -> performGlobalAction(GLOBAL_ACTION_BACK)
            "HOME" -> performGlobalAction(GLOBAL_ACTION_HOME)
            "RECENT" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
            "NOTIFICATIONS" -> performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
            "QS" -> performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS)
            "POWER" -> performGlobalAction(GLOBAL_ACTION_POWER_DIALOG)
        }
    }
}
