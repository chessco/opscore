package io.pitayacode.agent.features.commands

import com.google.gson.Gson
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object CommandModule {

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return Gson()
    }
}
