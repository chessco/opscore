package io.pitayacode.agent.features.enrollment

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.pitayacode.agent.features.enrollment.data.EnrollmentService
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object EnrollmentModule {

    @Provides
    @Singleton
    fun provideEnrollmentService(retrofit: Retrofit): EnrollmentService {
        return retrofit.create(EnrollmentService::class.java)
    }
}
