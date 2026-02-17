package io.pitayacode.agent.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import dagger.hilt.android.AndroidEntryPoint
import io.pitayacode.agent.ui.theme.PitayaAgentTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @javax.inject.Inject
    lateinit var commandService: io.pitayacode.agent.features.commands.data.CommandService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Connect to Backend (Use 10.0.2.2 for Emulator, or specific IP for device)
        // TODO: Move URL to configuration/settings
        commandService.connect("ws://192.168.100.13:3008/agent", "test-token-123")

        setContent {
            PitayaAgentTheme {
                AgentStatusScreen()
            }
        }
    }
}
