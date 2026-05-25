package io.pitayacode.agent.features.dialer

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.pitayacode.agent.features.dialer.data.DialerApiService
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DialerModule {

    @Provides
    @Singleton
    fun provideDialerApiService(retrofit: Retrofit): DialerApiService {
        return retrofit.create(DialerApiService::class.java)
    }
}
