# ProGuard rules for OTP Relay
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.otprelay.data.model.** { *; }
-keep class com.otprelay.data.remote.ApiService { *; }
-keep class com.otprelay.data.local.** { *; }
