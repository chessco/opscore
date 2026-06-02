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

        // Backend connection is now handled dynamically in AgentViewModel when config is saved.

        setContent {
            PitayaAgentTheme {
                AgentStatusScreen()
            }
        }
    }
}
